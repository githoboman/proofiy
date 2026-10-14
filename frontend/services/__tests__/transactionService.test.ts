import { fetchTransactionStatus, getExplorerUrl } from '../transactionService';
import { getExpectedNetworkConfig } from '@/config/network';

const VALID_HASH = '0x' + 'a'.repeat(64);

describe('transactionService', () => {
  describe('getExplorerUrl', () => {
    it('returns the BOT Chain explorer URL', () => {
      const config = getExpectedNetworkConfig();
      expect(getExplorerUrl(VALID_HASH)).toBe(
        `${config.blockExplorerUrl}/tx/${VALID_HASH}`
      );
    });
  });

  describe('fetchTransactionStatus', () => {
    beforeEach(() => {
      jest.resetAllMocks();
    });

    it('returns CONFIRMED when RPC responds with receipt status 0x1', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          result: {
            status: '0x1',
            blockNumber: '0x64', // 100 in hex
          },
        }),
      }) as jest.Mock;

      const result = await fetchTransactionStatus(VALID_HASH);
      expect(result.status).toBe('CONFIRMED');
      expect(result.blockNumber).toBe(100);
      expect(result.ledger).toBe(100);
    });

    it('returns FAILED when RPC responds with receipt status 0x0', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          result: {
            status: '0x0',
            blockNumber: '0x64',
          },
        }),
      }) as jest.Mock;

      const result = await fetchTransactionStatus(VALID_HASH);
      expect(result.status).toBe('FAILED');
    });

    it('returns PENDING when RPC returns null receipt (not mined yet)', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ result: null }),
      }) as jest.Mock;

      const result = await fetchTransactionStatus(VALID_HASH);
      expect(result.status).toBe('PENDING');
    });

    it('falls back to mock data on network error', async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));
      const result = await fetchTransactionStatus('0xmockfallback' + 'b'.repeat(50));
      expect(['PENDING', 'CONFIRMED', 'FAILED']).toContain(result.status);
    });
  });
});

