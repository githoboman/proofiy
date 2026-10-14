"use client";

import { useState } from "react";
import { useWallet } from "@/context/WalletContext";
import { getExpectedNetwork, isNetworkBypassEnabled, type BotChainNetworkId } from "@/config/network";
import { ArrowRightLeft, AlertTriangle } from "lucide-react";

const NETWORK_LABELS: Record<Exclude<BotChainNetworkId, "unknown">, string> = {
  mainnet: "BOT Chain Mainnet (677)",
  testnet: "Bohr Testnet (968)",
};

function networkLabel(network: BotChainNetworkId): string {
  return network === "unknown" ? "Unknown Chain" : NETWORK_LABELS[network] ?? network;
}

export default function WrongNetworkWarning() {
  const { isConnected, networkDetails, switchNetwork } = useWallet();
  const [isSwitching, setIsSwitching] = useState(false);
  const expected = getExpectedNetwork();
  const bypass = isNetworkBypassEnabled();

  if (!isConnected || bypass || !networkDetails) return null;
  const current = networkDetails.network;
  if (current === expected || current === "unknown") return null;

  const handleSwitch = async () => {
    setIsSwitching(true);
    try {
      await switchNetwork(expected);
    } finally {
      setIsSwitching(false);
    }
  };

  return (
    <div
      role="alert"
      className="sticky top-0 z-40 w-full border-b border-amber-500/50 bg-amber-500/15 px-4 py-2.5 text-center text-sm font-medium text-amber-900 dark:bg-amber-950/70 dark:text-amber-200 backdrop-blur-md flex items-center justify-center gap-3 flex-wrap"
    >
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" aria-hidden="true" />
        <span>
          Wrong network: wallet is connected to <strong>{networkLabel(current)}</strong>. This app expects{" "}
          <strong>{networkLabel(expected)}</strong>.
        </span>
      </div>

      <button
        onClick={handleSwitch}
        disabled={isSwitching}
        className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 px-3 py-1 text-xs font-semibold text-white transition-colors disabled:opacity-50 shadow-sm"
      >
        <ArrowRightLeft className={`h-3 w-3 ${isSwitching ? "animate-spin" : ""}`} />
        {isSwitching ? "Switching..." : `Switch to ${networkLabel(expected)}`}
      </button>
    </div>
  );
}
