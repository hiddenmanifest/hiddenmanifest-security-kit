# RAILGUN Browser Flow

`@hiddenmanifest/railgun-browser` defines the public browser boundary for RAILGUN operations.

## Runtime Setup

The browser initializes a worker with:

- wallet source
- artifact namespace
- database namespace
- optional debug flag
- optional POI node URLs

The worker is expected to own spend-capable wallet operations and proof generation.

## Vault Operations

The public worker command types support:

- create wallet
- load wallet
- clear wallet
- get shareable viewing key
- refresh balances
- read one balance
- read all cached balances

## Transaction Operations

The public worker command types support:

- populate shield transaction
- generate unshield transaction
- generate private transfer transaction
- generate private swap transaction from already-built public recipe calls

Production recipe construction, 0x integration, broadcaster endpoint implementation, and hosted service adapters are deliberately outside this package.

