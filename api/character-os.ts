import {
  Authority,
  CanonStore,
  detectDrift,
  fingerprintSnapshot,
  type Actor,
  type CanonChange,
  type CanonFact,
  type CanonRevision,
  type CanonSnapshot,
  type DriftReport,
  type Fingerprint,
  type Proposal,
} from '../kernel/index.js';

/**
 * The public interface of Character OS. Everything outside the kernel —
 * SDKs, services, generation connectors — talks to this facade rather
 * than to kernel internals.
 */
export class CharacterOS {
  private readonly authority = new Authority();
  private readonly canon = new CanonStore(this.authority);

  /**
   * Registers a character. The seed facts become the character's
   * foundation: they are sealed and can never be changed afterward.
   */
  createCharacter(name: string, seedFacts: CanonFact[], creator: Actor): CanonSnapshot {
    return this.canon.createCharacter(name, seedFacts, creator);
  }

  /** Files a change proposal. Any authority level may propose. */
  propose(
    characterId: string,
    changes: CanonChange[],
    rationale: string,
    proposedBy: Actor,
  ): Proposal {
    return this.canon.propose(characterId, changes, rationale, proposedBy);
  }

  /** Applies a pending proposal to canon. Requires steward authority. */
  ratify(proposalId: string, ratifier: Actor): CanonSnapshot {
    return this.canon.ratify(proposalId, ratifier);
  }

  /** Rejects a pending proposal. Requires steward authority. */
  reject(proposalId: string, rejecter: Actor): Proposal {
    return this.canon.reject(proposalId, rejecter);
  }

  getProposal(proposalId: string): Proposal {
    return this.canon.getProposal(proposalId);
  }

  getCanon(characterId: string): CanonSnapshot {
    return this.canon.snapshot(characterId);
  }

  getHistory(characterId: string): readonly CanonRevision[] {
    return this.canon.history(characterId);
  }

  listCharacters(): CanonSnapshot[] {
    return this.canon.listCharacters();
  }

  /** The character's current identity fingerprint. */
  fingerprint(characterId: string): Fingerprint {
    return fingerprintSnapshot(this.canon.snapshot(characterId));
  }

  /**
   * Verifies a fingerprint (e.g. one embedded in a generated asset)
   * against the character's current canon and reports any drift.
   */
  verify(characterId: string, claimed: Fingerprint): DriftReport {
    return detectDrift(this.fingerprint(characterId), claimed);
  }
}
