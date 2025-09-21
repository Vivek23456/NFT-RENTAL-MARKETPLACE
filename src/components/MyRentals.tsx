import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, Calendar, Coins, ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface Rental {
  id: string;
  listing_id: string;
  start_date: string;
  end_date: string;
  duration_days: number;
  daily_rent_lamports: number;
  collateral_lamports: number;
  total_cost_lamports: number;
  status: string;
  nft_listings: {
    name: string;
    image_url: string;
    mint_address: string;
    owner_id: string;
  };
}

const MyRentals: React.FC = () => {
  const { user } = useAuth();
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadRentals();
    }
  }, [user]);

  const loadRentals = async () => {
    try {
      const { data, error } = await supabase
        .from('rentals')
        .select(`
          *,
          nft_listings (
            name,
            image_url,
            mint_address,
            owner_id
          )
        `)
        .eq('renter_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRentals(data || []);
    } catch (error) {
      console.error('Error loading rentals:', error);
      toast.error('Failed to load rentals');
    } finally {
      setLoading(false);
    }
  };

  const formatSOL = (lamports: number) => {
    return (lamports / 1e9).toFixed(3);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getRemainingTime = (endDate: string) => {
    const now = new Date();
    const end = new Date(endDate);
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'Expired';
    if (diffDays === 0) return 'Expires today';
    if (diffDays === 1) return '1 day left';
    return `${diffDays} days left`;
  };

  const handleReturnNFT = async (rentalId: string) => {
    try {
      const { error } = await supabase
        .from('rentals')
        .update({ status: 'returned' })
        .eq('id', rentalId);

      if (error) throw error;

      // Update the listing to make it active again
      const rental = rentals.find(r => r.id === rentalId);
      if (rental) {
        await supabase
          .from('nft_listings')
          .update({ 
            active: true, 
            current_rental_id: null 
          })
          .eq('id', rental.listing_id);
      }

      toast.success('NFT returned successfully');
      loadRentals();
    } catch (error) {
      console.error('Error returning NFT:', error);
      toast.error('Failed to return NFT');
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="p-4">
              <div className="aspect-square rounded-lg bg-muted"></div>
            </CardHeader>
          </Card>
        ))}
      </div>
    );
  }

  if (rentals.length === 0) {
    return (
      <div className="text-center py-12">
        <ArrowLeft className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-xl font-semibold mb-2">No active rentals</h3>
        <p className="text-muted-foreground mb-6">
          You haven't rented any NFTs yet. Browse the marketplace to find NFTs to rent.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {rentals.map((rental) => (
        <Card key={rental.id} className="card-glass hover:scale-105 transition-all duration-300">
          <CardHeader className="p-4">
            <div className="aspect-square rounded-lg overflow-hidden bg-muted">
              <img 
                src={rental.nft_listings.image_url} 
                alt={rental.nft_listings.name}
                className="w-full h-full object-cover"
              />
            </div>
            <CardTitle className="text-lg font-semibold mt-3">
              {rental.nft_listings.name}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant={rental.status === 'active' ? 'success' : 'secondary'}>
                {rental.status === 'active' ? 'Active' : 'Returned'}
              </Badge>
              {rental.status === 'active' && (
                <Badge variant="outline">
                  {getRemainingTime(rental.end_date)}
                </Badge>
              )}
            </div>
          </CardHeader>

          <CardContent className="p-4 pt-0 space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4 text-accent" />
              <span>
                {formatDate(rental.start_date)} - {formatDate(rental.end_date)}
              </span>
            </div>
            
            <div className="flex items-center gap-2 text-sm">
              <Clock className="w-4 h-4 text-accent" />
              <span>{rental.duration_days} days</span>
            </div>
            
            <div className="flex items-center gap-2 text-sm">
              <Coins className="w-4 h-4 text-accent" />
              <span>{formatSOL(rental.total_cost_lamports)} SOL total</span>
            </div>

            {rental.status === 'active' && (
              <Button 
                variant="outline" 
                className="w-full mt-4"
                onClick={() => handleReturnNFT(rental.id)}
              >
                Return NFT
              </Button>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default MyRentals;