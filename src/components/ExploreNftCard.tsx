import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { DemoMarketNft } from '@/data/demoMarketplace';
import { getSiteTokenSymbol, solToSiteTokensDisplay } from '@/lib/siteToken';
import { Coins } from 'lucide-react';

type ExploreNftCardProps = {
  nft: DemoMarketNft;
  onBuy: (nft: DemoMarketNft) => void;
};

const tierStyles: Record<DemoMarketNft['tier'], string> = {
  grail: 'border-primary/40 shadow-glow-primary bg-card/90',
  featured: 'border-primary/25 bg-card/90',
  standard: 'border-border/80 bg-card/85',
};

function ExploreNftCard({ nft, onBuy }: ExploreNftCardProps) {
  const symbol = getSiteTokenSymbol();
  const siteAmt = solToSiteTokensDisplay(nft.priceSol);

  return (
    <Card
      className={`group overflow-hidden border transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${tierStyles[nft.tier]}`}
    >
      <div className="relative aspect-square overflow-hidden bg-muted">
        <img
          src={nft.image}
          alt={nft.name}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-background/95 via-background/40 to-transparent pt-12 pb-2 px-3">
          <p className="text-[11px] font-medium uppercase tracking-wider text-primary/90">{nft.collection}</p>
          <p className="truncate text-sm font-semibold text-foreground">{nft.name}</p>
        </div>
        {nft.tier === 'grail' && (
          <Badge className="absolute left-2 top-2 border-primary/40 bg-background/80 text-primary backdrop-blur-sm">
            Grail
          </Badge>
        )}
      </div>

      <div className="space-y-3 p-3">
        <div className="flex items-end justify-between gap-2">
          <div>
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Price</p>
            <p className="text-lg font-bold tabular-nums text-foreground">{nft.priceSol.toFixed(2)} SOL</p>
            <p className="text-xs text-muted-foreground tabular-nums">
              ≈ {siteAmt} {symbol}
            </p>
          </div>
          {nft.dailyRentSol != null && (
            <div className="text-right">
              <p className="flex items-center justify-end gap-1 text-[10px] uppercase tracking-wide text-muted-foreground">
                <Coins className="h-3 w-3" />
                Rent from
              </p>
              <p className="text-sm font-semibold tabular-nums text-primary">{nft.dailyRentSol.toFixed(2)} SOL/d</p>
            </div>
          )}
        </div>

        <Button variant="hero" className="w-full text-sm" type="button" onClick={() => onBuy(nft)}>
          Buy now
        </Button>
      </div>
    </Card>
  );
}

export default ExploreNftCard;
