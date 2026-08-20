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

  it('defaults to legacy for safety', () => {
    expect(requestedEngine('')).toBe('legacy');
    expect(requestedEngine('?engine=unknown')).toBe('legacy');
  });

  it('allows explicit V2 selection', () => {
    expect(requestedEngine('?engine=v2')).toBe('v2');
  });

  it('routes legacy and V2 through separate compatibility entries', () => {
    expect(resolveEngineTarget('?engine=legacy', '/letter-bay/')).toBe('/letter-bay/legacy/index.html?engine=legacy');
    expect(resolveEngineTarget('?engine=v2', '/letter-bay/')).toBe('/letter-bay/v2/');
    expect(resolveV2CompatibilityTarget('/letter-bay/')).toBe('/letter-bay/legacy/index.html?engine=v2-compat');
  });
});
