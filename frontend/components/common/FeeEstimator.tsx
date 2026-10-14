"use client";

import React, { useCallback, useEffect, useState } from "react";
import { AlertCircle, RefreshCw, Zap, Clock, ShieldCheck } from "lucide-react";
import { Skeleton } from "../ui/Skeleton";

/* ------------------------------------------------------------------ */
/*                              Types                                  */
/* ------------------------------------------------------------------ */

interface FeeData {
  gasPriceGwei: number;
  estimatedGas: number;
  botFee: number;
  botUsdRate: number;
  avgBlockTimeSeconds: number;
}

interface FeeEstimatorProps {
  /** Optional CSS class name */
  className?: string;
  /** Auto-refresh interval in ms. Pass 0 to disable. Default: 30_000 */
  refreshInterval?: number;
}

/* ------------------------------------------------------------------ */
/*                           BOT Chain RPC fetch                       */
/* ------------------------------------------------------------------ */

/** Simulates BOT Chain fee metrics based on ~0.75s block time and ~$0.06 avg fee. */
async function fetchFeeData(): Promise<FeeData> {
  await new Promise((resolve) => setTimeout(resolve, 600));

  // BOT Chain average gas: ~21000 - 85000 gas for verification/minting
  const gasPriceGwei = 3 + Math.random() * 0.5;
  const estimatedGas = 65000;
  const botFee = (gasPriceGwei * 1e-9) * estimatedGas;
  // BOT token average market price representation (~$200 - $220)
  const botUsdRate = 210.0 + Math.random() * 5;

  return {
    gasPriceGwei,
    estimatedGas,
    botFee,
    botUsdRate,
    avgBlockTimeSeconds: 0.75,
  };
}

function formatBot(bot: number): string {
  return bot.toFixed(6).replace(/0+$/, "").replace(/\.$/, "");
}

function formatUsd(usd: number): string {
  return `$${usd.toFixed(4)}`;
}

export default function FeeEstimator({
  className,
  refreshInterval = 30_000,
}: FeeEstimatorProps) {
  const [feeData, setFeeData] = useState<FeeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchFeeData();
      setFeeData(data);
      setLastUpdated(new Date());
    } catch {
      setError("Failed to fetch BOT Chain fee estimate. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!refreshInterval) return;
    const id = setInterval(load, refreshInterval);
    return () => clearInterval(id);
  }, [load, refreshInterval]);

  const feeUsd = feeData ? feeData.botFee * feeData.botUsdRate : null;

  return (
    <div
      className={[
        "rounded-2xl border border-gray-200 dark:border-gray-700/80",
        "bg-white dark:bg-gray-900/70 p-4 space-y-3 shadow-sm backdrop-blur-sm",
        className ?? "",
      ]
        .join(" ")
        .trim()}
      role="region"
      aria-label="BOT Chain Fee Estimator"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-cyan-500" aria-hidden="true" />
          <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100">
            BOT Chain Fee Estimate
          </h3>
        </div>
        <button
          type="button"
          onClick={load}
          disabled={loading}
          aria-label="Refresh fee estimate"
          className="p-1.5 rounded-lg text-gray-400 dark:text-gray-500
            hover:text-cyan-500 dark:hover:text-cyan-400
            hover:bg-gray-100 dark:hover:bg-gray-800
            disabled:opacity-40 disabled:cursor-not-allowed
            transition-colors"
        >
          <RefreshCw
            className={["w-3.5 h-3.5", loading ? "animate-spin" : ""].join(
              " "
            ).trim()}
          />
        </button>
      </div>

      {/* Body */}
      {error ? (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800">
          <AlertCircle
            className="w-4 h-4 mt-0.5 text-red-500 dark:text-red-400 shrink-0"
            aria-hidden="true"
          />
          <p className="text-xs text-red-700 dark:text-red-300">{error}</p>
        </div>
      ) : loading && !feeData ? (
        <div className="space-y-2" aria-busy="true" aria-label="Loading fee">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-28" />
        </div>
      ) : feeData && feeUsd != null ? (
        <div className="space-y-2">
          <div>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-50 tabular-nums">
              {formatBot(feeData.botFee)}{" "}
              <span className="text-sm font-medium text-cyan-600 dark:text-cyan-400">
                BOT
              </span>
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 tabular-nums">
              ~{formatUsd(feeUsd)} USD (Gas: {feeData.gasPriceGwei.toFixed(1)} Gwei)
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100 dark:border-gray-800 text-[11px] text-gray-600 dark:text-gray-400">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3 h-3 text-cyan-500" />
              <span>≈0.75s Block Time</span>
            </div>
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-3 h-3 text-emerald-500" />
              <span>PoSA Fast Finality</span>
            </div>
          </div>
        </div>
      ) : null}

      {/* Footer timestamp */}
      {lastUpdated && !error && (
        <p className="text-[10px] text-gray-400 dark:text-gray-600 pt-1 border-t border-gray-100 dark:border-gray-800">
          Updated {lastUpdated.toLocaleTimeString()} · BOT Chain Mainnet / Bohr Testnet
        </p>
      )}
    </div>
  );
}
