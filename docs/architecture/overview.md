# Architecture overview

Character OS preserves character identity across generative processes.
The codebase follows the layering ratified in the Foundation Manifest:
everything flows downward from canon, and nothing outside the kernel may
mutate it.

```
generation-connectors ──▶ api ──▶ kernel
          sdk         ──▶ api ──▶ kernel
```

## Kernel (`/kernel`)

The identity engine. It has no dependencies outside the Node standard
library.

- **Canon** (`canon.ts`) — the single authoritative record of a
  character. Identity facts are grouped into three facets: `visual`,
  `narrative`, and `behavioral`. Canon is append-only: every change is a
  revision in the character's history, and revisions only come from
  ratified proposals.
- **Authority** (`authority.ts`) — the governing hierarchy
  (`foundation` > `steward` > `contributor`). Anyone may propose a
  change; only stewards may ratify or reject. Facts sealed at the
  foundation level — a character's seed facts — can never be altered.
- **Fingerprints** (`fingerprint.ts`) — deterministic SHA-256 hashes of
  ratified canon, one per facet plus a composite. Two snapshots with the
  same facts produce the same fingerprint regardless of insertion order.
  Comparing fingerprints yields a drift report naming exactly which
  facets of identity changed.

## API (`/api`)

`CharacterOS` is the public facade. It is the only supported entry point
for code outside the kernel: create characters, file and resolve
proposals, read canon and history, mint fingerprints, and verify a
claimed fingerprint against current canon.

## SDK (`/sdk`)

`CharacterOSClient` binds an actor identity once and exposes the
workflow operations integrators need. It currently runs in-process
against the API facade; a remote transport can slot in behind the same
surface later.

## Generation connectors (`/generation-connectors`)

Adapters that turn ratified canon into backend-specific generation
requests. The contract (`GenerationConnector`) forbids connectors from
inventing identity facts: canon is the only source. Every request
carries the fingerprint of the canon state it was built from, so any
generated asset can later be verified for drift. `PromptConnector` is
the reference implementation: it renders canon into a deterministic text
prompt for prompt-driven backends.

## The consistency loop

1. Ratified canon is snapshotted and fingerprinted.
2. A connector builds a generation request from that snapshot; the
   fingerprint travels with it and is stamped onto the generated asset.
3. Later, the asset's fingerprint is verified against current canon.
   `identical: true` means the asset still matches who the character is;
   otherwise the drift report names the facets that moved.
