/**
 * Domain types for the SPV (Sealed Provenance Vault / Proof Verification) service.
 * Supports BOT Chain EVM addresses and NFT access control.
 */

/** Access control modes supported by an SPV record. */
export type AccessType = "public" | "private" | "nft_holders_only";

/**
 * Shape of an SPV record as stored in MongoDB.
 * The `_id` field is added by Mongoose at persistence time.
 */
export interface ISPVRecord {
  _id?: string;
  /** BOT Chain EVM 0x-address (or legacy public key) of the record creator / owner. */
  ownerPublicKey: string;
  /** SHA-256 hex digest of the original content. */
  contentHash: string;
  /** SHA-256 hex digest of the attached manifest. */
  manifestHash: string;
  /** AES-GCM ciphertext of the content hash, base64-encoded. */
  encryptedPayload: string;
  /** IPFS CID or MongoDB ObjectId referencing the off-chain storage entry. */
  storageId: string;
  /** Who may request decryption of this record. */
  accessType: AccessType;
  /**
   * BOT Chain smart contract address (ERC-721 / ERC-1155) of the NFT collection.
   * Required when `accessType === 'nft_holders_only'`.
   */
  nftContractAddress?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

/** Payload for POST /api/v1/spv/records */
export interface CreateSPVRecordDTO {
  ownerPublicKey: string;
  contentHash: string;
  manifestHash: string;
  encryptedPayload: string;
  storageId: string;
  accessType: AccessType;
  nftContractAddress?: string;
}

/** Payload for POST /api/v1/spv/records/:id/decrypt */
export interface DecryptRequestDTO {
  /** BOT Chain address or wallet public key */
  address?: string;
  botChainAddress?: string;
  stellarPublicKey?: string;
}

/** Standard JSON envelope returned by every endpoint. */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/** Internal result of the BOT Chain NFT ownership check. */
export interface NFTOwnershipResult {
  holdsToken: boolean;
  /** String representation of the raw on-chain balance. */
  balance: string;
}
