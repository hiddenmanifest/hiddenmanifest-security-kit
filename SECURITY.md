# Security Policy

Hidden Manifest welcomes security review of this public audit repository.

## Review Scope

The most useful review areas are:

- Wallet-derived vault key derivation.
- Recovery envelope encryption and validation.
- Wallet signature message stability.
- Browser-side RAILGUN operation boundaries.
- Transaction intent and allowance safety helpers.
- Public API contract shapes.

Out of scope for this repository:

- Hosted backend implementation.
- Production routing and service operations.
- Market-data workers.
- Deployment infrastructure.
- Private API keys, provider accounts, or operational controls.

## Reporting Issues

For non-sensitive findings, open a GitHub issue with:

- affected package or document
- expected behavior
- observed behavior
- reproduction steps or proof sketch
- suggested fix, if known

For sensitive findings, contact the project privately first. Do not publish exploit details, private keys, user data, or active attack paths in a public issue.

## Good Review Targets

Start with:

- `packages/vault-crypto`
- `packages/transaction-safety`
- `docs/security-claims.md`
- `docs/vault-envelope.md`

The goal is to verify whether the stated trust claims are actually supported by the code.
