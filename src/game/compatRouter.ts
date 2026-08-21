export type LetterBayEngine = 'legacy' | 'v2';

export function normalizeBase(base: string): string {
  const withLeading = base.startsWith('/') ? base : `/${base}`;
  return withLeading.endsWith('/') ? withLeading : `${withLeading}/`;
}

export function requestedEngine(search: string): LetterBayEngine {
  const value = new URLSearchParams(search).get('engine');
  return value === 'legacy' ? 'legacy' : 'v2';
}

function forwardedV2Search(search: string): string {
  const params = new URLSearchParams(search);
  params.delete('engine');
  const value = params.toString();
  return value ? `?${value}` : '';
}

export function resolveEngineTarget(search: string, base: string): string {
  const normalizedBase = normalizeBase(base);
  if (requestedEngine(search) === 'legacy') {
    return `${normalizedBase}legacy/index.html?engine=legacy`;
  }
  return `${normalizedBase}v2/${forwardedV2Search(search)}`;
}

export function resolveV2CompatibilityTarget(base: string): string {
  return `${normalizeBase(base)}legacy/index.html?engine=v2-compat`;
}
