# Free Tiers Reference

This is a reference for anyone building or evaluating a
[`/generation-connectors`](../../README.md) adapter: what the free tier of a
given generative backend actually offers, so connector work — and the tests
that exercise it — can happen at zero cost before any paid key is involved.

It is **not** a canon source and it is **not** authoritative pricing. Free
tiers change without notice; treat every row as "true as of last check," not
as a guarantee, and confirm current terms on the provider's own pricing page
before depending on one in CI or in a shipped connector.

## Why this exists

Character OS connectors only render canon into requests — they never invent
identity facts (see the `GenerationConnector` contract in
`/generation-connectors`). That means connector correctness can, in
principle, be verified against *any* backend that accepts a prompt and
returns an asset. Preferring a free tier for development keeps the
propose → ratify → fingerprint → verify loop cheap to exercise while a
connector is still unstable.

## Zero-tier baseline: self-hosted

The `local-studio` connector (`/generation-connectors/local-studio`) runs
image and video generation entirely on local hardware via
[diffusers](https://github.com/huggingface/diffusers) — no account, no quota,
no request limit, no hosted content-policy layer. It's the only option in
this repo with no "tier" to track at all; the cost is local GPU time (8GB+
VRAM) instead of a metered API. Prefer it for connector development where a
GPU is available, and use the hosted free tiers below where it isn't.

## Hosted free tiers

Notes column flags the constraints that actually bite during connector
development (auth requirements, non-commercial-only clauses, watermarking,
rate limits tight enough to break a test suite).

### Image generation

| Provider | Free tier (typical) | Notes |
|---|---|---|
| Stability AI (Stable Diffusion API) | Limited monthly credits on signup | Credits, not a recurring free quota — exhausted credits require a paid plan |
| Hugging Face Inference API | Rate-limited free inference on hosted models | Shared queue; cold-start latency varies, not suitable for tight test loops |
| Google Gemini (image generation) | Free quota under Gemini API free tier | Subject to region availability and usage-based rate limits |
| Craiyon | Unlimited, ad-supported | Low resolution, not representative of production output — dev/sanity checks only |

### Video generation

| Provider | Free tier (typical) | Notes |
|---|---|---|
| Runway | Limited one-time credits on signup | Credits cover only a handful of generations; watermarked output on free tier |
| Pika Labs | Limited daily/monthly generations | Discord-bot-first workflow historically; API access terms vary |
| Kling AI | Daily free credits | Region-gated signup in some cases |

### LLM / text (for prompt-construction or canon-adjacent tooling)

| Provider | Free tier (typical) | Notes |
|---|---|---|
| Google Gemini API | Free tier with daily request caps | Caps are per-model; check current limits per model family |
| Groq | Free API access, rate-limited | Fast inference, generous for dev use; limits are per-minute token/request based |
| OpenRouter | Free-tagged models (`:free` suffix) | Aggregates multiple providers' free-tier models behind one API; availability of any given free model is not guaranteed long-term |

## Using this reference for connector tests

- CI should never depend on a hosted free tier being available — treat free
  tiers as a manual/local development convenience, not a test dependency.
  Prefer fixtures, recorded responses, or a mock connector for anything that
  runs in CI (see the CI workflow added alongside the kernel/API/SDK layers).
- If a connector's README documents which tier it was developed against,
  keep that note next to the connector rather than only here — this file is
  the cross-provider index, not the source of truth for any one connector's
  setup instructions.

## Maintenance

Free tier terms are volatile. When you notice a row above is stale (a
provider removed its free tier, changed its quota, or added a requirement
like a verified phone number or a waitlist), update the row in the same PR
that depends on the change — don't let this file silently drift from what
connectors actually rely on.
