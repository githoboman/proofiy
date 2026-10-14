import { expect } from "chai";
import { ethers } from "hardhat";

describe("BOT Chain Proof Contracts", function () {
  let provenance: any;
  let registry: any;
  let agentRegistry: any;
  let owner: any;
  let provider: any;
  let creator: any;

  beforeEach(async function () {
    [owner, provider, creator] = await ethers.getSigners();

    const ProvenanceCertificate = await ethers.getContractFactory("ProvenanceCertificate");
    provenance = await ProvenanceCertificate.deploy(ethers.ZeroAddress);
    await provenance.waitForDeployment();

    const ProofRegistry = await ethers.getContractFactory("ProofRegistry");
    registry = await ProofRegistry.deploy(await provenance.getAddress());
    await registry.waitForDeployment();

    await provenance.setAuthorizedOracle(await registry.getAddress());

    const AgentIdentityRegistry = await ethers.getContractFactory("AgentIdentityRegistry");
    agentRegistry = await AgentIdentityRegistry.deploy();
    await agentRegistry.waitForDeployment();
  });

  it("should deploy ProvenanceCertificate with correct name and symbol", async function () {
    expect(await provenance.name()).to.equal("BOT Chain Provenance Certificate");
    expect(await provenance.symbol()).to.equal("BOTCERT");
  });

  it("should allow owner to authorize providers and TEE hashes in ProofRegistry", async function () {
    await registry.addProvider(provider.address);
    expect(await registry.isProviderAuthorized(provider.address)).to.be.true;

    const sampleTeeHash = ethers.keccak256(ethers.toUtf8Bytes("tee-v1.0.0"));
    await registry.addTeeHash(sampleTeeHash, "BOT Chain Enclave v1");
    expect(await registry.isTeeHashAuthorized(sampleTeeHash)).to.be.true;
  });

  it("should create verification request and process valid verification", async function () {
    await registry.addProvider(provider.address);
    const sampleTeeHash = ethers.keccak256(ethers.toUtf8Bytes("tee-v1.0.0"));
    await registry.addTeeHash(sampleTeeHash, "BOT Chain Enclave v1");

    const contentHash = ethers.keccak256(ethers.toUtf8Bytes("sample digital media"));
    await registry.connect(creator).createRequest(contentHash);

    const reqId = 1;
    const storageId = "ipfs://QmSampleCID123456789";
    const manifestHash = "0x" + "a".repeat(64);
    const attestationHash = "0x" + "b".repeat(64);

    const messageHash = ethers.keccak256(
      ethers.solidityPacked(
        ["uint256", "bytes32", "string", "string"],
        [reqId, sampleTeeHash, manifestHash, attestationHash]
      )
    );
    const signature = await provider.signMessage(ethers.getBytes(messageHash));

    await registry.processVerification(
      reqId,
      sampleTeeHash,
      storageId,
      manifestHash,
      attestationHash,
      signature
    );

    const req = await registry.getRequest(reqId);
    expect(req.state).to.equal(1); // Verified
    expect(req.certificateId).to.equal(1);

    const cert = await provenance.getCertificate(1);
    expect(cert.creator).to.equal(creator.address);
    expect(cert.manifestHash).to.equal(manifestHash);
    expect(cert.storageId).to.equal(storageId);
  });

  it("should reject verification when provider is unauthorized", async function () {
    const sampleTeeHash = ethers.keccak256(ethers.toUtf8Bytes("tee-v1.0.0"));
    await registry.addTeeHash(sampleTeeHash, "BOT Chain Enclave v1");

    const contentHash = ethers.keccak256(ethers.toUtf8Bytes("sample digital media"));
    await registry.connect(creator).createRequest(contentHash);

    const reqId = 1;
    const storageId = "ipfs://QmSampleCID123456789";
    const manifestHash = "0x" + "a".repeat(64);
    const attestationHash = "0x" + "b".repeat(64);

    const messageHash = ethers.keccak256(
      ethers.solidityPacked(
        ["uint256", "bytes32", "string", "string"],
        [reqId, sampleTeeHash, manifestHash, attestationHash]
      )
    );
    // Provider is not authorized
    const signature = await provider.signMessage(ethers.getBytes(messageHash));

    await registry.processVerification(
      reqId,
      sampleTeeHash,
      storageId,
      manifestHash,
      attestationHash,
      signature
    );

    const req = await registry.getRequest(reqId);
    expect(req.state).to.equal(2); // Rejected
    expect(req.rejectionReason).to.equal("Unauthorized");
  });

  it("should register an AI Agent under ERC-8004 and bind certificates", async function () {
    const externalAgentId = "bot-content-verifier-01";
    const agentWallet = ethers.Wallet.createRandom().address;
    const metadataUri = "https://identity-api.botchain.ai/agents/meta/01.json";

    await agentRegistry.connect(owner).registerAgent(externalAgentId, agentWallet, metadataUri);

    const agent = await agentRegistry.getAgent(1);
    expect(agent.externalAgentId).to.equal(externalAgentId);
    expect(agent.walletAddress).to.equal(agentWallet);

    await agentRegistry.connect(owner).bindProvenanceCertificate(1, 101);
    const certs = await agentRegistry.getAgentCertificates(1);
    expect(certs.length).to.equal(1);
    expect(certs[0]).to.equal(101);
  });
});
