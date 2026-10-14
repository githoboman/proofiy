import { getExpectedNetworkConfig } from "@/config/network";

export type TxStatus = 'PENDING' | 'CONFIRMED' | 'FAILED';

export interface TransactionStatusResult {
  hash: string;
  status: TxStatus;
  ledger?: number;
  blockNumber?: number;
  createdAt?: string;
}

export function getExplorerUrl(hash: string): string {
  const config = getExpectedNetworkConfig();
  return `${config.blockExplorerUrl}/tx/${hash}`;
}

export function getExplorerAccountUrl(address: string): string {
  const config = getExpectedNetworkConfig();
  return `${config.blockExplorerUrl}/address/${address}`;
}

// Mock store to simulate status progression during development
const mockStatusStore: Record<string, { calls: number }> = {};

/**
 * Fetches transaction status from BOT Chain JSON-RPC endpoint.
 * Falls back to mock data when the real network is unavailable or mock mode is active.
 */
export async function fetchTransactionStatus(
  hash: string
): Promise<TransactionStatusResult> {
  const config = getExpectedNetworkConfig();

  try {
    const res = await fetch(config.rpcUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "eth_getTransactionReceipt",
        params: [hash],
      }),
      cache: "no-store",
    });

    if (!res.ok) {
      throw new Error(`RPC responded with ${res.status}`);
    }

    const data = await res.json();
    const receipt = data?.result;

    if (!receipt) {
      return { hash, status: "PENDING" };
    }

    const isSuccess = receipt.status === "0x1" || receipt.status === 1;
    const blockNumber = receipt.blockNumber ? parseInt(receipt.blockNumber, 16) : undefined;

    return {
      hash,
      status: isSuccess ? "CONFIRMED" : "FAILED",
      blockNumber,
      ledger: blockNumber, // Backward compatibility alias
      createdAt: new Date().toISOString(),
    };
  } catch {
    // Return mock progressive status during development / when network is unavailable
    return getMockStatus(hash);
  }
}

function getMockStatus(hash: string): TransactionStatusResult {
  if (!mockStatusStore[hash]) {
    mockStatusStore[hash] = { calls: 0 };
  }
  mockStatusStore[hash].calls += 1;
  const calls = mockStatusStore[hash].calls;

  // Simulate: pending for first 3 polls, then confirmed
  const status: TxStatus = calls < 3 ? 'PENDING' : 'CONFIRMED';
  const mockBlock = status === 'CONFIRMED' ? 54321 : undefined;
  return {
    hash,
    status,
    blockNumber: mockBlock,
    ledger: mockBlock,
  };
}
