/**
 * Core domain types for the Character OS kernel.
 *
 * A character's identity is recorded as *canon*: a set of facts grouped
 * into three facets (visual, narrative, behavioral). Canon only changes
 * through proposals that are ratified by a sufficient authority, so the
 * ratified view is always an auditable, append-only history.
 */

export const FACET_KINDS = ['visual', 'narrative', 'behavioral'] as const;
export type FacetKind = (typeof FACET_KINDS)[number];

/** A single canonical fact, e.g. visual: "hair.color" = "auburn". */
export interface CanonFact {
  facet: FacetKind;
  key: string;
  value: string;
}

/** The ratified identity of a character at a point in time. */
export interface CanonSnapshot {
  characterId: string;
  name: string;
  revision: number;
  facets: Record<FacetKind, Record<string, string>>;
}

/**
 * Authority levels, from highest to lowest precedence.
 *
 * - `foundation`: the constitutional layer. Facts sealed at this level
 *   can never be altered or removed.
 * - `steward`: maintainers of a character. May ratify or reject proposals.
 * - `contributor`: anyone. May propose changes but not ratify them.
 */
export const AUTHORITY_LEVELS = ['foundation', 'steward', 'contributor'] as const;
export type AuthorityLevel = (typeof AUTHORITY_LEVELS)[number];

export interface Actor {
  id: string;
  authority: AuthorityLevel;
}

export type CanonChange =
  | { op: 'set'; facet: FacetKind; key: string; value: string }
  | { op: 'remove'; facet: FacetKind; key: string };

export type ProposalStatus = 'pending' | 'ratified' | 'rejected';

export interface Proposal {
  id: string;
  characterId: string;
  proposedBy: Actor;
  changes: CanonChange[];
  rationale: string;
  status: ProposalStatus;
  /** Set when the proposal is resolved. */
  resolvedBy?: Actor;
}

/** One applied, ratified set of changes — the unit of canon history. */
export interface CanonRevision {
  revision: number;
  proposalId: string | null;
  changes: CanonChange[];
  ratifiedBy: Actor;
}
