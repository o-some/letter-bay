export type LetterBayEngine = 'legacy' | 'v2';

export function normalizeBase(base: string): string {
  const withLeading = base.startsWith('/') ? base : `/${base}`;
  return withLeading.endsWith('/') ? withLeading : `${withLeading}/`;
}

export function requestedEngine(search: string): LetterBayEngine {
  const value = new URLSearchParams(search).get('engine');
  return value === 'legacy' ? 'legacy' : 'v2';
}

export function resolveEngineTarget(search: string, base: string): string {
  const normalizedBase = normalizeBase(base);
  return requestedEngine(search) === 'legacy'
    ? `${normalizedBase}legacy/index.html?engine=legacy`
    : `${normalizedBase}v2/`;
}

export function resolveV2CompatibilityTarget(base: string): string {
  return `${normalizeBase(base)}legacy/index.html?engine=v2-compat`;
}
