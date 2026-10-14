import {
  BOT_CHAIN_NETWORKS,
  getExpectedNetworkConfig,
  type BotChainNetworkId,
} from "@/config/network";

export const METAMASK_INSTALL_URL = "https://metamask.io/download/";
export const BO_WALLET_INSTALL_URL = "https://wallet.bohr.life/";
export const FREIGHTER_INSTALL_URL = METAMASK_INSTALL_URL; // Alias for backward compatibility

/** BOT Chain network identifier for display and comparison. */
export type StellarNetworkId = BotChainNetworkId;

export interface NetworkDetails {
  network: BotChainNetworkId;
  chainId: number;
  chainName: string;
  networkPassphrase?: string;
}

export type WalletConnectionResult =
  | { address: string; error?: undefined; isDemo?: boolean }
  | { address?: undefined; error: string; isDemo?: boolean };

export interface WalletService {
  isInstalled(): Promise<boolean>;
  requestAccess(mode?: "auto" | "injected" | "demo"): Promise<WalletConnectionResult>;
  connectDemo(): Promise<WalletConnectionResult>;
  getAddress(): Promise<string | null>;
  getNetworkDetails(): Promise<NetworkDetails | null>;
  switchNetwork(network?: BotChainNetworkId): Promise<boolean>;
  getBalance?(address: string): Promise<string>;
  isDemoActive(): boolean;
}

declare global {
  interface Window {
    ethereum?: {
      isMetaMask?: boolean;
      request: (args: { method: string; params?: unknown[] | object }) => Promise<any>;
      on?: (eventName: string, handler: (...args: any[]) => void) => void;
      removeListener?: (eventName: string, handler: (...args: any[]) => void) => void;
    };
  }
}

const WALLET_MODE_KEY = "botchain_wallet_mode";

function getStoredMode(): "demo" | "injected" | null {
  if (typeof window === "undefined") return null;
  return (localStorage.getItem(WALLET_MODE_KEY) as "demo" | "injected") || null;
}

function setStoredMode(mode: "demo" | "injected" | null) {
  if (typeof window === "undefined") return;
  if (mode) {
    localStorage.setItem(WALLET_MODE_KEY, mode);
  } else {
    localStorage.removeItem(WALLET_MODE_KEY);
  }
}

function getEthereum(): NonNullable<Window["ethereum"]> | null {
  if (typeof window === "undefined" || !window.ethereum) {
    return null;
  }
  return window.ethereum;
}

async function isEvmWalletInstalled(): Promise<boolean> {
  return typeof window !== "undefined" && Boolean(window.ethereum);
}

function networkIdFromChainId(chainIdHexOrDec: string | number): BotChainNetworkId {
  const chainId =
    typeof chainIdHexOrDec === "string"
      ? parseInt(chainIdHexOrDec, chainIdHexOrDec.startsWith("0x") ? 16 : 10)
      : chainIdHexOrDec;

  if (chainId === BOT_CHAIN_NETWORKS.mainnet.chainId) return "mainnet";
  if (chainId === BOT_CHAIN_NETWORKS.testnet.chainId) return "testnet";
  return "unknown";
}

async function getEvmNetworkDetails(): Promise<NetworkDetails | null> {
  if (getStoredMode() === "demo") {
    return MOCK_NETWORK;
  }

  const ethereum = getEthereum();
  if (!ethereum) return null;

  try {
    const chainIdHex = (await ethereum.request({
      method: "eth_chainId",
    })) as string;
    const chainId = parseInt(chainIdHex, 16);
    const network = networkIdFromChainId(chainId);

    const config =
      network === "mainnet"
        ? BOT_CHAIN_NETWORKS.mainnet
        : network === "testnet"
          ? BOT_CHAIN_NETWORKS.testnet
          : null;

    return {
      network,
      chainId,
      chainName: config ? config.chainName : `Unknown Chain (${chainId})`,
      networkPassphrase: config ? `BOT Chain ${config.chainName}` : "",
    };
  } catch {
    return null;
  }
}

