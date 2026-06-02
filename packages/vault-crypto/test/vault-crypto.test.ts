import { describe, expect, it } from 'vitest';
import {
  buildVaultUnlockMessage,
  decryptVaultEnvelope,
  deriveEnvelopeKey,
  deriveKey,
  deriveRailgunKey,
  encryptVaultEnvelope,
  generateVaultMnemonic,
  generateVaultSalt,
  validateVaultEnvelope,
  type VaultEnvelope
} from '../src/index.js';

const signature = '0xmock-signature-for-audit-tests';
const salt = '00112233445566778899aabbccddeeff';

describe('@hiddenmanifest/vault-crypto', () => {
  it('derives stable PBKDF2 keys for fixed vectors', async () => {
    await expect(deriveKey(signature, salt, { iterations: 1 })).resolves.toMatchInlineSnapshot(
      '"e6b379d2d6504a3907a43687d7f4ae81f9c74ca144a7bf45aaf4469d58d5bc75"'
    );
  });

  it('separates RAILGUN and recovery envelope keys by domain', async () => {
    const railgunKey = await deriveRailgunKey(signature, salt);
    const envelopeKey = await deriveEnvelopeKey(signature, salt);

    expect(railgunKey).toHaveLength(64);
    expect(envelopeKey).toHaveLength(64);
    expect(railgunKey).not.toBe(envelopeKey);
  });

  it('encrypts and decrypts envelope plaintext', async () => {
    const key = await deriveEnvelopeKey(signature, salt);
    const encrypted = await encryptVaultEnvelope('test mnemonic', key);

    await expect(decryptVaultEnvelope(encrypted, key)).resolves.toBe('test mnemonic');
  });

  it('fails to decrypt with the wrong key', async () => {
    const key = await deriveEnvelopeKey(signature, salt);
    const wrongKey = await deriveEnvelopeKey('0xwrong-signature', salt);
    const encrypted = await encryptVaultEnvelope('test mnemonic', key);

    await expect(decryptVaultEnvelope(encrypted, wrongKey)).rejects.toThrow();
  });

  it('fails to decrypt tampered ciphertext', async () => {
    const key = await deriveEnvelopeKey(signature, salt);
    const encrypted = await encryptVaultEnvelope('test mnemonic', key);
    const tampered = encrypted.slice(0, -2) + 'AA';

    await expect(decryptVaultEnvelope(tampered, key)).rejects.toThrow();
  });

  it('validates v2 vault envelopes', () => {
    const envelope: VaultEnvelope = {
      version: 2,
      recoveryChainId: 137,
      encryptedMnemonic: 'encrypted',
      creationBlockNumbers: { Polygon: 123 },
      kdf: {
        algorithm: 'PBKDF2-SHA256',
        iterations: 100_000,
        salt
      },
      encryption: {
        algorithm: 'AES-GCM'
      },
      createdAt: '2026-06-02T00:00:00.000Z'
    };

    expect(validateVaultEnvelope(envelope)).toBe(true);
    expect(validateVaultEnvelope({ ...envelope, version: 1 })).toBe(false);
    expect(validateVaultEnvelope({ ...envelope, kdf: { ...envelope.kdf, salt: 'not-hex' } })).toBe(
      false
    );
  });

  it('builds a stable wallet unlock message', () => {
    expect(buildVaultUnlockMessage('0x1234567890123456789012345678901234567890'))
      .toMatchInlineSnapshot(`
        "HiddenManifest Privacy Vault

        Wallet: 0x1234567890123456789012345678901234567890
        Purpose: Unlock or recover your local vault encryption key

        This signature is used only on this device.
        It is never sent to any server and does not authorize a transaction."
      `);
  });

  it('generates mnemonic and salt values', () => {
    expect(generateVaultMnemonic().split(' ')).toHaveLength(12);
    expect(generateVaultSalt()).toMatch(/^[a-f0-9]{32}$/);
  });
});
