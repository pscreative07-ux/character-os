import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import {
  AuthorityError,
  CanonError,
  CanonStore,
  detectDrift,
  fingerprintSnapshot,
  type Actor,
  type CanonFact,
} from '../kernel/index.js';

const steward: Actor = { id: 'maya', authority: 'steward' };
const contributor: Actor = { id: 'rin', authority: 'contributor' };

const akariSeed: CanonFact[] = [
  { facet: 'visual', key: 'hair.color', value: 'auburn' },
  { facet: 'visual', key: 'eyes.color', value: 'amber' },
  { facet: 'narrative', key: 'origin', value: 'lighthouse keeper on the northern coast' },
  { facet: 'behavioral', key: 'demeanor', value: 'quietly stubborn' },
];

describe('CanonStore', () => {
  it('creates a character with sealed seed facts at revision 1', () => {
    const store = new CanonStore();
    const akari = store.createCharacter('Akari', akariSeed, steward);
    assert.equal(akari.revision, 1);
    assert.equal(akari.facets.visual['hair.color'], 'auburn');
    assert.equal(store.history(akari.characterId).length, 1);
  });

  it('applies changes only through ratified proposals', () => {
    const store = new CanonStore();
    const akari = store.createCharacter('Akari', akariSeed, steward);
    const proposal = store.propose(
      akari.characterId,
      [{ op: 'set', facet: 'visual', key: 'outfit.default', value: 'storm coat' }],
      'Akari needs a signature outfit',
      contributor,
    );
    // Not yet canon.
    assert.equal(store.snapshot(akari.characterId).facets.visual['outfit.default'], undefined);

    const updated = store.ratify(proposal.id, steward);
    assert.equal(updated.revision, 2);
    assert.equal(updated.facets.visual['outfit.default'], 'storm coat');
    assert.equal(store.getProposal(proposal.id).status, 'ratified');
  });

  it('refuses ratification from a contributor', () => {
    const store = new CanonStore();
    const akari = store.createCharacter('Akari', akariSeed, steward);
    const proposal = store.propose(
      akari.characterId,
      [{ op: 'set', facet: 'behavioral', key: 'quirk', value: 'hums when thinking' }],
      'add a quirk',
      contributor,
    );
    assert.throws(() => store.ratify(proposal.id, contributor), AuthorityError);
    assert.equal(store.getProposal(proposal.id).status, 'pending');
  });

  it('refuses proposals that touch foundation facts', () => {
    const store = new CanonStore();
    const akari = store.createCharacter('Akari', akariSeed, steward);
    assert.throws(
      () =>
        store.propose(
          akari.characterId,
          [{ op: 'set', facet: 'visual', key: 'hair.color', value: 'silver' }],
          'redesign',
          steward,
        ),
      AuthorityError,
    );
  });

  it('refuses double resolution of a proposal', () => {
    const store = new CanonStore();
    const akari = store.createCharacter('Akari', akariSeed, steward);
    const proposal = store.propose(
      akari.characterId,
      [{ op: 'set', facet: 'narrative', key: 'goal', value: 'relight the lighthouse' }],
      'give her a goal',
      contributor,
    );
    store.reject(proposal.id, steward);
    assert.throws(() => store.ratify(proposal.id, steward), CanonError);
  });
});

describe('fingerprints', () => {
  it('is stable across fact insertion order', () => {
    const store = new CanonStore();
    const a = store.createCharacter('Akari', akariSeed, steward);
    const b = store.createCharacter('Akari', [...akariSeed].reverse(), steward);
    const fa = fingerprintSnapshot(store.snapshot(a.characterId));
    const fb = fingerprintSnapshot(store.snapshot(b.characterId));
    assert.deepEqual(fa.facets, fb.facets);
    assert.equal(fa.composite, fb.composite);
  });

  it('detects drift in exactly the changed facet', () => {
    const store = new CanonStore();
    const akari = store.createCharacter('Akari', akariSeed, steward);
    const before = fingerprintSnapshot(store.snapshot(akari.characterId));

    const proposal = store.propose(
      akari.characterId,
      [{ op: 'set', facet: 'behavioral', key: 'quirk', value: 'hums when thinking' }],
      'add a quirk',
      contributor,
    );
    store.ratify(proposal.id, steward);
    const after = fingerprintSnapshot(store.snapshot(akari.characterId));

    const drift = detectDrift(before, after);
    assert.equal(drift.identical, false);
    assert.deepEqual(drift.driftedFacets, ['behavioral']);
  });
});
