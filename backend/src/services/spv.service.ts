/**
 * SPV Service – Business logic for creating, fetching, and gated decryption
 * of SPV (Sealed Provenance Vault / Proof Verification) records on BOT Chain.
 *
 * NFT-gated decryption flow (accessType === 'nft_holders_only'):
 *   1. Load the SPV record from MongoDB.
 *   2. Call checkNFTOwnership() which queries the ERC-721/ERC-1155 `balanceOf`
 *      function on the BOT Chain smart contract via BOT Chain JSON-RPC.
 *   3. Allow decryption only if the requester's on-chain balance > 0.
 *
 * Configuration is sourced from environment variables via env.ts.
 */
import mongoose from "mongoose";
import { ethers } from "ethers";
import { StatusCodes } from "http-status-codes";

import { env } from "../config/env";
import { SPVModel } from "../models/spv.model";
import { AppError } from "../errors/AppError";
import type {
  ISPVRecord,
  CreateSPVRecordDTO,
  NFTOwnershipResult,
} from "../types/spv.types";

// ---------------------------------------------------------------------------
// BOT Chain JSON-RPC Provider
// ---------------------------------------------------------------------------
const botChainProvider = new ethers.JsonRpcProvider(env.BOTCHAIN_RPC_URL, {
  chainId: env.BOTCHAIN_CHAIN_ID,
  name: env.BOTCHAIN_CHAIN_ID === 677 ? "botchain" : "bohr-testnet",
});

// Minimal ERC-721 / ERC-20 ABI for balance check
const ERC721_BALANCE_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
];

// ---------------------------------------------------------------------------
// Private helpers
// ---------------------------------------------------------------------------

/**
 * Validates that the given string is a valid MongoDB ObjectId.
 */
function assertValidObjectId(id: string): void {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError(
      `Invalid record ID: '${id}'`,
      StatusCodes.BAD_REQUEST,
      "INVALID_ID"
    );
  }
}

/**
 * Checks whether `userAddress` holds any tokens in the NFT/provenance
 * contract at `nftContractAddress` on BOT Chain.
 *
 * Calls `balanceOf(address)` via BOT Chain JSON-RPC.
 */
async function checkNFTOwnership(
  userAddress: string,
  nftContractAddress: string
): Promise<NFTOwnershipResult> {
  try {
    // If not a valid EVM address format, return 0 balance safely
    if (!ethers.isAddress(userAddress) || !ethers.isAddress(nftContractAddress)) {
      console.warn(
        "[SPVService] Address format check: non-EVM address provided (%s, %s)",
        userAddress,
        nftContractAddress
      );
      return { holdsToken: false, balance: "0" };
    }

    const nftContract = new ethers.Contract(
      nftContractAddress,
      ERC721_BALANCE_ABI,
      botChainProvider
    );

    const rawBalance: bigint = await nftContract.balanceOf(userAddress);
    const balance = rawBalance != null ? rawBalance : 0n;

    return {
      holdsToken: balance > 0n,
      balance: balance.toString(),
    };
  } catch (err: unknown) {
    console.error("[SPVService] BOT Chain NFT ownership check error:", err);

    // If contract reverted or address doesn't exist, treat as no ownership
    if (
      err instanceof Error &&
      (err.message.includes("revert") ||
        err.message.includes("BAD_DATA") ||
        err.message.includes("CALL_EXCEPTION"))
    ) {
      return { holdsToken: false, balance: "0" };
    }

    // RPC unreachable or fatal network error → propagate as 502
    throw new AppError(
      "Failed to verify NFT ownership via BOT Chain RPC. Please try again.",
      StatusCodes.BAD_GATEWAY,
      "BOTCHAIN_RPC_ERROR"
    );
  }
}

// ---------------------------------------------------------------------------
// Public service methods
// ---------------------------------------------------------------------------

