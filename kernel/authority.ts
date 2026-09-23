import type { Actor, AuthorityLevel, CanonChange } from './types.js';
import { AUTHORITY_LEVELS } from './types.js';

/**
 * The governing hierarchy: lower index = higher precedence.
 * Every mutation of canon is checked against this ordering.
 */
export function rank(level: AuthorityLevel): number {
  return AUTHORITY_LEVELS.indexOf(level);
}

export function outranksOrEquals(a: AuthorityLevel, b: AuthorityLevel): boolean {
  return rank(a) <= rank(b);
}

export class AuthorityError extends Error {
  override name = 'AuthorityError';
}

/**
 * Decides what an actor may do. Facts sealed at the `foundation` level are
 * constitutional: no actor, foundation included, may alter them afterward —
 * amendments happen by adding new facts, never by rewriting origin.
 */
export class Authority {
  /** keys sealed as foundation facts, per character: "facet:key" */
  private sealed = new Map<string, Set<string>>();

  seal(characterId: string, facet: string, key: string): void {
    let keys = this.sealed.get(characterId);
    if (!keys) {
      keys = new Set();
      this.sealed.set(characterId, keys);
    }
    keys.add(`${facet}:${key}`);
  }

  isSealed(characterId: string, facet: string, key: string): boolean {
    return this.sealed.get(characterId)?.has(`${facet}:${key}`) ?? false;
  }

  assertCanPropose(actor: Actor): void {
    // Every authority level may propose.
    void actor;
  }

  assertCanRatify(actor: Actor): void {
    if (!outranksOrEquals(actor.authority, 'steward')) {
      throw new AuthorityError(
        `actor "${actor.id}" (${actor.authority}) cannot ratify: steward authority required`,
      );
    }
  }

  assertChangesAllowed(characterId: string, changes: CanonChange[]): void {
    for (const change of changes) {
      if (this.isSealed(characterId, change.facet, change.key)) {
        throw new AuthorityError(
          `"${change.facet}:${change.key}" is a foundation fact and cannot be changed`,
        );
      }
    }
  }
}
