import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, Calendar, Coins, User, Settings } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface Listing {
  id: string;
  name: string;
  image_url: string;
  daily_rent_lamports: number;
  collateral_lamports: number;
  min_duration_secs: number;
  max_duration_secs: number;
  active: boolean;
  current_rental_id: string | null;
  created_at: string;
  rentals?: Array<{
    id: string;
    renter_id: string;
    start_date: string;
    end_date: string;
    status: string;
    profiles: {
      display_name: string;
    };
  }>;
}

const MyListings: React.FC = () => {
  const { user } = useAuth();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadListings();
    }
  }, [user]);

  const loadListings = async () => {
    try {
      // First get the listings
      const { data: listingsData, error: listingsError } = await supabase
        .from('nft_listings')
        .select('*')
        .eq('owner_id', user?.id)
        .order('created_at', { ascending: false });

      if (listingsError) throw listingsError;

      // Then get the rentals with profile info for each listing
      const listingsWithRentals = await Promise.all(
        (listingsData || []).map(async (listing) => {
          const { data: rentalsData } = await supabase
            .from('rentals')
            .select(`
              id,
              renter_id,
              start_date,
              end_date,
              status
            `)
            .eq('listing_id', listing.id);

          // Get profile info for each rental
          const rentalsWithProfiles = await Promise.all(
            (rentalsData || []).map(async (rental) => {
              const { data: profileData } = await supabase
                .from('profiles')
                .select('display_name')
                .eq('id', rental.renter_id)
                .single();

              return {
                ...rental,
                profiles: profileData || { display_name: 'Anonymous' }
              };
            })
          );

          return {
            ...listing,
            rentals: rentalsWithProfiles
          };
        })
      );

      setListings(listingsWithRentals);
    } catch (error) {
      console.error('Error loading listings:', error);
      toast.error('Failed to load listings');
    } finally {
      setLoading(false);
    }
  };

  const formatSOL = (lamports: number) => {
    return (lamports / 1e9).toFixed(3);
  };

  const formatDuration = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    if (days > 0) return `${days}d`;
    return `${hours}h`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const toggleListingStatus = async (listingId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('nft_listings')
        .update({ active: !currentStatus })
        .eq('id', listingId);

      if (error) throw error;

      toast.success(`Listing ${!currentStatus ? 'activated' : 'deactivated'}`);
      loadListings();
    } catch (error) {
      console.error('Error updating listing:', error);
      toast.error('Failed to update listing');
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

  if (listings.length === 0) {
    return (
      <div className="text-center py-12">
        <Settings className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-xl font-semibold mb-2">No listings yet</h3>
        <p className="text-muted-foreground mb-6">
          You haven't listed any NFTs for rent. Create your first listing to start earning.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {listings.map((listing) => {
        const activeRental = listing.rentals?.find(r => r.status === 'active');
        
        return (
          <Card key={listing.id} className="card-glass hover:scale-105 transition-all duration-300">
            <CardHeader className="p-4">
              <div className="aspect-square rounded-lg overflow-hidden bg-muted">
                <img 
                  src={listing.image_url} 
                  alt={listing.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <CardTitle className="text-lg font-semibold mt-3">
                {listing.name}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant={listing.active ? 'success' : 'secondary'}>
                  {listing.active ? 'Active' : 'Inactive'}
                </Badge>
                {activeRental && (
                  <Badge variant="warning">
                    Currently Rented
                  </Badge>
                )}
              </div>
            </CardHeader>

            <CardContent className="p-4 pt-0 space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Coins className="w-4 h-4 text-accent" />
                <span>{formatSOL(listing.daily_rent_lamports)} SOL/day</span>
              </div>
              
              <div className="flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4 text-accent" />
                <span>
                  {formatDuration(listing.min_duration_secs)} - {formatDuration(listing.max_duration_secs)}
                </span>
              </div>

              {activeRental && (
                <>
                  <div className="flex items-center gap-2 text-sm">
                    <User className="w-4 h-4 text-accent" />
                    <span>Rented by {activeRental.profiles?.display_name || 'Anonymous'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-accent" />
                    <span>
                      Until {formatDate(activeRental.end_date)}
                    </span>
                  </div>
                </>
              )}

              <div className="flex gap-2 pt-2">
                <Button 
                  variant={listing.active ? "outline" : "hero"}
                  className="flex-1"
                  onClick={() => toggleListingStatus(listing.id, listing.active)}
                  disabled={!!activeRental}
                >
                  {listing.active ? 'Deactivate' : 'Activate'}
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default MyListings;