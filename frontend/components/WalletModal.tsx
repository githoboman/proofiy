"use client";

import { useState, useRef, useEffect } from "react";
import {
  ExternalLink,
  Loader2,
  ChevronDown,
  Wallet,
  Zap,
} from "lucide-react";
import { useWallet } from "@/context/WalletContext";
import { METAMASK_INSTALL_URL, BO_WALLET_INSTALL_URL } from "@/services/wallet";
import { motion, AnimatePresence } from "framer-motion";
import { AccountDropdown } from "@/components/wallet/AccountDropdown";

export function WalletModal() {
  const {
    publicKey,
    isConnected,
    isConnecting,
    connectError,
    connect,
    connectDemo,
    clearError,
  } = useWallet();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (isConnected && publicKey) {
    return <AccountDropdown />;
  }

  return (
    <div className="relative inline-block w-full sm:w-auto" ref={dropdownRef}>
      {/* Combined Connect Wallet Button */}
      <div className="inline-flex w-full sm:w-auto rounded-lg shadow-button-glow hover:shadow-glow">
        <button
          onClick={() => connect()}
          disabled={isConnecting}
          aria-label={isConnecting ? "Connecting wallet" : "Connect Web3 Wallet"}
          className="flex-1 sm:flex-initial rounded-l-lg bg-primary hover:bg-primary/90 text-white px-4 py-2.5 text-sm font-semibold flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-70 focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2 focus-visible:ring-offset-darkblue"
        >
          {isConnecting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              <span>Connecting…</span>
            </>
          ) : (
            <>
              <Wallet className="h-4 w-4" aria-hidden="true" />
              <span>Connect Wallet</span>
            </>
          )}
        </button>
        <button
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
          aria-haspopup="true"
          aria-controls="wallet-menu"
          aria-label="More wallet options"
          className="rounded-r-lg border-l border-white/20 bg-primary hover:bg-primary/90 text-white px-2.5 py-2.5 flex items-center justify-center transition cursor-pointer focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2 focus-visible:ring-offset-darkblue"
        >
          <ChevronDown
            className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
            aria-hidden="true"
          />
        </button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            id="wallet-menu"
            role="menu"
            aria-label="Wallet options"
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-2 w-64 overflow-hidden rounded-xl border border-white/10 bg-darkblue/95 p-1.5 shadow-xl backdrop-blur-md z-50"
          >
            <button
              role="menuitem"
              onClick={() => {
                connect("injected");
                setIsOpen(false);
              }}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-white/90 transition hover:bg-white/10 hover:text-white cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
            >
              <Wallet className="h-4 w-4 text-cyan-400" aria-hidden="true" />
              <span>MetaMask / EVM Wallet</span>
            </button>

            <button
              role="menuitem"
              onClick={() => {
                connectDemo();
                setIsOpen(false);
              }}
              className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm text-emerald-400 transition hover:bg-white/10 hover:text-emerald-300 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
            >
              <div className="flex items-center gap-2.5">
                <Zap className="h-4 w-4 text-amber-400" aria-hidden="true" />
                <span>Demo Testnet Wallet</span>
              </div>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                125 tBOT
              </span>
            </button>

            <div className="my-1 border-t border-white/10" />

            <a
              role="menuitem"
              href={METAMASK_INSTALL_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs text-white/70 transition hover:bg-white/10 hover:text-white cursor-pointer"
              onClick={() => setIsOpen(false)}
            >
              <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Install MetaMask</span>
            </a>
            <a
              role="menuitem"
              href={BO_WALLET_INSTALL_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs text-white/70 transition hover:bg-white/10 hover:text-white cursor-pointer"
              onClick={() => setIsOpen(false)}
            >
              <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Install BO Wallet</span>
            </a>
          </motion.div>
        )}
      </AnimatePresence>

      {connectError && (
        <div className="absolute top-full right-0 mt-2 w-full min-w-[260px] z-40">
          <div role="alert" className="flex flex-col gap-2 rounded-lg bg-red-500/10 border border-red-500/30 p-3 backdrop-blur-md">
            <span className="text-xs text-red-300 leading-relaxed">{connectError}</span>
            <div className="flex items-center justify-end gap-2 pt-1 border-t border-red-500/20">
              <button
                type="button"
                onClick={() => {
                  clearError();
                  connectDemo();
                }}
                className="text-xs font-semibold px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 transition cursor-pointer"
              >
                ⚡ Use Demo Wallet
              </button>
              <button
                type="button"
                onClick={clearError}
                aria-label="Dismiss wallet error"
                className="text-white/60 hover:text-white text-xs font-medium px-2 py-1 rounded transition cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
