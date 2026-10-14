"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  walletService,
  type NetworkDetails,
} from "@/services/wallet";
import type { BotChainNetworkId } from "@/config/network";

const STORAGE_KEY = "botchain_wallet_address";
const LEGACY_STORAGE_KEY = "freighter_public_key";
const NETWORK_POLL_INTERVAL_MS = 4000;

interface WalletState {
  publicKey: string | null;
  isConnected: boolean;
  isFreighterInstalled: boolean | null; // Kept as alias for backward compatibility
  isWalletInstalled: boolean | null;
  isConnecting: boolean;
  isDemoWallet: boolean;
  connectError: string | null;
  networkDetails: NetworkDetails | null;
  balance: string | null;
  connect: (mode?: "auto" | "injected" | "demo") => Promise<void>;
  connectDemo: () => Promise<void>;
  disconnect: () => void;
  switchNetwork: (targetNetwork?: BotChainNetworkId) => Promise<boolean>;
  signTx: (data: string) => Promise<string>;
  clearError: () => void;
  refreshNetwork: () => Promise<void>;
}

const WalletContext = createContext<WalletState | undefined>(undefined);

export function useWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
}

export function WalletProvider({ children }: { children: ReactNode }) {
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isWalletInstalled, setIsWalletInstalled] = useState<boolean>(false);
  const [isDemoWallet, setIsDemoWallet] = useState<boolean>(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectError, setConnectError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [networkDetails, setNetworkDetails] = useState<NetworkDetails | null>(null);
  const [balance, setBalance] = useState<string | null>(null);

  const refreshNetwork = useCallback(async () => {
    try {
      const details = await walletService.getNetworkDetails();
      setNetworkDetails(details);
    } catch {
      setNetworkDetails(null);
    }
  }, []);

  const refreshBalance = useCallback(async (address: string) => {
    if (walletService.getBalance) {
      try {
        const bal = await walletService.getBalance(address);
        setBalance(bal);
      } catch {
        setBalance(null);
      }
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    walletService.isInstalled().then((installed) => {
      if (!cancelled) setIsWalletInstalled(installed);
    });
    setMounted(true);
    return () => {
      cancelled = true;
    };
  }, []);

  // Listen to EVM wallet events
  useEffect(() => {
    if (typeof window === "undefined" || !window.ethereum?.on) return;

    const handleAccountsChanged = (accounts: string[]) => {
      if (!accounts || accounts.length === 0) {
        disconnect();
      } else {
        const address = accounts[0];
        setPublicKey(address);
        setIsConnected(true);
        setIsDemoWallet(false);
        localStorage.setItem(STORAGE_KEY, address);
        refreshBalance(address);
      }
    };

    const handleChainChanged = () => {
      refreshNetwork();
      if (publicKey) refreshBalance(publicKey);
    };

    window.ethereum.on("accountsChanged", handleAccountsChanged);
    window.ethereum.on("chainChanged", handleChainChanged);

    return () => {
      if (window.ethereum?.removeListener) {
        window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
        window.ethereum.removeListener("chainChanged", handleChainChanged);
      }
    };
  }, [publicKey, refreshNetwork, refreshBalance]);

  const disconnect = useCallback(() => {
    setPublicKey(null);
    setIsConnected(false);
    setIsDemoWallet(false);
    setConnectError(null);
    setNetworkDetails(null);
    setBalance(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(LEGACY_STORAGE_KEY);
      localStorage.removeItem("walletConnected");
      localStorage.removeItem("botchain_wallet_mode");
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const saved =
      typeof window !== "undefined"
        ? localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY)
        : null;
    if (!saved) return;
    walletService.getAddress().then((address) => {
      if (address && address.toLowerCase() === saved.toLowerCase()) {
        setPublicKey(address);
        setIsConnected(true);
        setIsDemoWallet(walletService.isDemoActive());
        refreshBalance(address);
      } else {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(LEGACY_STORAGE_KEY);
      }
    });
  }, [mounted, refreshBalance]);

  useEffect(() => {
    if (!mounted || !isConnected) return;
    refreshNetwork();
    const interval = setInterval(refreshNetwork, NETWORK_POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [mounted, isConnected, refreshNetwork]);

  const clearError = useCallback(() => setConnectError(null), []);

  const connect = useCallback(async (mode: "auto" | "injected" | "demo" = "auto") => {
    setConnectError(null);
    setIsConnecting(true);
    try {
      const result = await walletService.requestAccess(mode);
      if (result.error) {
        setConnectError(result.error);
        return;
      }

      if (result.address) {
        setPublicKey(result.address);
        setIsConnected(true);
        setIsDemoWallet(Boolean(result.isDemo));
        setConnectError(null);
        if (typeof window !== "undefined") {
          localStorage.setItem(STORAGE_KEY, result.address);
          localStorage.setItem("walletConnected", "true");
        }
        const details = await walletService.getNetworkDetails();
        setNetworkDetails(details);
        refreshBalance(result.address);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to connect to wallet.";
      setConnectError(message);
    } finally {
      setIsConnecting(false);
    }
  }, [refreshBalance]);

  const connectDemo = useCallback(async () => {
    return connect("demo");
  }, [connect]);

  const switchNetwork = useCallback(async (targetNetwork?: BotChainNetworkId) => {
    const success = await walletService.switchNetwork(targetNetwork);
    if (success) {
      await refreshNetwork();
      if (publicKey) await refreshBalance(publicKey);
    }
    return success;
  }, [refreshNetwork, refreshBalance, publicKey]);

  const signTx = useCallback(async (data: string): Promise<string> => {
    if (walletService.isDemoActive()) {
      return `0xdemo_signature_${Buffer.from(data).toString("hex").slice(0, 40)}`;
    }
    if (typeof window === "undefined" || !window.ethereum || !publicKey) {
      throw new Error("Wallet not connected");
    }
    return (await window.ethereum.request({
      method: "personal_sign",
      params: [data, publicKey],
    })) as string;
  }, [publicKey]);

  const value: WalletState = {
    publicKey,
    isConnected: mounted && isConnected,
    isFreighterInstalled: isWalletInstalled, // backward compatibility
    isWalletInstalled,
    isConnecting,
    isDemoWallet,
    connectError,
    networkDetails,
    balance,
    connect,
    connectDemo,
    disconnect,
    switchNetwork,
    signTx,
    clearError,
    refreshNetwork,
  };

  return (
    <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
  );
}
