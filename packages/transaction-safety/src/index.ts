export type HexAddress = `0x${string}`;

export type ChainNetwork = {
  chainId: number;
  name: string;
  explorerTxUrl?: string;
};

export type TokenAmount = {
  tokenAddress: string;
  amount: bigint;
  decimals: number;
  symbol?: string;
};

export type TransactionIntent = {
  chainId: number;
  fromAddress: string;
  toAddress: string;
  data: string;
  value?: bigint;
  gasLimit?: bigint;
  description?: string;
};

export type TransactionIntentValidation = {
  ok: boolean;
  errors: string[];
};

export type ApprovalAmount = bigint | 'max';

export type AllowanceReader = {
  allowance(ownerAddress: string, spenderAddress: string): Promise<bigint>;
};

export type ApprovalWriter = {
  approve(spenderAddress: string, amount: bigint): Promise<void>;
};

export type EnsureAllowanceParams = {
  tokenAddress: string;
  ownerAddress: string;
  spenderAddress: string;
  requiredAmount: bigint;
  reader: AllowanceReader;
  writer: ApprovalWriter;
  approvalAmount?: ApprovalAmount;
  maxApprovalAmount?: bigint;
};

export type EnsureAllowanceResult =
  | { approved: false; reason: 'native-token' | 'sufficient-allowance'; allowance: bigint }
  | { approved: true; resetFirst: boolean; allowance: bigint; approvedAmount: bigint };

export const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
export const EVM_NATIVE_TOKEN_ADDRESS = '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee';
export const DEFAULT_MAX_APPROVAL_AMOUNT = (1n << 256n) - 1n;

const NATIVE_TOKEN_ADDRESSES = new Set([ZERO_ADDRESS, EVM_NATIVE_TOKEN_ADDRESS]);

const EXPLORER_URLS: Record<number, string> = {
  1: 'https://etherscan.io/tx/',
  56: 'https://bscscan.com/tx/',
  137: 'https://polygonscan.com/tx/',
  42161: 'https://arbiscan.io/tx/',
  80002: 'https://amoy.polygonscan.com/tx/',
  11155111: 'https://sepolia.etherscan.io/tx/'
};

export function isValidEvmAddress(address: string): address is HexAddress {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

export function normalizeEvmAddress(address: string): HexAddress {
  if (!isValidEvmAddress(address)) {
    throw new Error(`Invalid EVM address: ${address}`);
  }
  return address.toLowerCase() as HexAddress;
}

export function isNativeTokenAddress(tokenAddress: string): boolean {
  return NATIVE_TOKEN_ADDRESSES.has(tokenAddress.toLowerCase());
}

export function assertPositiveAmount(amount: bigint, label = 'amount'): void {
  if (amount <= 0n) {
    throw new Error(`${label} must be greater than zero`);
  }
}

export function parseTokenAmount(value: string, decimals: number): bigint {
  if (!Number.isInteger(decimals) || decimals < 0) {
    throw new Error('decimals must be a non-negative integer');
  }

  const trimmed = value.trim();
  if (!/^\d+(\.\d+)?$/.test(trimmed)) {
    throw new Error(`Invalid token amount: ${value}`);
  }

  const [whole = '0', fraction = ''] = trimmed.split('.');
  if (fraction.length > decimals) {
    throw new Error(`Token amount has more than ${decimals} decimal places`);
  }

  return BigInt(whole + fraction.padEnd(decimals, '0'));
}

export function formatTokenAmount(amount: bigint, decimals: number): string {
  if (!Number.isInteger(decimals) || decimals < 0) {
    throw new Error('decimals must be a non-negative integer');
  }

  const sign = amount < 0n ? '-' : '';
  const absolute = amount < 0n ? -amount : amount;
  const raw = absolute.toString().padStart(decimals + 1, '0');
  const whole = raw.slice(0, raw.length - decimals) || '0';
  const fraction = decimals === 0 ? '' : raw.slice(raw.length - decimals).replace(/0+$/, '');

  return `${sign}${whole}${fraction ? `.${fraction}` : ''}`;
}

export function getExplorerTxUrl(chainId: number, txHash: string): string {
  if (!/^0x[a-fA-F0-9]{64}$/.test(txHash)) {
    throw new Error(`Invalid transaction hash: ${txHash}`);
  }

  const baseUrl = EXPLORER_URLS[chainId];
  if (!baseUrl) {
    throw new Error(`Unsupported explorer chain ID: ${chainId}`);
  }

  return `${baseUrl}${txHash}`;
}

export function validateTransactionIntent(intent: TransactionIntent): TransactionIntentValidation {
  const errors: string[] = [];

  if (!Number.isInteger(intent.chainId) || intent.chainId <= 0) {
    errors.push('chainId must be a positive integer');
  }
  if (!isValidEvmAddress(intent.fromAddress)) {
    errors.push('fromAddress must be a valid EVM address');
  }
  if (!isValidEvmAddress(intent.toAddress)) {
    errors.push('toAddress must be a valid EVM address');
  }
  if (!/^0x([a-fA-F0-9]{2})*$/.test(intent.data)) {
    errors.push('data must be a hex byte string');
  }
  if (intent.value !== undefined && intent.value < 0n) {
    errors.push('value cannot be negative');
  }
  if (intent.gasLimit !== undefined && intent.gasLimit <= 0n) {
    errors.push('gasLimit must be greater than zero');
  }

  return { ok: errors.length === 0, errors };
}

export async function ensureAllowance(
  params: EnsureAllowanceParams
): Promise<EnsureAllowanceResult> {
  if (isNativeTokenAddress(params.tokenAddress)) {
    return { approved: false, reason: 'native-token', allowance: 0n };
  }

  const allowance = await params.reader.allowance(params.ownerAddress, params.spenderAddress);
  if (allowance >= params.requiredAmount) {
    return { approved: false, reason: 'sufficient-allowance', allowance };
  }

  const approvedAmount =
    params.approvalAmount === 'max'
      ? (params.maxApprovalAmount ?? DEFAULT_MAX_APPROVAL_AMOUNT)
      : (params.approvalAmount ?? params.requiredAmount);

  const resetFirst = allowance > 0n;
  if (resetFirst) {
    await params.writer.approve(params.spenderAddress, 0n);
  }
  await params.writer.approve(params.spenderAddress, approvedAmount);

  return { approved: true, resetFirst, allowance, approvedAmount };
}

