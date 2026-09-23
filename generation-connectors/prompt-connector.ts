import type { CanonSnapshot, Fingerprint } from '../kernel/index.js';
import { FACET_KINDS } from '../kernel/index.js';
import type { GenerationConnector, GenerationRequest } from './connector.js';

/**
 * The reference connector: renders ratified canon into a deterministic
 * text prompt for prompt-driven backends (image/video/text models). The
 * same canon always yields the same prompt, so prompt diffs mirror canon
 * diffs exactly.
 */
export class PromptConnector implements GenerationConnector {
  readonly backend = 'prompt';

  buildRequest(snapshot: CanonSnapshot, fingerprint: Fingerprint): GenerationRequest {
    const sections: string[] = [`Character: ${snapshot.name}`];
    for (const kind of FACET_KINDS) {
      const facts = snapshot.facets[kind];
      const keys = Object.keys(facts).sort();
      if (keys.length === 0) continue;
      sections.push(`${kind}:`);
      for (const key of keys) {
        sections.push(`  - ${key}: ${facts[key]}`);
      }
    }
    return {
      characterId: snapshot.characterId,
      fingerprint,
      payload: sections.join('\n'),
    };
  }
}
