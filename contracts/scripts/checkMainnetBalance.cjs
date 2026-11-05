const { ethers } = require("../../frontend/node_modules/ethers");

const MAINNET_RPC_URL = process.env.BOTCHAIN_MAINNET_RPC || "https://rpc.botchain.ai";
const DEPLOYER_ADDRESS = process.env.DEPLOYER_ADDRESS || "0xA4A42E4873d57Dd91fA9D41D5956EA51E4D69DE9";

async function main() {
  console.log("Checking BOT Chain Mainnet Balance...");
  console.log("RPC:", MAINNET_RPC_URL);
  console.log("Wallet Address:", DEPLOYER_ADDRESS);

  const provider = new ethers.JsonRpcProvider(MAINNET_RPC_URL, {
    chainId: 677,
    name: "botchainMainnet",
  });

  const balance = await provider.getBalance(DEPLOYER_ADDRESS);
  const formatted = ethers.formatEther(balance);

  console.log(`\nBalance: ${formatted} BOT`);
  if (balance === 0n) {
    console.log("Status: ❌ Unfunded (Needs ~0.1 - 0.2 BOT for contract deployment)");
  } else if (balance < ethers.parseEther("0.05")) {
    console.log("Status: ⚠️ Low balance (Recommended at least 0.1 BOT for deploying all 3 contracts)");
  } else {
    console.log("Status: ✅ Ready for Mainnet deployment!");
  }
}

main().catch(console.error);

