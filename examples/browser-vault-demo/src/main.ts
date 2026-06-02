import {
  buildVaultUnlockMessage,
  decryptVaultEnvelope,
  deriveEnvelopeKey,
  deriveRailgunKey,
  encryptVaultEnvelope,
  generateVaultMnemonic,
  generateVaultSalt,
  validateVaultEnvelope
} from '@hiddenmanifest/vault-crypto';
import { mockSwapQuote, serializeBigInts } from '@hiddenmanifest/api-contracts';
import './styles.css';

const output = document.querySelector<HTMLPreElement>('#output');
const button = document.querySelector<HTMLButtonElement>('#run-demo');

function write(value: unknown): void {
  if (!output) return;
  output.textContent = JSON.stringify(value, null, 2);
}

async function runDemo(): Promise<void> {
  const address = '0x0000000000000000000000000000000000000001';
  const mockSignature = `mock-signature:${address}`;
  const salt = generateVaultSalt();
  const mnemonic = generateVaultMnemonic();
  const railgunKey = await deriveRailgunKey(mockSignature, salt);
  const envelopeKey = await deriveEnvelopeKey(mockSignature, salt);
  const encryptedMnemonic = await encryptVaultEnvelope(mnemonic, envelopeKey);
  const decryptedMnemonic = await decryptVaultEnvelope(encryptedMnemonic, envelopeKey);

  const envelope = {
    version: 2,
    recoveryChainId: 137,
    encryptedMnemonic,
    creationBlockNumbers: { Polygon: 123456 },
    kdf: {
      algorithm: 'PBKDF2-SHA256',
      iterations: 100_000,
      salt
    },
    encryption: {
      algorithm: 'AES-GCM'
    },
    createdAt: new Date().toISOString()
  } as const;

  write({
    unlockMessage: buildVaultUnlockMessage(address),
    railgunKeyPreview: `${railgunKey.slice(0, 12)}...`,
    envelopeKeyPreview: `${envelopeKey.slice(0, 12)}...`,
    envelopeIsValid: validateVaultEnvelope(envelope),
    decryptedMnemonicMatches: decryptedMnemonic === mnemonic,
    serializedQuote: serializeBigInts({
      ...mockSwapQuote,
      auditAmount: 123456789123456789n
    })
  });
}

button?.addEventListener('click', () => {
  write('Running...');
  void runDemo().catch((error: unknown) => {
    write({
      error: error instanceof Error ? error.message : String(error)
    });
  });
});

