import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import { CharacterOS, type Actor, type CanonFact } from '../api/index.js';
import { PromptConnector } from '../generation-connectors/index.js';
import { CharacterOSClient } from '../sdk/index.js';

const steward: Actor = { id: 'maya', authority: 'steward' };
const contributor: Actor = { id: 'rin', authority: 'contributor' };

const akariSeed: CanonFact[] = [
  { facet: 'visual', key: 'hair.color', value: 'auburn' },
  { facet: 'narrative', key: 'origin', value: 'lighthouse keeper on the northern coast' },
];

describe('CharacterOS API + SDK', () => {
  it('runs the full propose → ratify → fingerprint → verify loop', () => {
    const os = new CharacterOS();
    const stewardClient = new CharacterOSClient(os, steward);
    const contributorClient = new CharacterOSClient(os, contributor);

    const akari = stewardClient.createCharacter('Akari', akariSeed);
    const assetFingerprint = stewardClient.fingerprint(akari.characterId);

    // An asset generated now verifies clean against current canon.
    assert.equal(stewardClient.verify(akari.characterId, assetFingerprint).identical, true);

    const proposal = contributorClient.proposeChange(
      akari.characterId,
      [{ op: 'set', facet: 'visual', key: 'outfit.default', value: 'storm coat' }],
      'signature outfit',
    );
    stewardClient.ratify(proposal.id);

    // Canon moved on: the old asset now reports visual drift.
    const drift = stewardClient.verify(akari.characterId, assetFingerprint);
    assert.equal(drift.identical, false);
    assert.deepEqual(drift.driftedFacets, ['visual']);
  });

  it('builds deterministic prompts from canon', () => {
    const os = new CharacterOS();
    const client = new CharacterOSClient(os, steward);
    const akari = client.createCharacter('Akari', akariSeed);

    const connector = new PromptConnector();
    const snapshot = client.getCanon(akari.characterId);
    const fingerprint = client.fingerprint(akari.characterId);
    const first = connector.buildRequest(snapshot, fingerprint);
    const second = connector.buildRequest(snapshot, fingerprint);

    assert.equal(first.payload, second.payload);
    assert.match(first.payload, /Character: Akari/);
    assert.match(first.payload, /hair\.color: auburn/);
    assert.equal(first.fingerprint.composite, fingerprint.composite);
  });
});
