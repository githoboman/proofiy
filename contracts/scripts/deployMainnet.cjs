const { ethers } = require("../../frontend/node_modules/ethers");
const fs = require("fs");
const path = require("path");

const MAINNET_RPC_URL = process.env.BOTCHAIN_MAINNET_RPC || "https://rpc.botchain.ai";
const PRIVATE_KEY = process.env.PRIVATE_KEY || "0x9e8273f5615b7941fef663ed3f35277e1eb51d2755ec1f0a4d88677fddd03085";

async function main() {
  console.log("==================================================");
  console.log("Proofiy: Deploying Smart Contracts to BOT Chain Mainnet");
  console.log("RPC Endpoint:", MAINNET_RPC_URL);
  
  const provider = new ethers.JsonRpcProvider(MAINNET_RPC_URL, {
    chainId: 677,
    name: "botchainMainnet",
  });
  
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  console.log("Deployer Address:", wallet.address);

  const balance = await provider.getBalance(wallet.address);
  console.log("Deployer Balance:", ethers.formatEther(balance), "BOT");

  if (balance === 0n) {
    console.error("\n[ERROR] Insufficient funds!");
    console.error(`Please fund the deployer wallet (${wallet.address}) with native BOT tokens before deploying.`);
    console.error("Estimated required balance: ~0.1 - 0.2 BOT");
    process.exit(1);
  }

  const provenanceArtifact = JSON.parse(
    fs.readFileSync(path.join(__dirname, "../artifacts/contracts/ProvenanceCertificate.sol/ProvenanceCertificate.json"), "utf8")
  );
  const proofRegistryArtifact = JSON.parse(
    fs.readFileSync(path.join(__dirname, "../artifacts/contracts/ProofRegistry.sol/ProofRegistry.json"), "utf8")
  );
  const agentRegistryArtifact = JSON.parse(
    fs.readFileSync(path.join(__dirname, "../artifacts/contracts/AgentIdentityRegistry.sol/AgentIdentityRegistry.json"), "utf8")
  );

  console.log("\n--- [1/4] Deploying ProvenanceCertificate (ERC-721) ---");
  const ProvenanceFactory = new ethers.ContractFactory(provenanceArtifact.abi, provenanceArtifact.bytecode, wallet);
  const provenanceContract = await ProvenanceFactory.deploy(ethers.ZeroAddress);
  console.log(`> Deployment Tx Broadcasted: ${provenanceContract.deploymentTransaction().hash}`);
  await provenanceContract.waitForDeployment();
  const provenanceAddress = await provenanceContract.getAddress();
  console.log(`✓ ProvenanceCertificate deployed to: ${provenanceAddress}`);

  console.log("\n--- [2/4] Deploying ProofRegistry ---");
  const RegistryFactory = new ethers.ContractFactory(proofRegistryArtifact.abi, proofRegistryArtifact.bytecode, wallet);
  const registryContract = await RegistryFactory.deploy(provenanceAddress);
  console.log(`> Deployment Tx Broadcasted: ${registryContract.deploymentTransaction().hash}`);
  await registryContract.waitForDeployment();
  const registryAddress = await registryContract.getAddress();
  console.log(`✓ ProofRegistry deployed to: ${registryAddress}`);

  console.log("\n--- [3/4] Linking ProofRegistry as Authorized Oracle ---");
  const linkTx = await provenanceContract.setAuthorizedOracle(registryAddress);
  console.log(`> Link Oracle Tx Broadcasted: ${linkTx.hash}`);
  const linkReceipt = await linkTx.wait();
  console.log(`✓ Oracle authorization linked in block ${linkReceipt.blockNumber}!`);

  console.log("\n--- [4/4] Deploying AgentIdentityRegistry (ERC-8004) ---");
  const AgentFactory = new ethers.ContractFactory(agentRegistryArtifact.abi, agentRegistryArtifact.bytecode, wallet);
  const agentContract = await AgentFactory.deploy();
  console.log(`> Deployment Tx Broadcasted: ${agentContract.deploymentTransaction().hash}`);
  await agentContract.waitForDeployment();
  const agentRegistryAddress = await agentContract.getAddress();
  console.log(`✓ AgentIdentityRegistry deployed to: ${agentRegistryAddress}`);

  const summary = {
    network: "BOT Chain Mainnet",
    chainId: 677,
    deployer: wallet.address,
    deployedAt: new Date().toISOString(),
    contracts: {
      provenanceCertificate: provenanceAddress,
      proofRegistry: registryAddress,
      agentIdentityRegistry: agentRegistryAddress,
    },
    explorerUrls: {
      provenanceCertificate: `https://scan.botchain.ai/address/${provenanceAddress}`,
      proofRegistry: `https://scan.botchain.ai/address/${registryAddress}`,
      agentIdentityRegistry: `https://scan.botchain.ai/address/${agentRegistryAddress}`,
      deployer: `https://scan.botchain.ai/address/${wallet.address}`,
    }
  };

  const outputPath = path.join(__dirname, "../../docs/MAINNET_DEPLOYED_CONTRACTS.json");
  fs.writeFileSync(outputPath, JSON.stringify(summary, null, 2));
  console.log(`\nDeployment summary saved to ${outputPath}`);

  // Automatically update frontend/config/contracts.ts
  const contractsTsPath = path.join(__dirname, "../../frontend/config/contracts.ts");
  if (fs.existsSync(contractsTsPath)) {
    let content = fs.readFileSync(contractsTsPath, "utf8");
    content = content.replace(/proofRegistry:\s*\n\s*process\.env\.NEXT_PUBLIC_PROOF_REGISTRY_ADDRESS \|\|\s*\n\s*"0x[a-fA-F0-9]+"/g, 
      `proofRegistry:\n      process.env.NEXT_PUBLIC_PROOF_REGISTRY_ADDRESS ||\n      "${registryAddress}"`);
    content = content.replace(/provenanceCertificate:\s*\n\s*process\.env\.NEXT_PUBLIC_PROVENANCE_CERTIFICATE_ADDRESS \|\|\s*\n\s*"0x[a-fA-F0-9]+"/g,
      `provenanceCertificate:\n      process.env.NEXT_PUBLIC_PROVENANCE_CERTIFICATE_ADDRESS ||\n      "${provenanceAddress}"`);
    content = content.replace(/agentIdentityRegistry:\s*\n\s*process\.env\.NEXT_PUBLIC_AGENT_IDENTITY_REGISTRY_ADDRESS \|\|\s*\n\s*"0x[a-fA-F0-9]+"/g,
      `agentIdentityRegistry:\n      process.env.NEXT_PUBLIC_AGENT_IDENTITY_REGISTRY_ADDRESS ||\n      "${agentRegistryAddress}"`);
    fs.writeFileSync(contractsTsPath, content);
    console.log("✓ Updated frontend/config/contracts.ts with new Mainnet addresses!");
  }

  console.log("\n==================================================");
  console.log("BOT CHAIN MAINNET DEPLOYMENT COMPLETED SUCCESSFULLY!");
  console.log("==================================================");
  console.log(JSON.stringify(summary, null, 2));
}

main().catch((err) => {
  console.error("Mainnet deployment failed:", err);
  process.exit(1);
});
