import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  console.log("==================================================");
  console.log("       BOT Chain Testnet Wallet Generator         ");
  console.log("==================================================\n");

  const wallet = ethers.Wallet.createRandom();

  console.log("Generated New EVM Wallet for Bohr Testnet (Chain ID 968):");
  console.log(`Address:     ${wallet.address}`);
  console.log(`Private Key: ${wallet.privateKey}`);
  if (wallet.mnemonic) {
    console.log(`Mnemonic:    ${wallet.mnemonic.phrase}`);
  }
  console.log("\n--------------------------------------------------");

  // Query Bohr Testnet RPC
  const rpcUrl = "https://rpc.bohr.life";
  const provider = new ethers.JsonRpcProvider(rpcUrl);

  try {
    const balance = await provider.getBalance(wallet.address);
    console.log(`Current Balance on Bohr Testnet: ${ethers.formatEther(balance)} tBOT`);
  } catch (err: any) {
    console.log("Could not fetch balance from Bohr Testnet:", err?.message || err);
  }

  // Save to .env.testnet in contracts if not present
  const envPath = path.join(__dirname, "..", ".env");
  const envContent = `PRIVATE_KEY=${wallet.privateKey}
BOTCHAIN_TESTNET_RPC=https://rpc.bohr.life
BOTCHAIN_MAINNET_RPC=https://rpc.botchain.ai
DEPLOYER_ADDRESS=${wallet.address}
`;

  fs.writeFileSync(envPath, envContent, "utf8");
  console.log(`\nSuccessfully updated ${envPath} with your new deployer key.`);

  console.log("\n==================================================");
  console.log("To deploy to Bohr Testnet, ensure the address has tBOT");
  console.log(`Address to fund: ${wallet.address}`);
  console.log("==================================================");
}

main().catch(console.error);
