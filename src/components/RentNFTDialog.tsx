import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Calendar, Coins, Shield, Clock } from 'lucide-react';
import { validateNumericRange, checkRateLimit } from '@/lib/validation';
import { useSecurityMonitor } from '@/hooks/useSecurityMonitor';

interface RentNFTDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
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
  } | null;
  onRent: (listingId: string, durationDays: number) => void;
}

const RentNFTDialog: React.FC<RentNFTDialogProps> = ({ 
  open, 
  onOpenChange, 
  listing, 
  onRent 
}) => {
  const { toast } = useToast();
  const { logValidationError, logRateLimitExceeded } = useSecurityMonitor();
  const [durationDays, setDurationDays] = useState(1);
  const [loading, setLoading] = useState(false);

  if (!listing) return null;

  const formatSOL = (lamports: number) => {
    return (lamports / 1e9).toFixed(3);
  };

  const formatDuration = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    if (days > 0) return `${days}d`;
    return `${hours}h`;
  };

  const minDays = Math.ceil(listing.minDurationSecs / 86400);
  const maxDays = Math.floor(listing.maxDurationSecs / 86400);

  const totalRent = (listing.dailyRentLamports * durationDays) / 1e9;
  const collateral = listing.collateralLamports / 1e9;
  const totalCost = totalRent + collateral;

  const handleRent = async () => {
    // Rate limiting check
    const rateCheck = checkRateLimit('nft-rental-submit', 5, 60000);
    if (!rateCheck.allowed) {
      logRateLimitExceeded('nft-rental-submit', 5);
      toast({
        title: "Rate Limit Exceeded",
        description: "Too many rental attempts. Please wait before trying again.",
        variant: "destructive",
      });
      return;
    }

    // Enhanced validation
    const durationValidation = validateNumericRange(durationDays, minDays, maxDays, 'Rental duration');
    if (!durationValidation.isValid) {
      logValidationError('durationDays', durationValidation.error || 'Invalid duration', durationDays.toString());
      toast({
        title: "Invalid Duration",
        description: durationValidation.error || `Duration must be between ${minDays} and ${maxDays} days`,
        variant: "destructive",
      });
      return;
    }

    // Additional security check for unusual rental patterns
    if (durationDays > 90) {
      logValidationError('durationDays', 'Unusually long rental period requested', durationDays.toString());
    }

    if (totalCost > 100) { // More than 100 SOL
      logValidationError('totalCost', 'High value transaction attempted', totalCost.toString());
    }

    setLoading(true);
    try {
      await onRent(listing.id, durationDays);
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-card border-border/50">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Rent NFT
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* NFT Preview */}
          <Card className="card-glass">
            <CardContent className="p-4">
              <div className="aspect-square rounded-lg overflow-hidden bg-muted mb-4">
                <img
                  src={listing.image}
                  alt={listing.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <h3 className="font-semibold text-lg mb-2">{listing.name}</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span>Owner:</span>
                  <Badge variant="outline">{listing.owner}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Daily Rent:</span>
                  <span className="font-medium">{formatSOL(listing.dailyRentLamports)} SOL</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Collateral:</span>
                  <span className="font-medium">{formatSOL(listing.collateralLamports)} SOL</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Duration Range:</span>
                  <span className="font-medium">
                    {formatDuration(listing.minDurationSecs)} - {formatDuration(listing.maxDurationSecs)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Rental Configuration */}
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="duration">Rental Duration (days)</Label>
              <Input
                id="duration"
                type="number"
                min={minDays}
                max={maxDays}
                value={durationDays}
                onChange={(e) => setDurationDays(parseInt(e.target.value) || minDays)}
                className="bg-background/50"
              />
              <p className="text-xs text-muted-foreground">
                Minimum: {minDays} days, Maximum: {maxDays} days
              </p>
            </div>

            {/* Cost Breakdown */}
            <Card className="card-glass">
              <CardContent className="p-4 space-y-3">
                <h4 className="font-semibold flex items-center gap-2">
                  <Coins className="w-4 h-4" />
                  Cost Breakdown
                </h4>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Rental Cost:</span>
                    <span>{totalRent.toFixed(3)} SOL</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Collateral (refundable):</span>
                    <span>{collateral.toFixed(3)} SOL</span>
                  </div>
                  <div className="border-t border-border pt-2 flex justify-between font-semibold">
                    <span>Total Required:</span>
                    <span className="text-accent">{totalCost.toFixed(3)} SOL</span>
                  </div>
                </div>

                <div className="flex items-start gap-2 p-3 bg-accent/10 rounded-lg">
                  <Shield className="w-4 h-4 text-accent mt-0.5" />
                  <div className="text-xs">
                    <p className="font-medium text-accent">Collateral Protection</p>
                    <p className="text-muted-foreground">
                      Your collateral will be refunded when you return the NFT on time.
                      Late returns may incur penalties.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                variant="hero"
                onClick={handleRent}
                disabled={loading}
                className="flex-1"
              >
                {loading ? "Processing..." : `Rent for ${totalCost.toFixed(3)} SOL`}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RentNFTDialog;