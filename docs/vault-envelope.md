# Vault Envelope

The vault recovery envelope is an encrypted app-assisted backup that lets the browser recover a local privacy vault if browser storage is cleared. Users can also explicitly export the vault recovery phrase for independent self-custody backup.

## Envelope Shape

```ts
type VaultEnvelope = {
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
```

## Key Derivation

The browser asks the connected wallet to sign a stable recovery message. That signature is used as the secret input to PBKDF2-SHA256.

Two keys are derived with domain separation:

- RAILGUN key: `PBKDF2(signature, salt)`
- Envelope key: `PBKDF2(signature, salt + ":envelope")`

This prevents accidental reuse of the same derived key across wallet runtime and recovery-envelope encryption.

## Encryption

The recovery mnemonic is encrypted with AES-256-GCM using a random 12-byte IV. The encrypted blob stores:

- version
- IV
- ciphertext
- authentication tag

AES-GCM authentication means decryption fails if the wrong key is used or if ciphertext is tampered with.

## Recovery Assumptions

Hidden Manifest has two recovery paths.

App-assisted recovery depends on:

- The same wallet signing the same stable recovery message.
- The stored envelope salt and KDF parameters.
- The encrypted envelope remaining available.
- The browser being able to initialize the RAILGUN runtime.

Self-custody recovery depends on the user explicitly exporting and safely storing the vault recovery phrase. That phrase should be handled like a private key: anyone with it may be able to recover and access the vault.

Changing the wallet message breaks app-assisted recovery for existing envelopes, so the message builder is snapshot-tested. The exported recovery phrase is a separate backup path from the encrypted envelope.

