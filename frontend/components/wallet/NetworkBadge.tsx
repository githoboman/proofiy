"use client";

import { useWallet } from "@/context/WalletContext";
import type { BotChainNetworkId } from "@/config/network";

const NETWORK_LABELS: Record<Exclude<BotChainNetworkId, "unknown">, string> = {
  mainnet: "BOT Mainnet (677)",
  testnet: "Bohr Testnet (968)",
};

function BadgeLabel({ network }: { network: BotChainNetworkId }) {
  const label = network === "unknown" ? "Unknown Network" : NETWORK_LABELS[network];
  const isTestnet = network === "testnet";
  const isMainnet = network === "mainnet";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium tabular-nums ${
        isMainnet
          ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
          : isTestnet
            ? "bg-cyan-500/15 text-cyan-400 border border-cyan-500/30"
            : "bg-red-500/15 text-red-400 border border-red-500/30"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          isMainnet
            ? "bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]"
            : isTestnet
              ? "bg-cyan-400 shadow-[0_0_6px_rgba(34,211,238,0.8)]"
              : "bg-red-400 shadow-[0_0_6px_rgba(248,113,113,0.8)]"
        }`}
        aria-hidden="true"
      />
      {label}
    </span>
  );
}

export default function NetworkBadge() {
  const { isConnected, networkDetails } = useWallet();

  if (!isConnected) return null;
  const network = networkDetails?.network ?? "unknown";

  return (
    <div
      className="flex items-center"
      aria-label={`Connected to BOT Chain ${networkDetails?.chainName ?? "Unknown"} network`}
    >
      <BadgeLabel network={network} />
    </div>
  );
}
