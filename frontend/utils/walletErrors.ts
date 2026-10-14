import { useToast } from '@/app/context/ToastContext';

export enum WalletErrorType {
  USER_REJECTED = 'USER_REJECTED',
  NETWORK_MISMATCH = 'NETWORK_MISMATCH',
  EXTENSION_NOT_FOUND = 'EXTENSION_NOT_FOUND',
  TIMEOUT = 'TIMEOUT',
  AUTHORIZATION_FAILED = 'AUTHORIZATION_FAILED',
  UNKNOWN = 'UNKNOWN',
}

const ERROR_MESSAGES: Record<WalletErrorType, string> = {
  [WalletErrorType.USER_REJECTED]: 'Connection request was rejected. Please approve it in your Web3 wallet (MetaMask / BO Wallet) and try again.',
  [WalletErrorType.NETWORK_MISMATCH]: 'Network mismatch detected. Please switch your wallet to BOT Chain (Chain ID 677 or 968).',
  [WalletErrorType.EXTENSION_NOT_FOUND]: 'No EVM Web3 wallet found. Please install MetaMask, BO Wallet, or use BOT Chain Agent Wallet.',
  [WalletErrorType.TIMEOUT]: 'The request timed out. Please check your connection to BOT Chain RPC and try again.',
  [WalletErrorType.AUTHORIZATION_FAILED]: 'Authorization failed. Please ensure your wallet has permission to connect to BOT Chain.',
  [WalletErrorType.UNKNOWN]: 'An unexpected wallet error occurred. Please try again.',
};

function classifyError(error: unknown): WalletErrorType {
  const msg = (
    typeof error === 'string' ? error :
    error instanceof Error ? error.message :
    typeof error === 'object' && error !== null && 'message' in error
      ? String((error as { message: unknown }).message)
      : ''
  ).toLowerCase();

  if (msg.includes('reject') || msg.includes('declined') || msg.includes('denied')) return WalletErrorType.USER_REJECTED;
  if (msg.includes('network') || msg.includes('mismatch') || msg.includes('chain')) return WalletErrorType.NETWORK_MISMATCH;
  if (msg.includes('not installed') || msg.includes('not found') || msg.includes('extension') || msg.includes('no evm')) return WalletErrorType.EXTENSION_NOT_FOUND;
  if (msg.includes('timeout') || msg.includes('timed out')) return WalletErrorType.TIMEOUT;
  if (msg.includes('auth') || msg.includes('unauthorized') || msg.includes('forbidden')) return WalletErrorType.AUTHORIZATION_FAILED;
  return WalletErrorType.UNKNOWN;
}

export function handleWalletError(error: unknown, addToast: (msg: string, type: 'error') => void): WalletErrorType {
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') console.error('[WalletError]', error);
  const type = classifyError(error);
  addToast(ERROR_MESSAGES[type], 'error');
  return type;
}

export function useWalletError() {
  const { addToast } = useToast();
  return (error: unknown) => handleWalletError(error, addToast);
}
