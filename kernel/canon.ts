import { randomUUID } from 'node:crypto';
import { Authority, AuthorityError } from './authority.js';
import type {
  Actor,
  CanonChange,
  CanonFact,
  CanonRevision,
  CanonSnapshot,
  FacetKind,
  Proposal,
} from './types.js';
import { FACET_KINDS } from './types.js';

export class CanonError extends Error {
  override name = 'CanonError';
}

interface CharacterRecord {
  id: string;
  name: string;
  facets: Record<FacetKind, Map<string, string>>;
  history: CanonRevision[];
}

function emptyFacets(): Record<FacetKind, Map<string, string>> {
  return { visual: new Map(), narrative: new Map(), behavioral: new Map() };
}

/**
 * The canon store: the single authoritative record of every character's
 * identity. All writes go through the proposal → ratification path; the
 * only exception is character creation, whose seed facts are sealed as
 * foundation facts.
 */
export class CanonStore {
  private characters = new Map<string, CharacterRecord>();
  private proposals = new Map<string, Proposal>();

  constructor(private authority: Authority = new Authority()) {}

  createCharacter(name: string, seedFacts: CanonFact[], creator: Actor): CanonSnapshot {
    if (!name.trim()) throw new CanonError('character name must not be empty');
    const id = randomUUID();
    const record: CharacterRecord = { id, name, facets: emptyFacets(), history: [] };

    const changes: CanonChange[] = seedFacts.map((f) => ({
      op: 'set',
      facet: f.facet,
      key: f.key,
      value: f.value,
    }));
    for (const change of changes) {
      record.facets[change.facet].set(change.key, (change as { value: string }).value);
      // Seed facts are the character's origin: sealed at foundation level.
      this.authority.seal(id, change.facet, change.key);
    }
    record.history.push({ revision: 1, proposalId: null, changes, ratifiedBy: creator });
    this.characters.set(id, record);
    return this.snapshot(id);
  }

  propose(
    characterId: string,
    changes: CanonChange[],
    rationale: string,
    proposedBy: Actor,
  ): Proposal {
    const record = this.mustGet(characterId);
    if (changes.length === 0) throw new CanonError('a proposal must contain at least one change');
    this.authority.assertCanPropose(proposedBy);
    // Reject proposals that touch sealed facts up front, so authors find
    // out at proposal time rather than at ratification.
    this.authority.assertChangesAllowed(record.id, changes);

    const proposal: Proposal = {
      id: randomUUID(),
      characterId: record.id,
      proposedBy,
      changes,
      rationale,
      status: 'pending',
    };
    this.proposals.set(proposal.id, proposal);
    return proposal;
  }

  ratify(proposalId: string, ratifier: Actor): CanonSnapshot {
    const proposal = this.mustGetProposal(proposalId);
    if (proposal.status !== 'pending') {
      throw new CanonError(`proposal ${proposalId} is already ${proposal.status}`);
    }
    this.authority.assertCanRatify(ratifier);
    const record = this.mustGet(proposal.characterId);
    // Re-check: a fact may have been sealed since the proposal was filed.
    this.authority.assertChangesAllowed(record.id, proposal.changes);

    for (const change of proposal.changes) {
      if (change.op === 'set') {
        record.facets[change.facet].set(change.key, change.value);
      } else {
        record.facets[change.facet].delete(change.key);
      }
    }
    record.history.push({
      revision: record.history.length + 1,
      proposalId: proposal.id,
      changes: proposal.changes,
      ratifiedBy: ratifier,
    });
    proposal.status = 'ratified';
    proposal.resolvedBy = ratifier;
    return this.snapshot(record.id);
  }

  reject(proposalId: string, rejecter: Actor): Proposal {
    const proposal = this.mustGetProposal(proposalId);
    if (proposal.status !== 'pending') {
      throw new CanonError(`proposal ${proposalId} is already ${proposal.status}`);
    }
    this.authority.assertCanRatify(rejecter);
    proposal.status = 'rejected';
    proposal.resolvedBy = rejecter;
    return proposal;
  }

  getProposal(proposalId: string): Proposal {
    return this.mustGetProposal(proposalId);
  }

  snapshot(characterId: string): CanonSnapshot {
    const record = this.mustGet(characterId);
    const facets = {} as CanonSnapshot['facets'];
    for (const kind of FACET_KINDS) {
      facets[kind] = Object.fromEntries(
        [...record.facets[kind].entries()].sort(([a], [b]) => a.localeCompare(b)),
      );
    }
    return {
      characterId: record.id,
      name: record.name,
      revision: record.history.length,
      facets,
    };
  }

  history(characterId: string): readonly CanonRevision[] {
    return [...this.mustGet(characterId).history];
  }

  listCharacters(): CanonSnapshot[] {
    return [...this.characters.keys()].map((id) => this.snapshot(id));
  }

  private mustGet(characterId: string): CharacterRecord {
    const record = this.characters.get(characterId);
    if (!record) throw new CanonError(`unknown character: ${characterId}`);
    return record;
  }

  private mustGetProposal(proposalId: string): Proposal {
    const proposal = this.proposals.get(proposalId);
    if (!proposal) throw new CanonError(`unknown proposal: ${proposalId}`);
    return proposal;
  }
}

export { AuthorityError };
