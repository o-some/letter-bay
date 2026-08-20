import { describe, expect, it } from 'vitest';
import {
  normalizeBase,
  requestedEngine,
  resolveEngineTarget,
  resolveV2CompatibilityTarget,
} from '../../src/game/compatRouter';

describe('Letter Bay compatibility router', () => {
  it('normalizes the GitHub Pages base path', () => {
    expect(normalizeBase('/letter-bay')).toBe('/letter-bay/');
    expect(normalizeBase('letter-bay/')).toBe('/letter-bay/');
  });

  it('defaults to the validated V2 engine', () => {
    expect(requestedEngine('')).toBe('v2');
    expect(requestedEngine('?engine=unknown')).toBe('v2');
  });

  it('keeps legacy as an explicit rollback-compatible selection', () => {
    expect(requestedEngine('?engine=legacy')).toBe('legacy');
  });

  it('routes legacy and V2 through separate compatibility entries', () => {
    expect(resolveEngineTarget('', '/letter-bay/')).toBe('/letter-bay/v2/');
    expect(resolveEngineTarget('?engine=legacy', '/letter-bay/')).toBe('/letter-bay/legacy/index.html?engine=legacy');
    expect(resolveEngineTarget('?engine=v2', '/letter-bay/')).toBe('/letter-bay/v2/');
    expect(resolveV2CompatibilityTarget('/letter-bay/')).toBe('/letter-bay/legacy/index.html?engine=v2-compat');
  });
});
