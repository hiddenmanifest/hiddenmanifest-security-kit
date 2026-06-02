import { describe, expect, it } from 'vitest';
import {
  mockBroadcasterFee,
  mockBroadcasterSend,
  mockSwapQuote,
  mockSwapRecipe,
  mockVaultEnvelope,
  serializeBigInts,
  stringifyBigInts
} from '../src/index.js';

describe('@hiddenmanifest/api-contracts', () => {
  it('serializes bigint values recursively', () => {
    const serialized = serializeBigInts({
      amount: 10n,
      nested: [{ gas: 20n }]
    });

    expect(serialized).toEqual({
      amount: '10',
      nested: [{ gas: '20' }]
    });
    expect(stringifyBigInts({ amount: 10n })).toBe('{"amount":"10"}');
  });

  it('exports mock vault, quote, recipe, and broadcaster contracts', () => {
    expect(mockVaultEnvelope.version).toBe(2);
    expect(mockSwapQuote.dryRun).toBe(true);
    expect(mockSwapRecipe.crossContractCalls[0]?.data).toBe('0x');
    expect(mockBroadcasterFee.feesID).toBe('mock-fees-id');
    expect(mockBroadcasterSend.txHash).toMatch(/^0x[a-f0-9]{64}$/);
  });
});

