const { ethers } = require("../../frontend/node_modules/ethers");
const fs = require("fs");
const path = require("path");

const PROVENANCE_CERT_ADDRESS = "0x1f572428708e3eEB0e56277972bdFFe010Cb3A9B";
const PROOF_REGISTRY_ADDRESS = "0xB766F0Ad04132b109577b31bF4a63b6462f40261";
const AGENT_REGISTRY_ADDRESS = "0x6f3922EF9BcfEB1fBb3c157b1F8947b70c59d773";

const RPC_URL = "https://rpc.bohr.life";
const PRIVATE_KEY = "0x9e8273f5615b7941fef663ed3f35277e1eb51d2755ec1f0a4d88677fddd03085";

async function main() {
  console.log("==================================================");
  console.log("Proofiy: Executing 6 On-Chain Transactions on Bohr Testnet");
  console.log("RPC Endpoint:", RPC_URL);
  
  const provider = new ethers.JsonRpcProvider(RPC_URL, {
    chainId: 968,
    name: "bohrTestnet",
  });
  
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  console.log("Signer Address:", wallet.address);

  const balance = await provider.getBalance(wallet.address);
  console.log("Signer Balance:", ethers.formatEther(balance), "tBOT");

  const provenanceArtifact = JSON.parse(
    fs.readFileSync(path.join(__dirname, "../artifacts/contracts/ProvenanceCertificate.sol/ProvenanceCertificate.json"), "utf8")
  );
  const proofRegistryArtifact = JSON.parse(
    fs.readFileSync(path.join(__dirname, "../artifacts/contracts/ProofRegistry.sol/ProofRegistry.json"), "utf8")
  );
  const agentRegistryArtifact = JSON.parse(
    fs.readFileSync(path.join(__dirname, "../artifacts/contracts/AgentIdentityRegistry.sol/AgentIdentityRegistry.json"), "utf8")
  );

  const provenanceContract = new ethers.Contract(PROVENANCE_CERT_ADDRESS, provenanceArtifact.abi, wallet);
  const proofRegistryContract = new ethers.Contract(PROOF_REGISTRY_ADDRESS, proofRegistryArtifact.abi, wallet);
  const agentRegistryContract = new ethers.Contract(AGENT_REGISTRY_ADDRESS, agentRegistryArtifact.abi, wallet);

  const txResults = [];
  const timestamp = Date.now();

  // ----------------------------------------------------------------------
  // TXN 1: Authorize an AWS Nitro Enclave PCR0 measurement hash
  // ----------------------------------------------------------------------
  console.log("\n--- [TXN 1/6] Authorizing AWS Nitro Enclave PCR0 Hash ---");
  const teeHash = ethers.keccak256(ethers.toUtf8Bytes(`aws-nitro-enclave-pcr0-v2-${timestamp}`));
  const teeLabel = `AWS Nitro Enclave v2.4 (Build-${timestamp.toString().slice(-4)})`;
  console.log(`Adding TEE Hash: ${teeHash} ("${teeLabel}")...`);
  
  const tx1 = await proofRegistryContract.addTeeHash(teeHash, teeLabel);
  console.log(`> Tx 1 broadcasted: ${tx1.hash}`);
  const receipt1 = await tx1.wait();
  console.log(`✓ Confirmed in block ${receipt1.blockNumber}! Gas: ${receipt1.gasUsed.toString()}`);
  txResults.push({
    step: "1. Authorize AWS Nitro Enclave PCR0 Hash",
    txHash: tx1.hash,
    blockNumber: receipt1.blockNumber,
    summary: `Registered TEE measurement hash in ProofRegistry (${teeLabel})`,
    explorerUrl: `https://scan.bohr.life/tx/${tx1.hash}`
  });

  // ----------------------------------------------------------------------
  // TXN 2: Whitelist an Authorized Oracle Node Provider
  // ----------------------------------------------------------------------
  console.log("\n--- [TXN 2/6] Whitelisting Authorized Oracle Provider ---");
  const randomProvider = ethers.Wallet.createRandom().address;
  console.log(`Adding Provider Address: ${randomProvider}...`);

  const tx2 = await proofRegistryContract.addProvider(randomProvider);
  console.log(`> Tx 2 broadcasted: ${tx2.hash}`);
  const receipt2 = await tx2.wait();
  console.log(`✓ Confirmed in block ${receipt2.blockNumber}! Gas: ${receipt2.gasUsed.toString()}`);
  txResults.push({
    step: "2. Whitelist Authorized Oracle Node Provider",
    txHash: tx2.hash,
    blockNumber: receipt2.blockNumber,
    summary: `Authorized oracle node ${randomProvider} in ProofRegistry`,
    explorerUrl: `https://scan.bohr.life/tx/${tx2.hash}`
  });

  // ----------------------------------------------------------------------
  // TXN 3: Register an Autonomous ERC-8004 AI Agent Identity
  // ----------------------------------------------------------------------
  console.log("\n--- [TXN 3/6] Registering ERC-8004 Autonomous AI Agent ---");
  const agentWallet = ethers.Wallet.createRandom();
  const externalAgentId = `proofiy-sentinel-${timestamp.toString().slice(-6)}`;
  const metadataUri = `ipfs://bafybeibotchainagent${timestamp.toString().slice(-8)}/agent.json`;
  console.log(`Registering Agent: ID=${externalAgentId}, Wallet=${agentWallet.address}...`);

  const tx3 = await agentRegistryContract.registerAgent(
    externalAgentId,
    agentWallet.address,
    metadataUri
  );
  console.log(`> Tx 3 broadcasted: ${tx3.hash}`);
  const receipt3 = await tx3.wait();
  console.log(`✓ Confirmed in block ${receipt3.blockNumber}! Gas: ${receipt3.gasUsed.toString()}`);
  
  const agentId = await agentRegistryContract.getAgentByWallet(agentWallet.address);
  console.log(`Registered Agent on-chain ID: #${agentId.toString()}`);
  txResults.push({
    step: "3. Register ERC-8004 Autonomous AI Agent",
    txHash: tx3.hash,
    blockNumber: receipt3.blockNumber,
    summary: `Registered autonomous agent "${externalAgentId}" (ID: #${agentId.toString()}) bound to wallet ${agentWallet.address}`,
    explorerUrl: `https://scan.bohr.life/tx/${tx3.hash}`
  });

  // ----------------------------------------------------------------------
  // TXN 4: Create Verification Request on ProofRegistry
  // ----------------------------------------------------------------------
  console.log("\n--- [TXN 4/6] Creating Content Verification Request ---");
  const contentPayload = `proofiy-synthetic-media-sample-${timestamp}`;
  const contentHash = ethers.keccak256(ethers.toUtf8Bytes(contentPayload));
  console.log(`Creating request for content hash: ${contentHash}...`);

  const tx4 = await proofRegistryContract.createRequest(contentHash);
  console.log(`> Tx 4 broadcasted: ${tx4.hash}`);
  const receipt4 = await tx4.wait();
  console.log(`✓ Confirmed in block ${receipt4.blockNumber}! Gas: ${receipt4.gasUsed.toString()}`);
  const totalRequests = await proofRegistryContract.totalRequests();
  console.log(`Verification Request created: ID #${totalRequests.toString()}`);
  txResults.push({
    step: "4. Create Content Verification Request",
    txHash: tx4.hash,
    blockNumber: receipt4.blockNumber,
    summary: `Logged verification request #${totalRequests.toString()} for content digest ${contentHash.slice(0, 18)}...`,
    explorerUrl: `https://scan.bohr.life/tx/${tx4.hash}`
  });

  // ----------------------------------------------------------------------
  // TXN 5: Mint Provenance Certificate (ERC-721 NFT)
  // ----------------------------------------------------------------------
  console.log("\n--- [TXN 5/6] Minting ERC-721 Provenance Certificate ---");
  const storageId = `ipfs://bafybeihdwdcefgh${timestamp.toString().slice(-8)}/manifest.json`;
  const manifestHashHex = `manifest-c2pa-${timestamp}`;
  const attestationHashHex = `aws-nitro-quote-${timestamp}`;
  console.log(`Minting certificate to ${wallet.address} with storage ID: ${storageId}...`);

  const tx5 = await provenanceContract.mintCertificate(
    wallet.address,
    storageId,
    manifestHashHex,
    attestationHashHex
  );
  console.log(`> Tx 5 broadcasted: ${tx5.hash}`);
  const receipt5 = await tx5.wait();
  console.log(`✓ Confirmed in block ${receipt5.blockNumber}! Gas: ${receipt5.gasUsed.toString()}`);
  const certId = await provenanceContract.totalCertificates();
  console.log(`Minted Certificate ID: #${certId.toString()}`);
  txResults.push({
    step: "5. Mint ERC-721 Provenance Certificate",
    txHash: tx5.hash,
    blockNumber: receipt5.blockNumber,
    summary: `Minted verified provenance certificate #${certId.toString()} (BOTCERT NFT) with TEE attestation digest`,
    explorerUrl: `https://scan.bohr.life/tx/${tx5.hash}`
  });

  // ----------------------------------------------------------------------
  // TXN 6: Bind Provenance Certificate to ERC-8004 AI Agent
  // ----------------------------------------------------------------------
  console.log("\n--- [TXN 6/6] Binding Certificate to ERC-8004 AI Agent ---");
  console.log(`Binding Certificate #${certId.toString()} to Agent #${agentId.toString()}...`);

  const tx6 = await agentRegistryContract.bindProvenanceCertificate(agentId, certId);
  console.log(`> Tx 6 broadcasted: ${tx6.hash}`);
  const receipt6 = await tx6.wait();
  console.log(`✓ Confirmed in block ${receipt6.blockNumber}! Gas: ${receipt6.gasUsed.toString()}`);
  txResults.push({
    step: "6. Bind Certificate to AI Agent Identity",
    txHash: tx6.hash,
    blockNumber: receipt6.blockNumber,
    summary: `Bound certificate #${certId.toString()} to ERC-8004 Agent #${agentId.toString()} on-chain`,
    explorerUrl: `https://scan.bohr.life/tx/${tx6.hash}`
  });

  console.log("\n==================================================");
  console.log("ALL 6 ON-CHAIN TRANSACTIONS COMPLETED AND VERIFIED!");
  console.log("==================================================");

  // Save results to a JSON file
  const resultsPath = path.join(__dirname, "../../docs/ON_CHAIN_TRANSACTIONS.json");
  fs.writeFileSync(resultsPath, JSON.stringify(txResults, null, 2));
  console.log(`Saved transaction records to ${resultsPath}`);
}

main().catch((err) => {
  console.error("Execution error:", err);
  process.exit(1);
});
