/**
 * BOT Chain Network Configuration
 * Supports BOT Chain Mainnet (Chain ID 677) and Bohr Testnet (Chain ID 968).
 */

export type BotChainNetworkId = "mainnet" | "testnet" | "unknown";
export type StellarNetworkId = BotChainNetworkId; // Backward-compatible alias

export interface BotChainNetworkConfig {
  chainId: number;
  chainIdHex: string;
  chainName: string;
  rpcUrl: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  blockExplorerUrl: string;
}

export const BOT_CHAIN_NETWORKS: Record<"mainnet" | "testnet", BotChainNetworkConfig> = {
  mainnet: {
    chainId: 677,
    chainIdHex: "0x2a5",
    chainName: "BOT Chain Mainnet",
    rpcUrl: "https://rpc.botchain.ai",
    nativeCurrency: {
      name: "BOT",
      symbol: "BOT",
      decimals: 18,
    },
    blockExplorerUrl: "https://scan.botchain.ai",
  },
  testnet: {
    chainId: 968,
    chainIdHex: "0x3c8",
    chainName: "Bohr Testnet",
    rpcUrl: "https://rpc.bohr.life",
    nativeCurrency: {
      name: "BOT",
      symbol: "tBOT",
      decimals: 18,
    },
    blockExplorerUrl: "https://scan.bohr.life",
  },
};

/**
 * Expected BOT Chain network for this environment.
 * Set NEXT_PUBLIC_BOTCHAIN_NETWORK=mainnet | testnet in .env (or NEXT_PUBLIC_STELLAR_NETWORK)
 * Defaults to "testnet" if unset.
 */
export function getExpectedNetwork(): BotChainNetworkId {
  const env =
    typeof process !== "undefined"
      ? (process.env.NEXT_PUBLIC_BOTCHAIN_NETWORK ||
         process.env.NEXT_PUBLIC_STELLAR_NETWORK as string | undefined)
      : undefined;
  if (env === "mainnet" || env === "testnet") return env;
  return "testnet";
}

/**
 * Returns network details for expected environment.
 */
export function getExpectedNetworkConfig(): BotChainNetworkConfig {
  const net = getExpectedNetwork();
  return net === "mainnet" ? BOT_CHAIN_NETWORKS.mainnet : BOT_CHAIN_NETWORKS.testnet;
}

/**
 * When true, wrong-network warning is not shown (e.g. dev mode).
 * Set NEXT_PUBLIC_NETWORK_BYPASS=true in .env
 */
export function isNetworkBypassEnabled(): boolean {
  if (typeof process === "undefined") return false;
  return process.env.NEXT_PUBLIC_NETWORK_BYPASS === "true";
}

export function getExplorerTxUrl(txHash: string, networkId: BotChainNetworkId = getExpectedNetwork()): string {
  const config = networkId === "mainnet" ? BOT_CHAIN_NETWORKS.mainnet : BOT_CHAIN_NETWORKS.testnet;
  return `${config.blockExplorerUrl}/tx/${txHash}`;
}

export function getExplorerAddressUrl(address: string, networkId: BotChainNetworkId = getExpectedNetwork()): string {
  const config = networkId === "mainnet" ? BOT_CHAIN_NETWORKS.mainnet : BOT_CHAIN_NETWORKS.testnet;
  return `${config.blockExplorerUrl}/address/${address}`;
}
