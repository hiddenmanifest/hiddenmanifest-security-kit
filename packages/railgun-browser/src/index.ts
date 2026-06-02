export type WorkerErrorPayload = {
  code: string;
  message: string;
  stack?: string;
  phase?: string;
  cause?: unknown;
};

export type SerializedTransaction = {
  to: string;
  data: string;
  value?: string;
  gasLimit?: string;
  chainId?: string;
};

export type BrowserRailgunRuntimeParams = {
  walletSource: string;
  artifactNamespace: string;
  dbNamespace: string;
  debug?: boolean;
  poiNodeURLs?: string[];
};

export type BrowserRailgunStorage = {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
};

export type CreateWalletPayload = {
  encryptionKey: string;
  mnemonic: string;
  creationBlockNumbers?: Record<string, number>;
};

export type LoadWalletPayload = {
  encryptionKey: string;
  walletId: string;
};

export type WalletIdPayload = {
  walletId: string;
};

export type RefreshBalancesPayload = {
  walletId: string;
  networkName: string;
};

export type GetBalancePayload = {
  walletId: string;
  networkName: string;
  tokenAddress: string;
};

export type GetBalancesPayload = {
  walletId: string;
  networkName: string;
  skipRefresh?: boolean;
};

export type GenerateUnshieldPayload = {
  walletId: string;
  encryptionKey: string;
  networkName: string;
  tokenAddress: string;
  toAddress: string;
  amount: string;
};

export type GenerateTransferPayload = {
  walletId: string;
  encryptionKey: string;
  networkName: string;
  tokenAddress: string;
  recipientAddress: string;
  amount: string;
};

export type PopulateShieldPayload = {
  networkName: string;
  shieldPrivateKey: string;
  railgunAddress: string;
  tokens: Array<{ address: string; amount: string }>;
};

export type GeneratePrivateSwapPayload = {
  walletId: string;
  encryptionKey: string;
  networkName: string;
  sellTokenAddress: string;
  sellAmount: string;
  crossContractCalls: Array<{ to: string; data: string; value: string }>;
  erc20AmountRecipients: Array<{ tokenAddress: string; recipient: string; amount?: string }>;
  minGasLimit: string;
  broadcasterTokenAddress?: string;
  useBroadcaster?: boolean;
  broadcasterSelection?: {
    broadcasterAddress: string;
    feesID: string;
    feePerUnitGas: string;
  };
};

export type LocalWalletSnapshot = {
  walletId: string;
  railgunAddress: string;
  shareableViewingKey?: string;
};

export type BrowserRailgunPreflight = {
  environment: 'browser-worker';
  ready: boolean;
  mode: 'preflight';
  walletModuleLoaded: boolean;
  proverLoaded: boolean;
  storage: {
    dbNamespace: string;
    artifactNamespace: string;
    hasIndexedDb: boolean;
  };
};

export type PrivateBalanceResult = {
  balance: string;
  spendableBalance: string;
  pendingBalance: string;
  hasBalance: boolean;
  hasSpendableBalance: boolean;
  hasPendingBalance: boolean;
};

export type PrivateBalancesResult = {
  tokens: Array<
    PrivateBalanceResult & {
      tokenAddress: string;
    }
  >;
};

export type RailgunWorkerResultMap = {
  init: BrowserRailgunPreflight;
  create_wallet: LocalWalletSnapshot;
  load_wallet: LocalWalletSnapshot;
  get_viewing_key: { shareableViewingKey: string };
  refresh_balances: { refreshed: true };
  get_balance: PrivateBalanceResult;
  get_balances: PrivateBalancesResult;
  generate_unshield: { transaction: SerializedTransaction };
  generate_transfer: { transaction: SerializedTransaction };
  populate_shield: { transaction: SerializedTransaction };
  generate_private_swap: {
    transaction: SerializedTransaction;
    broadcasterInfo?: {
      broadcasterAddress: string;
      feesID: string;
      nullifiers: string[];
      overallBatchMinGasPrice: string;
    };
  };
  clear_wallet: { cleared: true };
};

