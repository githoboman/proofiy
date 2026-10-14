# BOT Chain Proof Verification Pipeline Documentation

The Verification Pipeline is the core logic of the **BOT Chain Proof** protocol, deployed natively on **BOT Chain** (100% EVM-compatible Layer 1 for DePIN and AI applications) using Solidity smart contracts.

The pipeline ensures all digital authenticity and AI agent provenance records are verified against authorized oracle providers and trusted execution environment (TEE) hardware measurements.

---

## Architecture Overview

```
                      ┌──────────────────────┐
                      │    Client / Agent    │
                      └──────────┬───────────┘
                                 │
                     1. Submit Verification Request
                                 ▼
                      ┌──────────────────────┐
                      │  ProofRegistry.sol   │ (BOT Chain EVM)
                      │ (Status: Pending)    │
                      └──────────┬───────────┘
                                 │
                     2. Off-chain TEE processing
                                 ▼
                 ┌────────────────────────────────┐
                 │  Confidential TEE Enclave Node │
                 │  - Validates Manifest / Media  │
                 │  - Signs Attestation (ECDSA)   │
                 └───────────────┬────────────────┘
                                 │
                     3. processVerification(...)
                                 ▼
                      ┌──────────────────────┐
                      │  ProofRegistry.sol   │ (State Guard, Sig Check,
                      │ (Status: Verified)   │  Provider Auth, TEE Auth)
                      └──────────┬───────────┘
                                 │
                     4. Mint Provenance NFT
                                 ▼
                 ┌────────────────────────────────┐
                 │   ProvenanceCertificate.sol    │ (ERC-721 on BOT Chain)
                 │   - Bound to Content Hash      │
                 │   - Optional Agent Identity    │ (ERC-8004 / Agent OS)
                 └────────────────────────────────┘
```

---

## Workflow Steps

When an off-chain oracle provider processes a verification request, it submits an `Attestation` payload and an ECDSA `signature` to the `processVerification` function on the `ProofRegistry` contract:

1. **Request Retrieval**: The contract lookups the `VerificationRequest` using `requestId` (`bytes32`).
2. **State Guard**: Ensures the request is in the `Pending` state. If already `Verified` or `Rejected`, the transaction reverts with `AlreadyProcessed`.
3. **Signature Validation**: Recovers the signer address via ECDSA `ecrecover` on `keccak256(abi.encodePacked(...))` with Ethereum Signed Message prefix.
4. **Registry Authorization Check**:
   - **Provider Authorization**: Validates that the recovered signer address is currently authorized in `authorizedProviders`.
   - **TEE Hash Authorization**: Validates that the TEE hardware measurement hash (`codeMeasurementHash`) is currently authorized in `authorizedTeeHashes`.
5. **Attestation Correspondence**: Ensures `attestation.requestId` matches the target request.
6. **State Transition**:
   - **Success**: State transitions atomically to `Verified`, and `RequestProcessed(requestId, Status.Verified, "")` is emitted.
   - **Failure**: State transitions atomically to `Rejected` with a specific error reason (e.g., `"Unauthorized provider"` or `"Invalid TEE measurement hash"`).

---

## BOT Chain Specifications

| Parameter | Specification |
|-----------|---------------|
| **Network Type** | Layer 1 EVM (PoSA Consensus) |
| **Mainnet Chain ID** | `677` (`0x2a5`) |
| **Mainnet RPC** | `https://rpc.botchain.ai` |
| **Mainnet Explorer** | `https://scan.botchain.ai` |
| **Testnet Chain ID** | `968` (`0x3c8`) (Bohr Testnet) |
| **Testnet RPC** | `https://rpc.bohr.life` |
| **Testnet Explorer** | `https://scan.bohr.life` |
| **Block Time** | ~0.75 seconds |
| **Finality** | 2-block deterministic finality |
| **Gas Fee Token** | `BOT` (Average fee ~$0.06) |
| **Agent OS Support** | ERC-8004 (Agent Identity) & ERC-4337 (Agent Wallet) |
