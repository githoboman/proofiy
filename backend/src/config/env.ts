/**
 * Centralised environment configuration for BOT Chain Proof.
 * All process.env reads happen here. Downstream modules import from `env`
 * and never access process.env directly.
 */
import "dotenv/config";

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    console.error(`[Config] Missing required environment variable: ${key}`);
    process.exit(1);
  }
  return value;
}

function optionalEnv(key: string, fallback: string): string {
  return process.env[key] ?? fallback;
}

export const env = {
  NODE_ENV: optionalEnv("NODE_ENV", "development"),
  PORT: parseInt(optionalEnv("PORT", "4000"), 10),

  /** MongoDB connection string, e.g. mongodb://localhost:27017/stellarproof */
  MONGODB_URI: optionalEnv("MONGODB_URI", "mongodb://localhost:27017/botchain_proof"),

  /**
   * BOT Chain RPC endpoint
   * Mainnet: https://rpc.botchain.ai
   * Bohr Testnet: https://rpc.bohr.life
   */
  BOTCHAIN_RPC_URL: optionalEnv(
    "BOTCHAIN_RPC_URL",
    optionalEnv("STELLAR_RPC_URL", "https://rpc.bohr.life")
  ),

  /**
   * BOT Chain Network Chain ID
   * Mainnet: 677
   * Bohr Testnet: 968
   */
  BOTCHAIN_CHAIN_ID: parseInt(optionalEnv("BOTCHAIN_CHAIN_ID", "968"), 10),

  /**
   * BOT Chain Block Explorer
   * Mainnet: https://scan.botchain.ai
   * Bohr Testnet: https://scan.bohr.life
   */
  BOTCHAIN_EXPLORER_URL: optionalEnv("BOTCHAIN_EXPLORER_URL", "https://scan.bohr.life"),

  /**
   * Deployed Smart Contract Addresses on BOT Chain
   */
  BOTCHAIN_PROVENANCE_CONTRACT_ADDRESS: optionalEnv("BOTCHAIN_PROVENANCE_CONTRACT_ADDRESS", ""),
  BOTCHAIN_REGISTRY_CONTRACT_ADDRESS: optionalEnv("BOTCHAIN_REGISTRY_CONTRACT_ADDRESS", ""),

  /**
   * BOT Chain Agent OS Integration Endpoints
   */
  BOTCHAIN_WALLET_API_URL: optionalEnv("BOTCHAIN_WALLET_API_URL", "https://wallet-api.bohr.life"),
  BOTCHAIN_IDENTITY_API_URL: optionalEnv("BOTCHAIN_IDENTITY_API_URL", "https://identity-api.bohr.life"),
  BOTCHAIN_API_KEY: optionalEnv("BOTCHAIN_API_KEY", ""),

  /** Allowed CORS origin for the frontend. */
  CORS_ORIGIN: optionalEnv("CORS_ORIGIN", "http://localhost:3000"),

  /** Morgan log format: 'dev' | 'combined' | 'tiny' etc. */
  LOG_LEVEL: optionalEnv("LOG_LEVEL", "dev"),

  // Backward compatibility alias
  STELLAR_RPC_URL: optionalEnv(
    "STELLAR_RPC_URL",
    optionalEnv("BOTCHAIN_RPC_URL", "https://rpc.bohr.life")
  ),
  STELLAR_NETWORK_PASSPHRASE: optionalEnv("STELLAR_NETWORK_PASSPHRASE", "BOT Chain Network"),
  STELLAR_NFT_BALANCE_FN: optionalEnv("STELLAR_NFT_BALANCE_FN", "balanceOf"),
} as const;