export type RailgunWorkerCommand =
  | { id: string; type: 'init'; payload: BrowserRailgunRuntimeParams }
  | { id: string; type: 'create_wallet'; payload: CreateWalletPayload }
  | { id: string; type: 'load_wallet'; payload: LoadWalletPayload }
  | { id: string; type: 'get_viewing_key'; payload: WalletIdPayload }
  | { id: string; type: 'refresh_balances'; payload: RefreshBalancesPayload }
  | { id: string; type: 'get_balance'; payload: GetBalancePayload }
  | { id: string; type: 'get_balances'; payload: GetBalancesPayload }
  | { id: string; type: 'generate_unshield'; payload: GenerateUnshieldPayload }
  | { id: string; type: 'generate_transfer'; payload: GenerateTransferPayload }
  | { id: string; type: 'populate_shield'; payload: PopulateShieldPayload }
  | { id: string; type: 'generate_private_swap'; payload: GeneratePrivateSwapPayload }
  | { id: string; type: 'clear_wallet'; payload: Partial<WalletIdPayload> };

export type RailgunWorkerCommandType = RailgunWorkerCommand['type'];

export type RailgunWorkerResultEvent<T extends keyof RailgunWorkerResultMap> = {
  id: string;
  ok: true;
  type: 'result';
  command: T;
  data: RailgunWorkerResultMap[T];
};

export type RailgunWorkerEvent =
  | RailgunWorkerResultEvent<keyof RailgunWorkerResultMap>
  | {
      id: string;
      ok: false;
      type: 'error';
      command?: RailgunWorkerCommandType;
      error: WorkerErrorPayload;
    }
  | {
      id: string;
      type: 'progress';
      phase: string;
      detail?: string;
      percent?: number;
    }
  | {
      id: string;
      type: 'log';
      level: 'debug' | 'info' | 'warn' | 'error';
      message: string;
    };

type PendingCommand<T extends keyof RailgunWorkerResultMap> = {
  command: T;
  resolve: (value: RailgunWorkerResultMap[T]) => void;
  reject: (error: Error) => void;
  timeoutId: ReturnType<typeof setTimeout>;
};

type SnarkJSGroth16 = {
  fullProve: (...args: unknown[]) => Promise<unknown>;
  verify: (...args: unknown[]) => Promise<boolean>;
};

export function validateRuntimeParams(params: BrowserRailgunRuntimeParams): void {
  if (!params.walletSource.trim()) {
    throw new Error('walletSource is required');
  }
  if (!params.artifactNamespace.trim()) {
    throw new Error('artifactNamespace is required');
  }
  if (!params.dbNamespace.trim()) {
    throw new Error('dbNamespace is required');
  }
  if (
    params.poiNodeURLs &&
    !params.poiNodeURLs.every((url) => {
      try {
        const parsed = new URL(url);
        return parsed.protocol === 'https:' || parsed.protocol === 'http:';
      } catch {
        return false;
      }
    })
  ) {
    throw new Error('poiNodeURLs must be valid HTTP(S) URLs');
  }
}

export class MemoryRailgunStorage implements BrowserRailgunStorage {
  readonly #items = new Map<string, string>();

  async getItem(key: string): Promise<string | null> {
    return this.#items.get(key) ?? null;
  }

  async setItem(key: string, value: string): Promise<void> {
    this.#items.set(key, value);
  }

  async removeItem(key: string): Promise<void> {
    this.#items.delete(key);
  }
}

export class LocalStorageRailgunStorage implements BrowserRailgunStorage {
  constructor(private readonly prefix = 'hiddenmanifest:railgun:') {}

  async getItem(key: string): Promise<string | null> {
    return globalThis.localStorage?.getItem(this.prefix + key) ?? null;
  }

  async setItem(key: string, value: string): Promise<void> {
    if (!globalThis.localStorage) throw new Error('localStorage is unavailable');
    globalThis.localStorage.setItem(this.prefix + key, value);
  }

  async removeItem(key: string): Promise<void> {
    globalThis.localStorage?.removeItem(this.prefix + key);
  }
}

