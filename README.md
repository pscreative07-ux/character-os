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

## Governing hierarchy

## Development

The kernel, API, SDK, and reference connector are written in TypeScript
with no runtime dependencies.

```sh
npm install
npm test    # builds and runs the suite (Node >= 18)
```

See [`docs/architecture/overview.md`](./docs/architecture/overview.md)
for how the layers fit together.

