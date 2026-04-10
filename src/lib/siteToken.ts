/** Display-only conversion for a platform / "site" SPL token (no on-chain swap in this MVP). */
export function getSiteTokenSymbol(): string {
  return import.meta.env.VITE_SITE_TOKEN_SYMBOL ?? 'MKT';
}

export function getSiteTokensPerSol(): number {
  const raw = import.meta.env.VITE_SITE_TOKENS_PER_SOL;
  const n = raw != null && raw !== '' ? Number(raw) : 100;
  return Number.isFinite(n) && n > 0 ? n : 100;
}

export function solToSiteTokensDisplay(sol: number): string {
  const amount = Math.round(sol * getSiteTokensPerSol());
  return amount.toLocaleString();
}
