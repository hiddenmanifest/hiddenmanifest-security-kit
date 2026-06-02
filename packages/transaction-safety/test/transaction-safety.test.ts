import { describe, expect, it } from 'vitest';
import {
  ensureAllowance,
  formatTokenAmount,
  getExplorerTxUrl,
  isNativeTokenAddress,
  isValidEvmAddress,
  parseTokenAmount,
  validateTransactionIntent
} from '../src/index.js';

describe('@hiddenmanifest/transaction-safety', () => {
  it('detects native token sentinel addresses', () => {
    expect(isNativeTokenAddress('0x0000000000000000000000000000000000000000')).toBe(true);
    expect(isNativeTokenAddress('0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE')).toBe(true);
    expect(isNativeTokenAddress('0x0000000000000000000000000000000000000001')).toBe(false);
  });

  it('validates EVM addresses', () => {
    expect(isValidEvmAddress('0x0000000000000000000000000000000000000001')).toBe(true);
    expect(isValidEvmAddress('0x123')).toBe(false);
    expect(isValidEvmAddress('not-address')).toBe(false);
  });

  it('parses and formats token amounts without floating point loss', () => {
    const amount = parseTokenAmount('123456789.123456789123456789', 18);
    expect(amount).toBe(123456789123456789123456789n);
    expect(formatTokenAmount(amount, 18)).toBe('123456789.123456789123456789');
  });

  it('validates transaction intent', () => {
    expect(
      validateTransactionIntent({
        chainId: 137,
        fromAddress: '0x0000000000000000000000000000000000000001',
        toAddress: '0x0000000000000000000000000000000000000002',
        data: '0x',
        value: 0n
      }).ok
    ).toBe(true);

    expect(
      validateTransactionIntent({
        chainId: 0,
        fromAddress: 'bad',
        toAddress: '0x0000000000000000000000000000000000000002',
        data: '0xz'
      }).errors
    ).toEqual([
      'chainId must be a positive integer',
      'fromAddress must be a valid EVM address',
      'data must be a hex byte string'
    ]);
  });

  it('builds explorer URLs for supported chains', () => {
    expect(
      getExplorerTxUrl(
        137,
        '0x0000000000000000000000000000000000000000000000000000000000000000'
      )
    ).toBe(
      'https://polygonscan.com/tx/0x0000000000000000000000000000000000000000000000000000000000000000'
    );
  });

  it('ensures allowance through adapter interfaces', async () => {
    const approvals: bigint[] = [];
    const result = await ensureAllowance({
      tokenAddress: '0x0000000000000000000000000000000000000001',
      ownerAddress: '0x0000000000000000000000000000000000000002',
      spenderAddress: '0x0000000000000000000000000000000000000003',
      requiredAmount: 100n,
      reader: { allowance: async () => 50n },
      writer: {
        approve: async (_spender, amount) => {
          approvals.push(amount);
        }
      }
    });

    expect(result).toEqual({
      approved: true,
      resetFirst: true,
      allowance: 50n,
      approvedAmount: 100n
    });
    expect(approvals).toEqual([0n, 100n]);
  });
});

