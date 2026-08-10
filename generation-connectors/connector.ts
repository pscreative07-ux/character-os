import type { CanonSnapshot, Fingerprint } from '../kernel/index.js';

/**
 * A generation request handed to a backend (image model, video model,
 * narrative engine, …). The fingerprint travels with the request so every
 * generated asset can be traced back to the exact identity state that
 * produced it.
 */
export interface GenerationRequest {
  characterId: string;
  fingerprint: Fingerprint;
  /** Backend-specific payload, e.g. a prompt string. */
  payload: string;
}

/** Metadata a backend attaches to each generated asset. */
export interface GeneratedAsset {
  characterId: string;
  /** Fingerprint of the canon state the asset was generated from. */
  fingerprint: Fingerprint;
  /** Backend-specific reference to the asset (URL, file path, id, …). */
  assetRef: string;
}

/**
 * Adapter contract for generative backends. A connector turns ratified
 * canon into a backend request; it never invents identity facts of its
 * own — canon is the only source.
 */
export interface GenerationConnector {
  /** Human-readable backend name, e.g. "prompt", "sdxl", "veo". */
  readonly backend: string;
  buildRequest(snapshot: CanonSnapshot, fingerprint: Fingerprint): GenerationRequest;
}
