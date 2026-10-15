import { ethers } from "hardhat";

const PROVENANCE_CERT_ADDRESS = "0x1f572428708e3eEB0e56277972bdFFe010Cb3A9B";
const PROOF_REGISTRY_ADDRESS = "0xB766F0Ad04132b109577b31bF4a63b6462f40261";
const AGENT_REGISTRY_ADDRESS = "0x6f3922EF9BcfEB1fBb3c157b1F8947b70c59d773";

async function main() {
  const [signer] = await ethers.getSigners();
  console.log("==================================================");
  console.log("Proofiy: Executing 6 On-Chain Transactions on Bohr Testnet");
  console.log("Caller Account:", signer.address);
  
  const balance = await ethers.provider.getBalance(signer.address);
  console.log("Account Balance:", ethers.formatEther(balance), "tBOT");
  console.log("Network Chain ID:", (await ethers.provider.getNetwork()).chainId);
  console.log("==================================================\n");

  const provenanceContract = await ethers.getContractAt("ProvenanceCertificate", PROVENANCE_CERT_ADDRESS);
  const proofRegistryContract = await ethers.getContractAt("ProofRegistry", PROOF_REGISTRY_ADDRESS);
  const agentRegistryContract = await ethers.getContractAt("AgentIdentityRegistry", AGENT_REGISTRY_ADDRESS);

  const txResults: { step: string; txHash: string; summary: string; explorerUrl: string }[] = [];
  const timestamp = Date.now();

  // ----------------------------------------------------------------------
  // TXN 1: Authorize a new AWS Nitro Enclave PCR0 measurement hash
  // ----------------------------------------------------------------------
  console.log("--- [TXN 1/6] Authorizing AWS Nitro Enclave PCR0 Hash ---");
  const teeHash = ethers.keccak256(ethers.toUtf8Bytes(`aws-nitro-enclave-pcr0-v2-${timestamp}`));
  const teeLabel = `AWS Nitro Enclave v2.4 (Build-${timestamp.toString().slice(-4)})`;
  console.log(`Adding TEE Hash: ${teeHash} with label "${teeLabel}"`);
  
  const tx1 = await proofRegistryContract.addTeeHash(teeHash, teeLabel);
  console.log(`Tx 1 submitted: ${tx1.hash}. Awaiting confirmation...`);
  const receipt1 = await tx1.wait();
  console.log(`✓ Tx 1 confirmed in block ${receipt1?.blockNumber}! Gas used: ${receipt1?.gasUsed.toString()}`);
  txResults.push({
    step: "1. Authorize AWS Nitro Enclave PCR0 Hash",
    txHash: tx1.hash,
    summary: `Registered TEE measurement hash ${teeHash.slice(0, 18)}... (${teeLabel}) in ProofRegistry`,
    explorerUrl: `https://scan.bohr.life/tx/${tx1.hash}`
  });

  // ----------------------------------------------------------------------
  // TXN 2: Whitelist an Authorized Oracle Node Provider
  // ----------------------------------------------------------------------
  console.log("\n--- [TXN 2/6] Whitelisting Authorized Oracle Node Provider ---");
  // Generate a random provider address for testing attestation network expansion
  const randomProvider = ethers.Wallet.createRandom().address;
  console.log(`Whitelisting Oracle Node Provider: ${randomProvider}`);
  
  const tx2 = await proofRegistryContract.addProvider(randomProvider);
  console.log(`Tx 2 submitted: ${tx2.hash}. Awaiting confirmation...`);
  const receipt2 = await tx2.wait();
  console.log(`✓ Tx 2 confirmed in block ${receipt2?.blockNumber}! Gas used: ${receipt2?.gasUsed.toString()}`);
  txResults.push({
    step: "2. Whitelist Authorized Oracle Node Provider",
    txHash: tx2.hash,
    summary: `Authorized oracle enclave node ${randomProvider} for processing attestations`,
    explorerUrl: `https://scan.bohr.life/tx/${tx2.hash}`
  });

  // ----------------------------------------------------------------------
  // TXN 3: Register an Autonomous ERC-8004 AI Agent Identity
  // ----------------------------------------------------------------------
  console.log("\n--- [TXN 3/6] Registering ERC-8004 Autonomous AI Agent ---");
  const agentWallet = ethers.Wallet.createRandom();
  const externalAgentId = `proofiy-sentinel-${timestamp.toString().slice(-6)}`;
  const metadataUri = `ipfs://bafybeibotchainagent${timestamp.toString().slice(-8)}/metadata.json`;
  console.log(`Registering Agent: ID=${externalAgentId}, Wallet=${agentWallet.address}`);

  const tx3 = await agentRegistryContract.registerAgent(
    externalAgentId,
    agentWallet.address,
    metadataUri
  );
  console.log(`Tx 3 submitted: ${tx3.hash}. Awaiting confirmation...`);
  const receipt3 = await tx3.wait();
  console.log(`✓ Tx 3 confirmed in block ${receipt3?.blockNumber}! Gas used: ${receipt3?.gasUsed.toString()}`);
  
  const agentId = await agentRegistryContract.getAgentByWallet(agentWallet.address);
  console.log(`Created Agent ID: ${agentId}`);
  txResults.push({
    step: "3. Register ERC-8004 Autonomous AI Agent",
    txHash: tx3.hash,
    summary: `Registered autonomous agent "${externalAgentId}" (ID: #${agentId}) bound to wallet ${agentWallet.address}`,
    explorerUrl: `https://scan.bohr.life/tx/${tx3.hash}`
  });

  // ----------------------------------------------------------------------
  // TXN 4: Create Verification Request on ProofRegistry
  // ----------------------------------------------------------------------
  console.log("\n--- [TXN 4/6] Creating Content Verification Request ---");
  const contentPayload = `proofiy-synthetic-media-sample-${timestamp}`;
  const contentHash = ethers.keccak256(ethers.toUtf8Bytes(contentPayload));
  console.log(`Content Hash: ${contentHash}`);

  const tx4 = await proofRegistryContract.createRequest(contentHash);
  console.log(`Tx 4 submitted: ${tx4.hash}. Awaiting confirmation...`);
  const receipt4 = await tx4.wait();
  console.log(`✓ Tx 4 confirmed in block ${receipt4?.blockNumber}! Gas used: ${receipt4?.gasUsed.toString()}`);
  const totalRequests = await proofRegistryContract.totalRequests();
  console.log(`Latest Verification Request ID: ${totalRequests}`);
  txResults.push({
    step: "4. Create Content Verification Request",
    txHash: tx4.hash,
    summary: `Logged content verification request #${totalRequests} for content digest ${contentHash.slice(0, 18)}...`,
    explorerUrl: `https://scan.bohr.life/tx/${tx4.hash}`
  });

  // ----------------------------------------------------------------------
  // TXN 5: Mint Provenance Certificate (ERC-721 NFT)
  // ----------------------------------------------------------------------
  console.log("\n--- [TXN 5/6] Minting ERC-721 Provenance Certificate ---");
  const storageId = `ipfs://bafybeihdwdcefgh${timestamp.toString().slice(-8)}/manifest.json`;
  const manifestHashHex = ethers.hexlify(ethers.toUtf8Bytes(`manifest-v2-${timestamp}`));
  const attestationHashHex = ethers.hexlify(ethers.toUtf8Bytes(`nitro-attestation-doc-${timestamp}`));
  console.log(`Minting certificate to ${signer.address} with Storage ID: ${storageId}`);

  const tx5 = await provenanceContract.mintCertificate(
    signer.address,
    storageId,
    manifestHashHex,
    attestationHashHex
  );
  console.log(`Tx 5 submitted: ${tx5.hash}. Awaiting confirmation...`);
  const receipt5 = await tx5.wait();
  console.log(`✓ Tx 5 confirmed in block ${receipt5?.blockNumber}! Gas used: ${receipt5?.gasUsed.toString()}`);
  const certId = await provenanceContract.totalCertificates();
  console.log(`Minted Certificate ID: #${certId}`);
  txResults.push({
    step: "5. Mint ERC-721 Provenance Certificate",
    txHash: tx5.hash,
    summary: `Minted verified provenance certificate #${certId} (BOTCERT NFT) with TEE attestation hash`,
    explorerUrl: `https://scan.bohr.life/tx/${tx5.hash}`
  });

  // ----------------------------------------------------------------------
  // TXN 6: Bind Provenance Certificate to ERC-8004 AI Agent
  // ----------------------------------------------------------------------
  console.log("\n--- [TXN 6/6] Binding Provenance Certificate to AI Agent ---");
  console.log(`Binding Certificate #${certId} to Agent #${agentId}...`);
  const tx6 = await agentRegistryContract.bindProvenanceCertificate(agentId, certId);
  console.log(`Tx 6 submitted: ${tx6.hash}. Awaiting confirmation...`);
  const receipt6 = await tx6.wait();
  console.log(`✓ Tx 6 confirmed in block ${receipt6?.blockNumber}! Gas used: ${receipt6?.gasUsed.toString()}`);
  txResults.push({
    step: "6. Bind Certificate to AI Agent Identity",
    txHash: tx6.hash,
    summary: `Cryptographically linked certificate #${certId} to ERC-8004 Agent #${agentId}`,
    explorerUrl: `https://scan.bohr.life/tx/${tx6.hash}`
  });

  console.log("\n==================================================");
  console.log("ALL 6 ON-CHAIN TRANSACTIONS COMPLETED SUCCESSFULLY!");
  console.log("==================================================");
  console.table(txResults.map(t => ({ Step: t.step, TxHash: t.txHash, Explorer: t.explorerUrl })));

  // Output JSON for downstream documentation and whitepaper embedding
  console.log("\nJSON SUMMARY:");
  console.log(JSON.stringify(txResults, null, 2));
}

main().catch((error) => {
  console.error("Interaction script failed:", error);
  process.exitCode = 1;
});
