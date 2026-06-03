# Security Claims

This document states the claims this repository is meant to make reviewable.

## Claim 1: Vault keys are derived in the browser

The vault unlock flow derives keys from a wallet signature in the browser. The recovery signature is not meant to authorize a transaction and is not required by the hosted service to be useful on its own.

Review focus:

- stable unlock message construction
- PBKDF2 parameters
- domain separation between RAILGUN and envelope keys
- tests that fail if the message or vectors change unexpectedly

## Claim 2: Recovery envelopes are encrypted before storage

The recovery envelope contains encrypted vault material. The hosted service can store and return the envelope, but should not be able to decrypt it without the wallet-derived envelope key.

Review focus:

- AES-GCM encryption
- random IV generation
- wrong-key failure behavior
- tamper failure behavior
- envelope validator strictness

## Claim 3: Spend-capable operations stay behind a browser boundary

Spend-capable RAILGUN operations are modeled as browser worker commands and result types. Hosted services can support public quote, recipe, or relay flows, but the spend-capable vault boundary is browser-side.

Review focus:

- worker command surface
- serialized transaction outputs
- absence of hosted secret material in public interfaces
- clear separation from production adapters

## Claim 4: Transaction intent should be reviewable before signing

Transaction safety helpers make token, amount, address, allowance, chain, and transaction intent handling easier to inspect.

Review focus:

- native token handling
- ERC20 allowance decision logic
- decimal parsing without floating point loss
- transaction intent validation

## Claim 5: API contracts do not expose private service internals

The API contracts package publishes browser-facing request and response shapes without production server handlers or operational configuration.

Review focus:

- bigint serialization
- vault challenge and envelope shapes
- swap quote and recipe shapes
- broadcaster contract shapes without hosted implementation details