/**
 * Persists a new SPV record.
 *
 * @throws {AppError} 400 – if `nftContractAddress` is absent when required.
 * @throws {AppError} 409 – if a record with the same `contentHash` exists.
 */
async function createSPVRecord(dto: CreateSPVRecordDTO): Promise<ISPVRecord> {
  if (dto.accessType === "nft_holders_only" && !dto.nftContractAddress) {
    throw new AppError(
      "nftContractAddress is required when accessType is 'nft_holders_only'",
      StatusCodes.BAD_REQUEST,
      "MISSING_NFT_CONTRACT"
    );
  }

  const existing = await SPVModel.findOne({ contentHash: dto.contentHash });
  if (existing) {
    throw new AppError(
      "A record with this contentHash already exists",
      StatusCodes.CONFLICT,
      "DUPLICATE_CONTENT_HASH"
    );
  }

  const record = await SPVModel.create(dto);
  return record.toObject<ISPVRecord>();
}

/**
 * Retrieves a single SPV record by MongoDB ObjectId.
 *
 * @throws {AppError} 400 – if `id` is not a valid ObjectId.
 * @throws {AppError} 404 – if no record exists for the given `id`.
 */
async function getSPVRecord(id: string): Promise<ISPVRecord> {
  assertValidObjectId(id);

  const record = await SPVModel.findById(id).lean<ISPVRecord>();
  if (!record) {
    throw new AppError(
      `SPV record not found: '${id}'`,
      StatusCodes.NOT_FOUND,
      "RECORD_NOT_FOUND"
    );
  }

  return record;
}

/**
 * Decrypts (returns the `encryptedPayload` of) an SPV record after performing
 * access-control checks appropriate to the record's `accessType`:
 *
 * - `public`           → no check, payload returned immediately.
 * - `private`          → requester must be the record owner.
 * - `nft_holders_only` → requester must hold ≥1 token in the NFT contract on BOT Chain.
 *
 * @param id           MongoDB ObjectId of the SPV record.
 * @param userAddress  BOT Chain 0x address of the requester.
 * @returns The `encryptedPayload` string on success.
 */
async function decryptSPVRecord(
  id: string,
  userAddress: string
): Promise<string> {
  assertValidObjectId(id);

  const record = await SPVModel.findById(id).lean<ISPVRecord>();
  if (!record) {
    throw new AppError(
      `SPV record not found: '${id}'`,
      StatusCodes.NOT_FOUND,
      "RECORD_NOT_FOUND"
    );
  }

  switch (record.accessType) {
    case "public":
      return record.encryptedPayload;

    case "private":
      // Compare addresses case-insensitively for EVM addresses
      if (
        userAddress.toLowerCase() !== record.ownerPublicKey.toLowerCase()
      ) {
        throw new AppError(
          "Access denied: you are not the owner of this record",
          StatusCodes.FORBIDDEN,
          "NOT_OWNER"
        );
      }
      return record.encryptedPayload;

    case "nft_holders_only": {
      const contractAddress = record.nftContractAddress!;
      const ownership = await checkNFTOwnership(
        userAddress,
        contractAddress
      );

      if (!ownership.holdsToken) {
        throw new AppError(
          "Access denied: NFT ownership required on BOT Chain to decrypt this record",
          StatusCodes.FORBIDDEN,
          "NFT_OWNERSHIP_REQUIRED"
        );
      }

      console.info(
        "[SPVService] BOT Chain NFT access granted for %s (balance: %s) on contract %s",
        userAddress,
        ownership.balance,
        contractAddress
      );

      return record.encryptedPayload;
    }

    default: {
      const _exhaustive: never = record.accessType;
      throw new AppError(
        `Unknown accessType: '${_exhaustive}'`,
        StatusCodes.INTERNAL_SERVER_ERROR,
        "UNKNOWN_ACCESS_TYPE"
      );
    }
  }
}

export const spvService = {
  createSPVRecord,
  getSPVRecord,
  decryptSPVRecord,
} as const;
