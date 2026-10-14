# BOT Chain Proof Registry Events

This document details the Solidity events emitted by the **BOT Chain Proof** smart contracts on BOT Chain. These events follow standard EVM indexing conventions (`topics` and `indexed` fields) allowing indexers, GraphQL subgraphs, and backend webhooks to subscribe seamlessly via standard EVM `eth_subscribe` or JSON-RPC log filters.

---

## 1. ProofRegistry Contracts Events

Contract interface: `IProofRegistry.sol` / `ProofRegistry.sol`

### `ProviderAdded`
Emitted when an authorized Oracle Provider is added to the registry by the contract owner.

```solidity
event ProviderAdded(address indexed provider);
```
- **Topic 0**: `keccak256("ProviderAdded(address)")`
- **Topic 1**: `address` (The 20-byte EVM address of the authorized provider)

### `ProviderRemoved`
Emitted when an Oracle Provider is revoked or removed.

```solidity
event ProviderRemoved(address indexed provider);
```
- **Topic 0**: `keccak256("ProviderRemoved(address)")`
- **Topic 1**: `address` (The 20-byte EVM address of the revoked provider)

### `TeeHashAdded`
Emitted when a new Trusted Execution Environment (TEE) binary measurement hash is authorized.

```solidity
event TeeHashAdded(bytes32 indexed teeHash);
```
- **Topic 0**: `keccak256("TeeHashAdded(bytes32)")`
- **Topic 1**: `bytes32` (The SHA-256 measurement hash of the enclave binary)

### `TeeHashRemoved`
Emitted when an existing TEE hash is revoked.

```solidity
event TeeHashRemoved(bytes32 indexed teeHash);
```
- **Topic 0**: `keccak256("TeeHashRemoved(bytes32)")`
- **Topic 1**: `bytes32` (The revoked measurement hash)

### `RequestSubmitted`
Emitted when a new verification job is registered on-chain.

```solidity
event RequestSubmitted(bytes32 indexed requestId, address indexed owner, bytes32 contentHash);
```
- **Topic 0**: `keccak256("RequestSubmitted(bytes32,address,bytes32)")`
- **Topic 1**: `bytes32 requestId`
- **Topic 2**: `address owner`
- **Data**: `bytes32 contentHash`

### `RequestProcessed`
Emitted when an off-chain oracle provider submits the TEE attestation and signature.

```solidity
event RequestProcessed(bytes32 indexed requestId, VerificationStatus status, string reason);
```
- **Topic 0**: `keccak256("RequestProcessed(bytes32,uint8,string)")`
- **Topic 1**: `bytes32 requestId`
- **Data**: `uint8 status` (`0 = Pending`, `1 = Verified`, `2 = Rejected`), `string reason`

---

## 2. ProvenanceCertificate Events

Contract interface: `IProvenanceCertificate.sol` / `ProvenanceCertificate.sol` (ERC-721)

### `CertificateMinted`
Emitted upon successful minting of a verified provenance NFT.

```solidity
event CertificateMinted(
    uint256 indexed tokenId,
    address indexed recipient,
    bytes32 indexed contentHash,
    bytes32 manifestHash
);
```
- **Topic 0**: `keccak256("CertificateMinted(uint256,address,bytes32,bytes32)")`
- **Topic 1**: `uint256 tokenId`
- **Topic 2**: `address recipient`
- **Topic 3**: `bytes32 contentHash`
- **Data**: `bytes32 manifestHash`

---

## 3. AgentIdentityRegistry Events

Contract: `AgentIdentityRegistry.sol` (ERC-8004 AI Agent Registry)

### `AgentRegistered`
Emitted when an AI agent is registered and bound to an ERC-8004 identity.

```solidity
event AgentRegistered(
    address indexed agentWallet,
    uint256 indexed agentId,
    string name,
    string agentType
);
```

### `ProvenanceAttached`
Emitted when a provenance certificate is bound to an AI agent identity.

```solidity
event ProvenanceAttached(
    uint256 indexed agentId,
    uint256 indexed certificateTokenId
);
```
