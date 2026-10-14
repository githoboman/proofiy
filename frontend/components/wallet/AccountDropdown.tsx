"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Copy, Check, LogOut, ExternalLink, ChevronDown, Coins } from "lucide-react";
import { useWallet } from "@/context/WalletContext";
import { getExplorerAccountUrl } from "@/services/transactionService";
import { clsx } from "clsx";

/**
 * AccountDropdown Component
 *
 * Professional BOT Chain wallet account management dropdown.
 */
export function AccountDropdown() {
  const { publicKey, disconnect, networkDetails, balance } = useWallet();
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Truncate EVM address for display (e.g., 0x1234...5678)
  const shortenAddress = (address: string) => {
    if (!address) return "";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Handle copying the full address to clipboard
  const handleCopy = useCallback(async () => {
    if (publicKey) {
      try {
        await navigator.clipboard.writeText(publicKey);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error("Failed to copy address:", err);
      }
    }
  }, [publicKey]);

  const toggleDropdown = () => setIsOpen((prev) => !prev);
  const closeDropdown = useCallback(() => setIsOpen(false), []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        closeDropdown();
      }
    };

    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeDropdown();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEsc);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEsc);
    };
  }, [isOpen, closeDropdown]);

  if (!publicKey) return null;

  const explorerUrl = getExplorerAccountUrl(publicKey);

  return (
    <div
      className="relative inline-block w-full text-left sm:w-auto"
      ref={dropdownRef}
    >
      {/* Trigger Button */}
      <button
        onClick={toggleDropdown}
        className={clsx(
          "flex w-full items-center justify-center gap-2.5 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white shadow-lg backdrop-blur-md transition-all hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 sm:w-auto sm:justify-start",
          isOpen && "ring-2 ring-cyan-400/50 bg-white/20",
        )}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-controls="account-menu"
        aria-label={`Wallet account ${shortenAddress(publicKey)}, ${isOpen ? "close" : "open"} account menu`}
      >
        <div className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.7)]" aria-hidden="true" />
        <span className="font-mono tracking-wide" aria-hidden="true">
          {shortenAddress(publicKey)}
        </span>
        <ChevronDown
          className={clsx(
            "h-4 w-4 text-white/70 transition-transform duration-200",
            isOpen && "rotate-180",
          )}
          aria-hidden="true"
        />
      </button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            id="account-menu"
            role="menu"
            aria-label="Account options"
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
            className="absolute right-0 z-50 mt-3 w-72 origin-top-right overflow-hidden rounded-2xl border border-white/15 bg-slate-900/95 p-2 shadow-2xl backdrop-blur-xl focus:outline-none"
          >
            {/* Header / Address Info */}
            <div className="px-3 py-3 rounded-xl bg-white/5 border border-white/5 mb-2">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase tracking-wider text-cyan-400">
                  {networkDetails?.chainName || "BOT Chain"}
                </p>
                {balance !== null && (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400 font-mono">
                    <Coins className="h-3 w-3" />
                    {balance} BOT
                  </span>
                )}
              </div>
              <p className="mt-1.5 truncate font-mono text-xs text-white/90">
                {publicKey}
              </p>
            </div>

            {/* Actions Group */}
            <div className="space-y-1">
              <button
                role="menuitem"
                onClick={handleCopy}
                aria-label={copied ? "Address copied to clipboard" : "Copy wallet address to clipboard"}
                className="group flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm text-white/80 transition-colors hover:bg-white/10 hover:text-white"
              >
                <div className="flex items-center gap-2.5">
                  {copied ? (
                    <Check className="h-4 w-4 text-emerald-400" />
                  ) : (
                    <Copy className="h-4 w-4 text-white/60 group-hover:text-white" />
                  )}
                  <span>{copied ? "Copied to clipboard" : "Copy Address"}</span>
                </div>
              </button>

              <a
                role="menuitem"
                href={explorerUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="View account on BOTScan (opens in new tab)"
                className="group flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-white/80 transition-colors hover:bg-white/10 hover:text-white"
                onClick={closeDropdown}
              >
                <ExternalLink className="h-4 w-4 text-white/60 group-hover:text-white" />
                <span>View on BOTScan</span>
              </a>
            </div>

            {/* Disconnect Action */}
            <div className="mt-1 border-t border-white/10 pt-1">
              <button
                role="menuitem"
                onClick={() => {
                  disconnect();
                  closeDropdown();
                }}
                aria-label="Disconnect wallet"
                className="group flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-red-400 transition-colors hover:bg-red-500/10 hover:text-red-300"
              >
                <LogOut className="h-4 w-4 text-red-400 group-hover:text-red-300" />
                <span>Disconnect Wallet</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
