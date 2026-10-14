import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts to BOT Chain with account:", deployer.address);

  // 1. Deploy ProvenanceCertificate
  const ProvenanceCertificate = await ethers.getContractFactory("ProvenanceCertificate");
  const provenance = await ProvenanceCertificate.deploy(ethers.ZeroAddress);
  await provenance.waitForDeployment();
  const provenanceAddress = await provenance.getAddress();
  console.log("ProvenanceCertificate deployed to:", provenanceAddress);

  // 2. Deploy ProofRegistry
  const ProofRegistry = await ethers.getContractFactory("ProofRegistry");
  const registry = await ProofRegistry.deploy(provenanceAddress);
  await registry.waitForDeployment();
  const registryAddress = await registry.getAddress();
  console.log("ProofRegistry deployed to:", registryAddress);

  // 3. Link Registry as Authorized Oracle on ProvenanceCertificate
  const tx = await provenance.setAuthorizedOracle(registryAddress);
  await tx.wait();
  console.log("ProvenanceCertificate authorized oracle set to ProofRegistry");

  // 4. Deploy AgentIdentityRegistry (ERC-8004)
  const AgentIdentityRegistry = await ethers.getContractFactory("AgentIdentityRegistry");
  const agentRegistry = await AgentIdentityRegistry.deploy();
  await agentRegistry.waitForDeployment();
  const agentRegistryAddress = await agentRegistry.getAddress();
  console.log("AgentIdentityRegistry deployed to:", agentRegistryAddress);

  console.log("\n--- BOT Chain Deployment Summary ---");
  console.log("Network Chain ID:", (await ethers.provider.getNetwork()).chainId);
  console.log("ProvenanceCertificate:", provenanceAddress);
  console.log("ProofRegistry:", registryAddress);
  console.log("AgentIdentityRegistry:", agentRegistryAddress);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
