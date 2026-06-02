export type SerializedBigInt = string;

export type VaultEnvelopeContract = {
  version: 2;
  recoveryChainId?: number;
  encryptedMnemonic: string;
  creationBlockNumbers?: Record<string, number>;
  kdf: {
    algorithm: 'PBKDF2-SHA256';
    iterations: number;
    salt: string;
  };
  encryption: {
    algorithm: 'AES-GCM';
  };
  createdAt: string;
};

export type VaultChallengeAction = 'create-envelope' | 'delete-envelope';

export type VaultChallengeRequest = {
  address: string;
  action: VaultChallengeAction;
};

export type VaultChallengeResponse = {
  nonce: string;
  expiresAt: number;
  message: string;
};

export type VaultEnvelopeGetRequest = {
  address: string;
};

export type VaultEnvelopeGetResponse = {
  envelope: VaultEnvelopeContract;
};

export type VaultEnvelopeWriteRequest = {
  address: string;
  envelope: VaultEnvelopeContract;
  nonce: string;
  signature: string;
};

export type VaultEnvelopeDeleteRequest = {
  address: string;
  nonce: string;
  signature: string;
};

export type TokenContract = {
  address: string;
  decimals: number;
  symbol?: string;
  isBaseToken?: boolean;
};

export type SwapQuoteRequest = {
  networkName: string;
  sellToken: TokenContract;
  buyToken: TokenContract;
  sellAmount: SerializedBigInt;
  slippageBasisPoints?: number;
};

export type SwapQuoteResponse = {
  dryRun: boolean;
  sellToken: TokenContract;
  buyToken: TokenContract;
  sellAmount: SerializedBigInt;
  buyAmount: SerializedBigInt;
  minimumBuyAmount: SerializedBigInt;
  estimatedGas?: SerializedBigInt;
  appFeeBasisPoints?: number;
};

export type CrossContractCallContract = {
  to: string;
  data: string;
  value: SerializedBigInt;
};

export type ERC20AmountRecipientContract = {
  tokenAddress: string;
  amount: SerializedBigInt;
  decimals: SerializedBigInt;
  recipient: string;
};

export type SwapRecipeRequest = SwapQuoteRequest & {
  railgunAddress: string;
  destinationAddress?: string;
};

export type SwapRecipeResponse = {
  crossContractCalls: CrossContractCallContract[];
  erc20AmountRecipients: ERC20AmountRecipientContract[];
  minGasLimit: SerializedBigInt;
  stepOutputs: Array<{
    name: string;
    description?: string;
  }>;
};

export type BroadcasterFeeRequest = {
  networkName: string;
  tokenAddress: string;
};

export type BroadcasterFeeResponse = {
  broadcasterAddress: string;
  feesID: string;
  feePerUnitGas: SerializedBigInt;
  tokenFee: {
    tokenAddress: string;
    amount: SerializedBigInt;
  };
};

export type BroadcasterSendRequest = {
  networkName: string;
  address: string;
  transaction: {
    to: string;
    data: string;
  };
  broadcasterAddress: string;
  feesID: string;
  nullifiers: string[];
  overallBatchMinGasPrice: SerializedBigInt;
};

export type BroadcasterSendResponse = {
  txHash: string;
};

export type BigIntSerialized<T> = T extends bigint
  ? string
  : T extends Array<infer U>
    ? BigIntSerialized<U>[]
    : T extends object
      ? { [K in keyof T]: BigIntSerialized<T[K]> }
      : T;

export function serializeBigInts<T>(value: T): BigIntSerialized<T> {
  if (typeof value === 'bigint') {
    return value.toString() as BigIntSerialized<T>;
  }

  if (Array.isArray(value)) {
    return value.map((entry) => serializeBigInts(entry)) as BigIntSerialized<T>;
  }

  if (typeof value === 'object' && value !== null) {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [key, serializeBigInts(entry)])
    ) as BigIntSerialized<T>;
  }

  return value as BigIntSerialized<T>;
}

export function stringifyBigInts(value: unknown): string {
  return JSON.stringify(serializeBigInts(value));
}

export const mockVaultEnvelope: VaultEnvelopeContract = {
  version: 2,
  recoveryChainId: 137,
  encryptedMnemonic: 'eyJ2IjoxLCJpdiI6Im1vY2siLCJjdCI6Im1vY2siLCJ0YWciOiJtb2NrIn0=',
  creationBlockNumbers: {
    Polygon: 123456
  },
  kdf: {
    algorithm: 'PBKDF2-SHA256',
    iterations: 100_000,
    salt: '00112233445566778899aabbccddeeff'
  },
  encryption: {
    algorithm: 'AES-GCM'
  },
  createdAt: '2026-06-02T00:00:00.000Z'
};

export const mockSwapQuote: SwapQuoteResponse = {
  dryRun: true,
  sellToken: {
    address: '0x0000000000000000000000000000000000000001',
    decimals: 18,
    symbol: 'SELL'
  },
  buyToken: {
    address: '0x0000000000000000000000000000000000000002',
    decimals: 18,
    symbol: 'BUY'
  },
  sellAmount: '1000000000000000000',
  buyAmount: '990000000000000000',
  minimumBuyAmount: '980000000000000000',
  estimatedGas: '500000',
  appFeeBasisPoints: 0
};

export const mockSwapRecipe: SwapRecipeResponse = {
  crossContractCalls: [
    {
      to: '0x0000000000000000000000000000000000000003',
      data: '0x',
      value: '0'
    }
  ],
  erc20AmountRecipients: [
    {
      tokenAddress: mockSwapQuote.buyToken.address,
      amount: mockSwapQuote.minimumBuyAmount,
      decimals: '18',
      recipient: '0zk_mock_railgun_address'
    }
  ],
  minGasLimit: '500000',
  stepOutputs: [{ name: 'mock-swap', description: 'Dry-run swap recipe for tests and demos' }]
};

export const mockBroadcasterFee: BroadcasterFeeResponse = {
  broadcasterAddress: '0zk_mock_broadcaster',
  feesID: 'mock-fees-id',
  feePerUnitGas: '1',
  tokenFee: {
    tokenAddress: mockSwapQuote.sellToken.address,
    amount: '1000'
  }
};

export const mockBroadcasterSend: BroadcasterSendResponse = {
  txHash: '0x0000000000000000000000000000000000000000000000000000000000000000'
};

