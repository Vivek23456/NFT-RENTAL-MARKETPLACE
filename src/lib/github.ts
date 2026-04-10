/** Public repo URL for nav / demo banner (override on fork via VITE_GITHUB_REPO_URL). */
export const GITHUB_REPO_URL: string =
  (import.meta.env.VITE_GITHUB_REPO_URL as string | undefined)?.replace(/\/$/, '') ||
  'https://github.com/Vivek23456/NFT-RENTAL-MARKETPLACE';
