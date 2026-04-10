import { useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import RentNFTDialog from '@/components/RentNFTDialog';
import { Clock, Coins, Shield } from 'lucide-react';

interface NFTCardProps {
  listing: {
    id: string;
    owner: string;
    mint: string;
    name: string;
    image: string;
    dailyRentLamports: number;
    collateralLamports: number;
    minDurationSecs: number;
    maxDurationSecs: number;
    /** True when the listing is open for a new renter (not currently leased). */
    active: boolean;
    currentRenter?: string | null;
    rentalEndTimeUnix?: number | null;
  };
  viewerWallet?: string | null;
  onRent: (listingId: string, durationDays: number) => void;
  onReturnRental?: (mint: string) => void;
  onClaimExpired?: (mint: string) => void;
  onUnlistRental?: (mint: string) => void;
}

const NFTCard: React.FC<NFTCardProps> = ({
  listing,
  viewerWallet,
  onRent,
  onReturnRental,
  onClaimExpired,
  onUnlistRental,
}) => {
  const [showRentDialog, setShowRentDialog] = useState(false);
  const nowSec = Math.floor(Date.now() / 1000);
  const isRenter = !!viewerWallet && listing.currentRenter === viewerWallet;
  const isOwner = !!viewerWallet && listing.owner === viewerWallet;
  const leaseExpired =
    listing.rentalEndTimeUnix != null && nowSec >= listing.rentalEndTimeUnix;
  
  const formatDuration = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    if (days > 0) return `${days}d`;
    return `${hours}h`;
  };

  const formatSOL = (lamports: number) => {
    return (lamports / 1e9).toFixed(3);
  };

  const handleRentClick = () => {
    if (listing.active) {
      setShowRentDialog(true);
    }
  };

  const handleRentSubmit = (listingId: string, durationDays: number) => {
    onRent(listingId, durationDays);
    setShowRentDialog(false);
  };

  return (
    <>
      <Card className="card-glass hover:scale-105 transition-all duration-300 group">
        <CardHeader className="p-4">
          <div className="aspect-square rounded-lg overflow-hidden bg-muted">
            <img 
              src={listing.image} 
              alt={listing.name}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
            />
          </div>
          <CardTitle className="text-lg font-semibold mt-3">{listing.name}</CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant={listing.active ? "success" : "warning"}>
              {listing.active ? "Available" : "Rented"}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="p-4 pt-0 space-y-3">
          <div className="flex items-center gap-2 text-sm">
            <Coins className="w-4 h-4 text-accent" />
            <span>{formatSOL(listing.dailyRentLamports)} SOL/day</span>
          </div>
          
          <div className="flex items-center gap-2 text-sm">
            <Shield className="w-4 h-4 text-accent" />
            <span>{formatSOL(listing.collateralLamports)} SOL collateral</span>
          </div>
          
          <div className="flex items-center gap-2 text-sm">
            <Clock className="w-4 h-4 text-accent" />
            <span>
              {formatDuration(listing.minDurationSecs)} - {formatDuration(listing.maxDurationSecs)}
            </span>
          </div>
          {!listing.active && listing.rentalEndTimeUnix != null && (
            <p className="text-xs text-muted-foreground">
              Lease ends {new Date(listing.rentalEndTimeUnix * 1000).toLocaleString()}
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            NFT stays in on-chain escrow for the lease. You prove the rental from your wallet, not by holding the token.
          </p>
        </CardContent>

        <CardFooter className="p-4 pt-0 flex flex-col gap-2">
          <Button
            variant="hero"
            className="w-full"
            onClick={handleRentClick}
            disabled={!listing.active}
          >
            {listing.active ? 'Rent NFT' : 'Not available to rent'}
          </Button>
          {isRenter && onReturnRental && (
            <Button variant="outline" className="w-full" onClick={() => onReturnRental(listing.mint)}>
              End rental and refund collateral
            </Button>
          )}
          {isOwner && listing.currentRenter && leaseExpired && onClaimExpired && (
            <Button variant="secondary" className="w-full" onClick={() => onClaimExpired(listing.mint)}>
              Claim NFT (lease expired)
            </Button>
          )}
          {isOwner && !listing.currentRenter && onUnlistRental && (
            <Button variant="outline" className="w-full" onClick={() => onUnlistRental(listing.mint)}>
              Remove listing
            </Button>
          )}
        </CardFooter>
      </Card>

      <RentNFTDialog
        open={showRentDialog}
        onOpenChange={setShowRentDialog}
        listing={listing}
        onRent={handleRentSubmit}
      />
    </>
  );
};

export default NFTCard;