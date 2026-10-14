/**
 * BOT Chain Smart Contract Configurations & ABIs
 * Supports Bohr Testnet (Chain ID 968) and BOT Chain Mainnet (Chain ID 677).
 */

import { BotChainNetworkId, getExpectedNetwork } from "./network";

export interface DeployedContracts {
  proofRegistry: string;
  provenanceCertificate: string;
  agentIdentityRegistry: string;
}

/**
 * Default contract addresses on BOT Chain networks.
 * These can be overridden via NEXT_PUBLIC_* environment variables.
 */
export const CONTRACT_ADDRESSES: Record<"mainnet" | "testnet", DeployedContracts> = {
  testnet: {
    proofRegistry:
      process.env.NEXT_PUBLIC_PROOF_REGISTRY_ADDRESS ||
      "0xB766F0Ad04132b109577b31bF4a63b6462f40261",
    provenanceCertificate:
      process.env.NEXT_PUBLIC_PROVENANCE_CERTIFICATE_ADDRESS ||
      "0x1f572428708e3eEB0e56277972bdFFe010Cb3A9B",
    agentIdentityRegistry:
      process.env.NEXT_PUBLIC_AGENT_IDENTITY_REGISTRY_ADDRESS ||
      "0x6f3922EF9BcfEB1fBb3c157b1F8947b70c59d773",
  },
  mainnet: {
    proofRegistry:
      process.env.NEXT_PUBLIC_PROOF_REGISTRY_ADDRESS ||
      "0x5f5802fA78d5eE2A3B4fD67F49CD502430C3E88C",
    provenanceCertificate:
      process.env.NEXT_PUBLIC_PROVENANCE_CERTIFICATE_ADDRESS ||
      "0xd9DC4F46d9da603A2A077A7190BAa85f4e2f05fe",
    agentIdentityRegistry:
      process.env.NEXT_PUBLIC_AGENT_IDENTITY_REGISTRY_ADDRESS ||
      "0xb43edfb9c7609cf645e932b2ff20f26f0d4488de",
  },
};

export function getContracts(networkId: BotChainNetworkId = getExpectedNetwork()): DeployedContracts {
  return networkId === "mainnet" ? CONTRACT_ADDRESSES.mainnet : CONTRACT_ADDRESSES.testnet;
}

/**
 * Human-readable / JSON ABIs for client-side interactions
 */
export const PROOF_REGISTRY_ABI = [
  "function admin() view returns (address)",
  "function provenanceContract() view returns (address)",
  "function isProviderAuthorized(address provider) view returns (bool)",
  "function isTeeHashAuthorized(bytes32 teeHash) view returns (bool)",
  "function teeHashLabels(bytes32 teeHash) view returns (string)",
  "function getRequest(uint256 requestId) view returns (tuple(uint256 id, bytes32 contentHash, address requester, uint8 state, string rejectionReason, uint256 timestamp, uint256 certificateId))",
  "function createRequest(bytes32 contentHash) returns (uint256)",
  "function processVerification(uint256 requestId, bytes32 teeHash, string storageId, string manifestHash, string attestationHash, bytes signature) returns (bool)",
  "event RequestCreated(uint256 indexed requestId, address indexed requester, bytes32 indexed contentHash)",
  "event RequestProcessed(uint256 indexed requestId, uint256 indexed certificateId, address indexed provider, bytes32 teeHash)",
  "event RequestRejected(uint256 indexed requestId, string reason, address indexed provider)"
];

export const PROVENANCE_CERTIFICATE_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function ownerOf(uint256 tokenId) view returns (address)",
  "function tokenURI(uint256 tokenId) view returns (string)",
  "function getCertificate(uint256 tokenId) view returns (tuple(uint256 tokenId, address owner, string uri, bytes32 manifestHash, bytes32 contentHash, bytes32 attestationHash, uint256 issuedAt))",
  "function mintCertificate(address to, string uri, bytes32 manifestHash, bytes32 contentHash, bytes32 attestationHash) returns (uint256)",
  "function transferCertificate(address from, address to, uint256 tokenId)",
  "function getCertificatesByOwner(address owner) view returns (uint256[])",
  "event CertificateMinted(uint256 indexed tokenId, address indexed to, bytes32 indexed manifestHash, bytes32 contentHash)",
  "event CertificateTransferred(uint256 indexed tokenId, address indexed from, address indexed to)"
];

export const AGENT_IDENTITY_REGISTRY_ABI = [
  "function registerAgent(bytes32 agentId, string uri, bytes metadata) returns (bool)",
  "function getAgent(bytes32 agentId) view returns (tuple(bytes32 agentId, address owner, string uri, bytes metadata, uint256 registeredAt, bool active))",
  "function isAgentActive(bytes32 agentId) view returns (bool)",
  "event AgentRegistered(bytes32 indexed agentId, address indexed owner, string uri)"
];
