import { describe, expect, it } from 'vitest';
import {
  loadBrowserGroth16Prover,
  MemoryRailgunStorage,
  validateRuntimeParams,
  type RailgunWorkerCommand,
  type RailgunWorkerEvent
} from '../src/index.js';

describe('@hiddenmanifest/railgun-browser', () => {
  it('validates runtime parameters', () => {
    expect(() =>
      validateRuntimeParams({
        walletSource: 'hiddenmanifest',
        artifactNamespace: 'artifacts',
        dbNamespace: 'db',
        poiNodeURLs: ['https://example.com']
      })
    ).not.toThrow();

    expect(() =>
      validateRuntimeParams({
        walletSource: '',
        artifactNamespace: 'artifacts',
        dbNamespace: 'db'
      })
    ).toThrow('walletSource is required');
  });

  it('provides a browser storage abstraction', async () => {
    const storage = new MemoryRailgunStorage();
    await storage.setItem('wallet', 'value');
    await expect(storage.getItem('wallet')).resolves.toBe('value');
    await storage.removeItem('wallet');
    await expect(storage.getItem('wallet')).resolves.toBeNull();
  });

  it('loads a supplied groth16 prover', async () => {
    const prover = await loadBrowserGroth16Prover(async () => ({
      groth16: {
        fullProve: async () => ({}),
        verify: async () => true
      }
    }));

    await expect(prover.verify()).resolves.toBe(true);
  });

  it('exports worker command and event shapes', () => {
    const command: RailgunWorkerCommand = {
      id: '1',
      type: 'refresh_balances',
      payload: {
        walletId: 'wallet',
        networkName: 'Polygon'
      }
    };
    const event: RailgunWorkerEvent = {
      id: '1',
      ok: true,
      type: 'result',
      command: 'refresh_balances',
      data: { refreshed: true }
    };

    expect(command.type).toBe('refresh_balances');
    expect(event.data.refreshed).toBe(true);
  });
});

