# Character OS

Character OS is a system for preserving character identity across
generative processes — visual, narrative, and behavioral.

It exists to answer one question:

> How does a character remain the same character, generation after generation?

## Status

The foundation of this project has been **ratified**.
See [`FOUNDATION_MANIFEST.md`](./FOUNDATION_MANIFEST.md) for the
constitutional definition of the system.

## Structure

| Folder | Purpose |
|---|---|
| `/docs/architecture` | System architecture documents |
| `/docs/adr` | Architecture Decision Records |
| `/kernel` | Core identity engine (Authority, Canon, Fingerprints) |
| `/api` | Public interface layer |
| `/sdk` | Client libraries / integration tools |
| `/generation-connectors` | Adapters to generative backends (e.g. image/video models) |

### Generation connectors

| Connector | Purpose |
|---|---|
| [`/generation-connectors/local-studio`](./generation-connectors/local-studio) | Self-hosted image/video generation (SDXL, AnimateDiff, Stable Video Diffusion) running entirely on local hardware |

## Governing hierarchy

