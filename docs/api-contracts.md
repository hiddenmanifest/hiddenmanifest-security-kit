# API Contracts

`@hiddenmanifest/api-contracts` publishes request and response shapes without production handlers.

The package includes contracts for:

- Vault challenge issue/verify flows.
- Vault envelope read/create/delete flows.
- Swap quote requests and responses.
- Swap recipe requests and responses.
- Broadcaster fee and send requests.
- BigInt serialization helpers.

Production server behavior, persistence, rate limits, routing, fee strategy, and broadcaster selection remain private.

