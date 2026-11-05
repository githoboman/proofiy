const { ethers } = require("../../frontend/node_modules/ethers");

const MAINNET_RPC_URL = process.env.BOTCHAIN_MAINNET_RPC || "https://rpc.botchain.ai";
const PRIVATE_KEY = process.env.PRIVATE_KEY || "0x9e8273f5615b7941fef663ed3f35277e1eb51d2755ec1f0a4d88677fddd03085";
const RECIPIENT = "0x85D7514417Fbccda75D3B08421F86721Dd0d4d17";

async function main() {
  console.log("==================================================");
  console.log("Sweeping Remaining BOT Tokens on BOT Chain Mainnet");
  console.log("RPC:", MAINNET_RPC_URL);
  console.log("Recipient:", RECIPIENT);

  if (!ethers.isAddress(RECIPIENT)) {
    throw new Error("Invalid recipient address: " + RECIPIENT);
  }

  const provider = new ethers.JsonRpcProvider(MAINNET_RPC_URL, {
    chainId: 677,
    name: "botchainMainnet",
  });

  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  console.log("Sender Wallet:", wallet.address);

  const balance = await provider.getBalance(wallet.address);
  console.log("Current Balance:", ethers.formatEther(balance), "BOT");

  const feeData = await provider.getFeeData();
  const gasPrice = feeData.gasPrice && feeData.gasPrice >= 20000000000n ? feeData.gasPrice : 20000000000n;
  const gasLimit = 21000n;
  const gasCost = gasLimit * gasPrice;

  if (balance <= gasCost) {
    throw new Error(`Balance (${ethers.formatEther(balance)} BOT) is insufficient to pay transfer gas (${ethers.formatEther(gasCost)} BOT)`);
  }

  const amountToSend = balance - gasCost;
  console.log("Gas Cost:", ethers.formatEther(gasCost), "BOT (at 20 gwei)");
  console.log("Amount to Send:", ethers.formatEther(amountToSend), "BOT");

  console.log("\nBroadcasting transaction...");
  const tx = await wallet.sendTransaction({
    to: RECIPIENT,
    value: amountToSend,
    gasLimit,
    gasPrice,
  });

  console.log(`> Transaction Hash: ${tx.hash}`);
  console.log("Awaiting confirmation on BOT Chain Mainnet...");
  const receipt = await tx.wait();

  console.log(`✓ Confirmed in block ${receipt.blockNumber}! Gas used: ${receipt.gasUsed.toString()}`);
  console.log(`Explorer Link: https://scan.botchain.ai/tx/${tx.hash}`);

  const newBalance = await provider.getBalance(wallet.address);
  console.log(`Remaining Deployer Balance: ${ethers.formatEther(newBalance)} BOT`);
  console.log("==================================================");
}

main().catch((err) => {
  console.error("Transfer error:", err);
  process.exit(1);
});
