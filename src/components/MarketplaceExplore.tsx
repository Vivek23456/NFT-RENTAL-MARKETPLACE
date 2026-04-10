import { useMemo, useState } from 'react';
import { Input } from '@/components/ui/input';
import { DEMO_MARKET_NFTS, type DemoMarketNft } from '@/data/demoMarketplace';
import ExploreNftCard from '@/components/ExploreNftCard';
import { getSiteTokenSymbol, getSiteTokensPerSol } from '@/lib/siteToken';
import { Search, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type SortKey = 'price-asc' | 'price-desc' | 'name';

type MarketplaceExploreProps = {
  onDemoBuy: (nft: DemoMarketNft) => void;
};

function MarketplaceExplore({ onDemoBuy }: MarketplaceExploreProps) {
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<SortKey>('price-asc');
  const [collection, setCollection] = useState<string>('all');

  const collections = useMemo(() => {
    const set = new Set(DEMO_MARKET_NFTS.map((n) => n.collection));
    return ['all', ...Array.from(set).sort()];
  }, []);

  const filtered = useMemo(() => {
    let list = [...DEMO_MARKET_NFTS];
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (n) =>
          n.name.toLowerCase().includes(q) || n.collection.toLowerCase().includes(q)
      );
    }
    if (collection !== 'all') {
      list = list.filter((n) => n.collection === collection);
    }
    list.sort((a, b) => {
      if (sort === 'price-asc') return a.priceSol - b.priceSol;
      if (sort === 'price-desc') return b.priceSol - a.priceSol;
      return a.name.localeCompare(b.name);
    });
    return list;
  }, [query, sort, collection]);

  const symbol = getSiteTokenSymbol();
  const perSol = getSiteTokensPerSol();

  return (
    <div className="space-y-8">
      <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-card/90 via-background to-primary/5 px-6 py-10 md:px-10">
        <div className="relative z-10 max-w-2xl space-y-3">
          <p className="text-sm font-medium text-primary">Discover</p>
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">This is just a demo version</h1>
          <p className="text-muted-foreground">
            Below is a Magic Eden–style showcase with sample art and SOL + {symbol} display ({perSol} {symbol} per 1 SOL). Real
            trades happen only from your on-chain listings. Configure{' '}
            <code className="rounded bg-muted px-1 text-xs">VITE_SITE_TOKEN_SYMBOL</code> and{' '}
            <code className="rounded bg-muted px-1 text-xs">VITE_SITE_TOKENS_PER_SOL</code> for branding.
          </p>
        </div>
      </div>

      <div className="sticky top-0 z-20 -mx-1 flex flex-col gap-3 rounded-xl border border-primary/15 bg-background/90 px-3 py-3 backdrop-blur-md md:flex-row md:items-center md:justify-between">
        <div className="relative flex-1 md:max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search collections or items…"
            className="pl-9"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
            <Select value={collection} onValueChange={setCollection}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Collection" />
              </SelectTrigger>
              <SelectContent>
                {collections.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c === 'all' ? 'All collections' : c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="price-asc">Price: low → high</SelectItem>
              <SelectItem value="price-desc">Price: high → low</SelectItem>
              <SelectItem value="name">Name A–Z</SelectItem>
            </SelectContent>
          </Select>
          <Button type="button" variant="outline" size="sm" onClick={() => { setQuery(''); setCollection('all'); setSort('price-asc'); }}>
            Reset
          </Button>
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        Showing <span className="font-medium text-foreground">{filtered.length}</span> of {DEMO_MARKET_NFTS.length} demo items
      </p>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {filtered.map((nft) => (
          <ExploreNftCard key={nft.id} nft={nft} onBuy={onDemoBuy} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="rounded-xl border border-dashed border-primary/25 py-16 text-center text-muted-foreground">
          No items match your filters.
        </div>
      )}
    </div>
  );
}

export default MarketplaceExplore;
