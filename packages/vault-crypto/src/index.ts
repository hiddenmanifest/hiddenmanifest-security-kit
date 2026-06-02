import { generateMnemonic } from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english';

export type VaultEnvelope = {
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

export type VaultEncryptedBlob = {
  v: 1;
  iv: string;
  ct: string;
  tag: string;
};

const encoder = new TextEncoder();
const decoder = new TextDecoder();
const DEFAULT_KDF_ITERATIONS = 100_000;
const SALT_BYTES = 16;
const AES_GCM_IV_BYTES = 12;
const AES_GCM_TAG_BYTES = 16;

function getWebCrypto(): Crypto {
  const cryptoApi = globalThis.crypto;
  if (!cryptoApi?.subtle || typeof cryptoApi.getRandomValues !== 'function') {
    throw new Error('Web Crypto API is required');
  }
  return cryptoApi;
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

function hexToBytes(hex: string): Uint8Array {
  const clean = hex.startsWith('0x') ? hex.slice(2) : hex;
  if (clean.length % 2 !== 0 || !/^[a-fA-F0-9]*$/.test(clean)) {
    throw new Error('Expected an even-length hex string');
  }

  const bytes = new Uint8Array(clean.length / 2);
  for (let index = 0; index < bytes.length; index += 1) {
    bytes[index] = Number.parseInt(clean.slice(index * 2, index * 2 + 2), 16);
  }
  return bytes;
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

function base64ToBytes(value: string): Uint8Array {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function hasNumberRecord(value: unknown): value is Record<string, number> {
  return (
    isRecord(value) &&
    Object.values(value).every(
      (entry) => typeof entry === 'number' && Number.isInteger(entry) && entry >= 0
    )
  );
}

export function isHex(value: string): boolean {
  const clean = value.startsWith('0x') ? value.slice(2) : value;
  return clean.length > 0 && clean.length % 2 === 0 && /^[a-fA-F0-9]+$/.test(clean);
}

export function buildVaultUnlockMessage(address: string): string {
  return [
    'HiddenManifest Privacy Vault',
    '',
    `Wallet: ${address}`,
    'Purpose: Unlock or recover your local vault encryption key',
    '',
    'This signature is used only on this device.',
    'It is never sent to any server and does not authorize a transaction.'
  ].join('\n');
}

export async function deriveKey(
  secret: string,
  hexSalt: string,
  options: { iterations?: number; domain?: string } = {}
): Promise<string> {
  const cryptoApi = getWebCrypto();
  const keyMaterial = await cryptoApi.subtle.importKey(
    'raw',
    encoder.encode(secret),
    'PBKDF2',
    false,
    ['deriveBits']
  );

  const saltBytes = hexToBytes(hexSalt);
  let salt = saltBytes;
  if (options.domain) {
    const domainBytes = encoder.encode(`:${options.domain}`);
    salt = new Uint8Array(saltBytes.length + domainBytes.length);
    salt.set(saltBytes);
    salt.set(domainBytes, saltBytes.length);
  }

  const derivedBits = await cryptoApi.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: toArrayBuffer(salt),
      iterations: options.iterations ?? DEFAULT_KDF_ITERATIONS,
      hash: 'SHA-256'
    },
    keyMaterial,
    256
  );

  return bytesToHex(new Uint8Array(derivedBits));
}

export function deriveRailgunKey(signature: string, salt: string): Promise<string> {
  return deriveKey(signature, salt);
}

export function deriveEnvelopeKey(signature: string, salt: string): Promise<string> {
  return deriveKey(signature, salt, { domain: 'envelope' });
}

export async function encryptVaultEnvelope(plaintext: string, envelopeKey: string): Promise<string> {
  const cryptoApi = getWebCrypto();
  const keyBytes = hexToBytes(envelopeKey);
  const cryptoKey = await cryptoApi.subtle.importKey(
    'raw',
    toArrayBuffer(keyBytes),
    'AES-GCM',
    false,
    ['encrypt']
  );

  const iv = cryptoApi.getRandomValues(new Uint8Array(AES_GCM_IV_BYTES));
  const ciphertext = await cryptoApi.subtle.encrypt(
    { name: 'AES-GCM', iv: toArrayBuffer(iv) },
    cryptoKey,
    toArrayBuffer(encoder.encode(plaintext))
  );

  const ctWithTag = new Uint8Array(ciphertext);
  const ct = ctWithTag.slice(0, ctWithTag.length - AES_GCM_TAG_BYTES);
  const tag = ctWithTag.slice(ctWithTag.length - AES_GCM_TAG_BYTES);
  const blob: VaultEncryptedBlob = {
    v: 1,
    iv: bytesToHex(iv),
    ct: bytesToHex(ct),
    tag: bytesToHex(tag)
  };

  return bytesToBase64(encoder.encode(JSON.stringify(blob)));
}

export async function decryptVaultEnvelope(blob: string, envelopeKey: string): Promise<string> {
  const cryptoApi = getWebCrypto();
  const parsed = JSON.parse(decoder.decode(base64ToBytes(blob))) as VaultEncryptedBlob;

  if (parsed.v !== 1) {
    throw new Error(`Unsupported encryption blob version: ${parsed.v}`);
  }

  const keyBytes = hexToBytes(envelopeKey);
  const cryptoKey = await cryptoApi.subtle.importKey(
    'raw',
    toArrayBuffer(keyBytes),
    'AES-GCM',
    false,
    ['decrypt']
  );

  const ct = hexToBytes(parsed.ct);
  const tag = hexToBytes(parsed.tag);
  const ctWithTag = new Uint8Array(ct.length + tag.length);
  ctWithTag.set(ct);
  ctWithTag.set(tag, ct.length);

  const plaintext = await cryptoApi.subtle.decrypt(
    { name: 'AES-GCM', iv: toArrayBuffer(hexToBytes(parsed.iv)) },
    cryptoKey,
    toArrayBuffer(ctWithTag)
  );

  return decoder.decode(plaintext);
}

export function generateVaultMnemonic(): string {
  return generateMnemonic(wordlist, 128);
}

export function generateVaultSalt(): string {
  const bytes = getWebCrypto().getRandomValues(new Uint8Array(SALT_BYTES));
  return bytesToHex(bytes);
}

export function validateVaultEnvelope(value: unknown): value is VaultEnvelope {
  if (!isRecord(value)) return false;

  const kdf = value.kdf;
  const encryption = value.encryption;
  const creationBlockNumbers = value.creationBlockNumbers;
  const recoveryChainId = value.recoveryChainId;
  const iterations = isRecord(kdf) ? kdf.iterations : undefined;

  return (
    value.version === 2 &&
    typeof value.encryptedMnemonic === 'string' &&
    value.encryptedMnemonic.length > 0 &&
    typeof value.createdAt === 'string' &&
    !Number.isNaN(Date.parse(value.createdAt)) &&
    (recoveryChainId === undefined ||
      (typeof recoveryChainId === 'number' &&
        Number.isInteger(recoveryChainId) &&
        recoveryChainId > 0)) &&
    (creationBlockNumbers === undefined || hasNumberRecord(creationBlockNumbers)) &&
    isRecord(kdf) &&
    kdf.algorithm === 'PBKDF2-SHA256' &&
    typeof iterations === 'number' &&
    Number.isInteger(iterations) &&
    iterations > 0 &&
    typeof kdf.salt === 'string' &&
    isHex(kdf.salt) &&
    isRecord(encryption) &&
    encryption.algorithm === 'AES-GCM'
  );
}
