# Security Model

Hidden Manifest is designed around a client-side vault boundary.

## What Stays In The Browser

- Wallet signatures used to derive vault encryption keys.
- The active vault encryption key for the current browser session.
- Spend-capable RAILGUN wallet operations.
- ZK proof generation and populated private transaction payloads.
- Plaintext vault mnemonic material after local decryption.

## What Can Reach Hosted Services

- Public wallet address.
- Encrypted vault recovery envelope.
- Challenge nonce and signature for envelope create/delete authorization.
- Public swap quote or recipe inputs.
- Optional view-only balance sync data where the user registers a shareable viewing key.
- Already-populated broadcaster payloads when using broadcaster relay.

## What Hidden Manifest Cannot Decrypt Alone

The hosted service can store an encrypted recovery envelope, but it should not be able to decrypt it without the wallet-derived envelope key. That key is derived in the browser from a wallet signature and is not sent to the server.

## Third-Party Boundaries

Hidden Manifest interacts with wallets, RPC providers, RAILGUN infrastructure, relayers, DEX aggregators, and public blockchains. These systems have independent availability, privacy, and security properties.

This repository exposes the client-side and contract-shape code needed to review the vault boundary. It does not expose production infrastructure, routing strategy, or hosted service implementations.

