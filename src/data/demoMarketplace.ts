/** Curated demo listings for Explore UI (not on-chain). SOL is the canonical price; site token is display-only using VITE_SITE_TOKENS_PER_SOL. */
export type DemoMarketNft = {
  id: string;
  name: string;
  collection: string;
  image: string;
  /** Featured / standard visual tier */
  tier: 'grail' | 'featured' | 'standard';
  /** Buy-now style price in SOL (demo) */
  priceSol: number;
  /** Optional rental hint for secondary line */
  dailyRentSol?: number;
};

export const DEMO_MARKET_NFTS: DemoMarketNft[] = [
  { id: 'd1', name: 'Neon Drift #01', collection: 'Neon Drift', image: 'https://picsum.photos/seed/nftrent1/600/600', tier: 'grail', priceSol: 12.5, dailyRentSol: 0.35 },
  { id: 'd2', name: 'Neon Drift #02', collection: 'Neon Drift', image: 'https://picsum.photos/seed/nftrent2/600/600', tier: 'featured', priceSol: 8.2, dailyRentSol: 0.22 },
  { id: 'd3', name: 'Void Runners #07', collection: 'Void Runners', image: 'https://picsum.photos/seed/nftrent3/600/600', tier: 'featured', priceSol: 24.0, dailyRentSol: 0.55 },
  { id: 'd4', name: 'Void Runners #12', collection: 'Void Runners', image: 'https://picsum.photos/seed/nftrent4/600/600', tier: 'standard', priceSol: 19.5, dailyRentSol: 0.48 },
  { id: 'd5', name: 'Pixel Gods #03', collection: 'Pixel Gods', image: 'https://picsum.photos/seed/nftrent5/600/600', tier: 'standard', priceSol: 4.2, dailyRentSol: 0.12 },
  { id: 'd6', name: 'Pixel Gods #18', collection: 'Pixel Gods', image: 'https://picsum.photos/seed/nftrent6/600/600', tier: 'standard', priceSol: 5.5, dailyRentSol: 0.15 },
  { id: 'd7', name: 'Sol Bloom #05', collection: 'Sol Bloom', image: 'https://picsum.photos/seed/nftrent7/600/600', tier: 'grail', priceSol: 31.0, dailyRentSol: 0.8 },
  { id: 'd8', name: 'Sol Bloom #09', collection: 'Sol Bloom', image: 'https://picsum.photos/seed/nftrent8/600/600', tier: 'featured', priceSol: 27.75, dailyRentSol: 0.72 },
  { id: 'd9', name: 'Circuit Fox #11', collection: 'Circuit Fox', image: 'https://picsum.photos/seed/nftrent9/600/600', tier: 'featured', priceSol: 11.0, dailyRentSol: 0.3 },
  { id: 'd10', name: 'Circuit Fox #22', collection: 'Circuit Fox', image: 'https://picsum.photos/seed/nftrent10/600/600', tier: 'standard', priceSol: 9.5, dailyRentSol: 0.26 },
  { id: 'd11', name: 'Glass City #04', collection: 'Glass City', image: 'https://picsum.photos/seed/nftrent11/600/600', tier: 'grail', priceSol: 42.0, dailyRentSol: 1.1 },
  { id: 'd12', name: 'Glass City #14', collection: 'Glass City', image: 'https://picsum.photos/seed/nftrent12/600/600', tier: 'featured', priceSol: 38.5, dailyRentSol: 0.98 },
  { id: 'd13', name: 'Mecha Koi #02', collection: 'Mecha Koi', image: 'https://picsum.photos/seed/nftrent13/600/600', tier: 'featured', priceSol: 16.5, dailyRentSol: 0.44 },
  { id: 'd14', name: 'Mecha Koi #19', collection: 'Mecha Koi', image: 'https://picsum.photos/seed/nftrent14/600/600', tier: 'standard', priceSol: 14.0, dailyRentSol: 0.38 },
  { id: 'd15', name: 'Starforge #06', collection: 'Starforge', image: 'https://picsum.photos/seed/nftrent15/600/600', tier: 'standard', priceSol: 7.2, dailyRentSol: 0.2 },
  { id: 'd16', name: 'Starforge #21', collection: 'Starforge', image: 'https://picsum.photos/seed/nftrent16/600/600', tier: 'standard', priceSol: 6.8, dailyRentSol: 0.19 },
  { id: 'd17', name: 'Chrono Cats #08', collection: 'Chrono Cats', image: 'https://picsum.photos/seed/nftrent17/600/600', tier: 'featured', priceSol: 20.5, dailyRentSol: 0.52 },
  { id: 'd18', name: 'Chrono Cats #15', collection: 'Chrono Cats', image: 'https://picsum.photos/seed/nftrent18/600/600', tier: 'standard', priceSol: 19.8, dailyRentSol: 0.5 },
  { id: 'd19', name: 'Data Spirits #01', collection: 'Data Spirits', image: 'https://picsum.photos/seed/nftrent19/600/600', tier: 'grail', priceSol: 55.0, dailyRentSol: 1.4 },
  { id: 'd20', name: 'Data Spirits #13', collection: 'Data Spirits', image: 'https://picsum.photos/seed/nftrent20/600/600', tier: 'grail', priceSol: 49.5, dailyRentSol: 1.25 },
];
