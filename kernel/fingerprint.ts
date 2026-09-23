import { createHash } from 'node:crypto';
import type { CanonSnapshot, FacetKind } from './types.js';
import { FACET_KINDS } from './types.js';

/**
 * A character fingerprint: deterministic hashes derived from ratified
 * canon. Two snapshots with the same facts produce the same fingerprint
 * regardless of insertion order, so a fingerprint embedded in a generated
 * asset can later prove which identity state produced it.
 */
export interface Fingerprint {
  characterId: string;
  revision: number;
  facets: Record<FacetKind, string>;
  /** Hash over the facet hashes — the character's overall identity. */
  composite: string;
}

export interface DriftReport {
  identical: boolean;
  /** Facets whose hashes differ between the two fingerprints. */
  driftedFacets: FacetKind[];
}

function sha256(input: string): string {
  return createHash('sha256').update(input, 'utf8').digest('hex');
}

/** Stable serialization: keys sorted, no whitespace ambiguity. */
function canonicalize(facts: Record<string, string>): string {
  return JSON.stringify(
    Object.keys(facts)
      .sort()
      .map((k) => [k, facts[k]]),
  );
}

export function fingerprintSnapshot(snapshot: CanonSnapshot): Fingerprint {
  const facets = {} as Record<FacetKind, string>;
  for (const kind of FACET_KINDS) {
    facets[kind] = sha256(`${kind}\n${canonicalize(snapshot.facets[kind])}`);
  }
  const composite = sha256(FACET_KINDS.map((kind) => `${kind}:${facets[kind]}`).join('\n'));
  return { characterId: snapshot.characterId, revision: snapshot.revision, facets, composite };
}

/**
 * Compares two fingerprints of the same character and reports which
 * facets of identity have drifted.
 */
export function detectDrift(a: Fingerprint, b: Fingerprint): DriftReport {
  const driftedFacets = FACET_KINDS.filter((kind) => a.facets[kind] !== b.facets[kind]);
  return { identical: a.composite === b.composite, driftedFacets };
}