export async function loadBrowserGroth16Prover(
  importer?: () => Promise<unknown>
): Promise<SnarkJSGroth16> {
  const load =
    importer ??
    (() => {
      const dynamicImport = new Function('specifier', 'return import(specifier)') as (
        specifier: string
      ) => Promise<unknown>;
      return dynamicImport('snarkjs');
    });

  const snarkjs = (await load()) as { groth16?: SnarkJSGroth16 };
  const groth16 = snarkjs.groth16;
  if (!groth16 || typeof groth16.fullProve !== 'function' || typeof groth16.verify !== 'function') {
    throw new Error('snarkjs groth16 prover is unavailable in this runtime');
  }
  return groth16;
}

export class BrowserRailgunWorkerClient {
  readonly #worker: Worker;
  readonly #timeoutMs: number;
  readonly #pending = new Map<string, PendingCommand<keyof RailgunWorkerResultMap>>();
  #sequence = 0;

  constructor(worker: Worker, options: { timeoutMs?: number } = {}) {
    this.#worker = worker;
    this.#timeoutMs = options.timeoutMs ?? 120_000;
    this.#worker.addEventListener('message', (event: MessageEvent<RailgunWorkerEvent>) => {
      this.handleEvent(event.data);
    });
  }

  async init(payload: BrowserRailgunRuntimeParams): Promise<BrowserRailgunPreflight> {
    validateRuntimeParams(payload);
    return this.send('init', payload);
  }

  createWallet(payload: CreateWalletPayload): Promise<LocalWalletSnapshot> {
    return this.send('create_wallet', payload);
  }

  loadWallet(payload: LoadWalletPayload): Promise<LocalWalletSnapshot> {
    return this.send('load_wallet', payload);
  }

  getViewingKey(payload: WalletIdPayload): Promise<{ shareableViewingKey: string }> {
    return this.send('get_viewing_key', payload);
  }

  refreshBalances(payload: RefreshBalancesPayload): Promise<{ refreshed: true }> {
    return this.send('refresh_balances', payload);
  }

  getBalance(payload: GetBalancePayload): Promise<PrivateBalanceResult> {
    return this.send('get_balance', payload);
  }

  getBalances(payload: GetBalancesPayload): Promise<PrivateBalancesResult> {
    return this.send('get_balances', payload);
  }

  generateUnshield(payload: GenerateUnshieldPayload): Promise<{ transaction: SerializedTransaction }> {
    return this.send('generate_unshield', payload);
  }

  generateTransfer(payload: GenerateTransferPayload): Promise<{ transaction: SerializedTransaction }> {
    return this.send('generate_transfer', payload);
  }

  populateShield(payload: PopulateShieldPayload): Promise<{ transaction: SerializedTransaction }> {
    return this.send('populate_shield', payload);
  }

  generatePrivateSwap(
    payload: GeneratePrivateSwapPayload
  ): Promise<RailgunWorkerResultMap['generate_private_swap']> {
    return this.send('generate_private_swap', payload);
  }

  clearWallet(payload: Partial<WalletIdPayload> = {}): Promise<{ cleared: true }> {
    return this.send('clear_wallet', payload);
  }

  private send<T extends keyof RailgunWorkerResultMap>(
    type: T,
    payload: Extract<RailgunWorkerCommand, { type: T }>['payload']
  ): Promise<RailgunWorkerResultMap[T]> {
    const id = `${type}:${(this.#sequence += 1)}`;
    const command = { id, type, payload } as RailgunWorkerCommand;

    return new Promise<RailgunWorkerResultMap[T]>((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        this.#pending.delete(id);
        reject(new Error(`RAILGUN worker command timed out: ${type}`));
      }, this.#timeoutMs);

      this.#pending.set(id, {
        command: type,
        resolve: resolve as (value: RailgunWorkerResultMap[keyof RailgunWorkerResultMap]) => void,
        reject,
        timeoutId
      });
      this.#worker.postMessage(command);
    });
  }

  private handleEvent(event: RailgunWorkerEvent): void {
    if (event.type !== 'result' && event.type !== 'error') return;

    const pending = this.#pending.get(event.id);
    if (!pending) return;

    clearTimeout(pending.timeoutId);
    this.#pending.delete(event.id);

    if (event.type === 'error') {
      pending.reject(new Error(event.error.message));
      return;
    }

    if (event.command !== pending.command) {
      pending.reject(
        new Error(`Unexpected RAILGUN worker result: expected ${pending.command}, got ${event.command}`)
      );
      return;
    }

    pending.resolve(event.data);
  }
}