async function switchToBotChain(targetNetwork?: BotChainNetworkId): Promise<boolean> {
  if (getStoredMode() === "demo") {
    return true;
  }

  const ethereum = getEthereum();
  if (!ethereum) return false;

  const config =
    targetNetwork === "mainnet"
      ? BOT_CHAIN_NETWORKS.mainnet
      : targetNetwork === "testnet"
        ? BOT_CHAIN_NETWORKS.testnet
        : getExpectedNetworkConfig();

  try {
    await ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: config.chainIdHex }],
    });
    return true;
  } catch (switchError: any) {
    // Error code 4902 indicates that the chain has not been added to the wallet yet.
    if (switchError.code === 4902 || switchError.data?.originalError?.code === 4902) {
      try {
        await ethereum.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: config.chainIdHex,
              chainName: config.chainName,
              nativeCurrency: config.nativeCurrency,
              rpcUrls: [config.rpcUrl],
              blockExplorerUrls: [config.blockExplorerUrl],
            },
          ],
        });
        return true;
      } catch (addError) {
        console.warn("Failed to add BOT Chain to wallet:", addError);
        return false;
      }
    }
    console.warn("Failed to switch to BOT Chain:", switchError);
    return false;
  }
}

const MOCK_PUBLIC_KEY = "0x71C8A6d2A7b282AC0C821d3f8205f0a07153Db08";

const MOCK_NETWORK: NetworkDetails = {
  network: "testnet",
  chainId: 968,
  chainName: "Bohr Testnet",
  networkPassphrase: "BOT Chain Bohr Testnet",
};

async function requestAccess(mode: "auto" | "injected" | "demo" = "auto"): Promise<WalletConnectionResult> {
  if (mode === "demo") {
    setStoredMode("demo");
    return { address: MOCK_PUBLIC_KEY, isDemo: true };
  }

  const ethereum = getEthereum();
  if (!ethereum) {
    if (mode === "injected") {
      return { error: "No EVM wallet (MetaMask, BO Wallet, etc.) detected." };
    }
    // Auto mode fallback: If no extension is detected, connect seamlessly with demo wallet
    setStoredMode("demo");
    return { address: MOCK_PUBLIC_KEY, isDemo: true };
  }

  try {
    const accounts = (await ethereum.request({
      method: "eth_requestAccounts",
    })) as string[];

    if (!accounts || accounts.length === 0) {
      return { error: "No accounts returned from wallet" };
    }

    setStoredMode("injected");

    // Attempt to switch to expected BOT Chain network (non-fatal if rejected)
    try {
      await switchToBotChain();
    } catch (e) {
      console.warn("Could not auto-switch network:", e);
    }

    return { address: accounts[0], isDemo: false };
  } catch (err: any) {
    return { error: err?.message || "Failed to connect to wallet" };
  }
}

async function connectDemo(): Promise<WalletConnectionResult> {
  setStoredMode("demo");
  return { address: MOCK_PUBLIC_KEY, isDemo: true };
}

async function getEvmAddress(): Promise<string | null> {
  if (getStoredMode() === "demo") {
    return MOCK_PUBLIC_KEY;
  }

  const ethereum = getEthereum();
  if (!ethereum) return null;

  try {
    const accounts = (await ethereum.request({
      method: "eth_accounts",
    })) as string[];

    if (accounts && accounts.length > 0) {
      return accounts[0];
    }
    return null;
  } catch {
    return null;
  }
}

async function getEvmBalance(address: string): Promise<string> {
  if (getStoredMode() === "demo" || address === MOCK_PUBLIC_KEY) {
    return "125.5000";
  }

  const ethereum = getEthereum();
  if (!ethereum || !address) return "0.0000";

  try {
    const balanceHex = (await ethereum.request({
      method: "eth_getBalance",
      params: [address, "latest"],
    })) as string;

    const wei = BigInt(balanceHex);
    // Convert wei (18 decimals) to BOT
    const whole = wei / 10n ** 18n;
    const fraction = (wei % 10n ** 18n) / 10n ** 14n; // 4 decimals
    return `${whole}.${fraction.toString().padStart(4, "0")}`;
  } catch {
    return "0.0000";
  }
}

export const walletService: WalletService = {
  isInstalled: isEvmWalletInstalled,
  requestAccess,
  connectDemo,
  getAddress: getEvmAddress,
  getNetworkDetails: getEvmNetworkDetails,
  switchNetwork: switchToBotChain,
  getBalance: getEvmBalance,
  isDemoActive: () => getStoredMode() === "demo",
};
