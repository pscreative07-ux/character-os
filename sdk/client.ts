import { CharacterOS } from '../api/index.js';
import type {
  Actor,
  CanonChange,
  CanonFact,
  CanonSnapshot,
  DriftReport,
  Fingerprint,
  Proposal,
} from '../api/index.js';

/**
 * The SDK client applications embed. It binds an actor identity once so
 * call sites don't repeat it, and exposes the workflow-shaped operations
 * integrators actually need. Today it runs in-process against the API
 * facade; a remote transport can slot in behind the same surface.
 */
export class CharacterOSClient {
  constructor(
    private readonly os: CharacterOS,
    private readonly actor: Actor,
  ) {}

  createCharacter(name: string, seedFacts: CanonFact[]): CanonSnapshot {
    return this.os.createCharacter(name, seedFacts, this.actor);
  }

  proposeChange(characterId: string, changes: CanonChange[], rationale: string): Proposal {
    return this.os.propose(characterId, changes, rationale, this.actor);
  }

  ratify(proposalId: string): CanonSnapshot {
    return this.os.ratify(proposalId, this.actor);
  }

  reject(proposalId: string): Proposal {
    return this.os.reject(proposalId, this.actor);
  }

  getCanon(characterId: string): CanonSnapshot {
    return this.os.getCanon(characterId);
  }

  fingerprint(characterId: string): Fingerprint {
    return this.os.fingerprint(characterId);
  }

  verify(characterId: string, claimed: Fingerprint): DriftReport {
    return this.os.verify(characterId, claimed);
  }
}
