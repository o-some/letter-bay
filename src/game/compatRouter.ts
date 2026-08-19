export type LetterBayEngine = 'legacy' | 'v2';

export function normalizeBase(base: string): string {
  const withLeading = base.startsWith('/') ? base : `/${base}`;
  return withLeading.endsWith('/') ? withLeading : `${withLeading}/`;
}

export function requestedEngine(search: string): LetterBayEngine {
  const value = new URLSearchParams(search).get('engine');
  return value === 'v2' ? 'v2' : 'legacy';
}

export function resolveEngineTarget(search: string, base: string): string {
  const normalizedBase = normalizeBase(base);
  return requestedEngine(search) === 'v2'
    ? `${normalizedBase}v2/`
    : `${normalizedBase}legacy/index.html?engine=legacy`;
}

export function resolveV2CompatibilityTarget(base: string): string {
  return `${normalizeBase(base)}legacy/index.html?engine=v2-compat`;
}
