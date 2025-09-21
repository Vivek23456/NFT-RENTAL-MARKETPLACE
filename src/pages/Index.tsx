import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { getAssociatedTokenAddress } from '@solana/spl-token';
import { getProgram, listNFT, rentNFT } from '@/lib/anchor';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import WalletButton from '@/components/WalletButton';
import NFTCard from '@/components/NFTCard';
import ListNFTForm, { ListingFormData } from '@/components/ListNFTForm';
import MyRentals from '@/components/MyRentals';
import MyListings from '@/components/MyListings';
import { useToast } from '@/hooks/use-toast';
import { 
  Sparkles, 
  Shield, 
  Clock, 
  TrendingUp, 
  Users, 
  Zap,
  ArrowRight,
  Plus
} from 'lucide-react';
import heroImage from '@/assets/hero-bg.jpg';
import coolApeNft from '@/assets/cool-ape-nft.jpg';
import pixelDragonNft from '@/assets/pixel-dragon-nft.jpg';

// Mock data for demonstration
const mockListings = [
  {
    id: '1',
    owner: 'ABC...123',
    mint: 'DEF...456',
    name: 'Cool Ape #1234',
    image: coolApeNft,
    dailyRentLamports: 100000000, // 0.1 SOL
    collateralLamports: 1000000000, // 1 SOL
    minDurationSecs: 86400, // 1 day
    maxDurationSecs: 2592000, // 30 days
    active: true,
  },
  {
    id: '2',
    owner: 'GHI...789',
    mint: 'JKL...012',
    name: 'Pixel Dragon #567',
    image: pixelDragonNft,
    dailyRentLamports: 200000000, // 0.2 SOL
    collateralLamports: 2000000000, // 2 SOL
    minDurationSecs: 259200, // 3 days
    maxDurationSecs: 1296000, // 15 days
    active: false,
    currentRental: 'rental123',
  },
];

const Index = () => {
  const { connected, publicKey, signTransaction, signAllTransactions } = useWallet();
  const { connection } = useConnection();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('marketplace');
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalListings: 0,
    activeRentals: 0,
    totalVolume: 0,
  });

  const loadListings = async () => {
    try {
      const { data, error } = await supabase
        .from('nft_listings')
        .select('*')
        .eq('active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedListings = data.map(listing => ({
        id: listing.id,
        owner: listing.owner_id || 'Demo User',
        mint: listing.mint_address,
        name: listing.name || 'Unnamed NFT',
        image: listing.image_url === '/src/assets/cool-ape-nft.jpg' 
          ? coolApeNft 
          : listing.image_url === '/src/assets/pixel-dragon-nft.jpg'
          ? pixelDragonNft
          : listing.image_url || 'https://via.placeholder.com/400x400?text=NFT',
        dailyRentLamports: listing.daily_rent_lamports,
        collateralLamports: listing.collateral_lamports,
        minDurationSecs: listing.min_duration_secs,
        maxDurationSecs: listing.max_duration_secs,
        active: listing.active,
        currentRental: listing.current_rental_id,
      }));

      setListings(formattedListings);
      setStats(prev => ({
        ...prev,
        totalListings: formattedListings.length,
      }));
    } catch (error) {
      console.error('Error loading listings:', error);
      toast({
        title: "Error loading listings",
        description: "Failed to load NFT listings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadListings();
  }, []);

  const handleListNFT = async (formData: ListingFormData) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to list your NFT.",
        variant: "destructive",
      });
      navigate('/auth');
      return;
    }

    if (!connected || !publicKey) {
      toast({
        title: "Wallet Required",
        description: "Please connect your wallet to list an NFT.",
        variant: "destructive",
      });
      return;
    }

    // ... keep existing code (Anchor program logic)

    try {
      // Also store in Supabase for easier querying
      const { error } = await supabase.from("nft_listings").insert({
        mint_address: formData.mintAddress,
        name: formData.name,
        description: formData.description,
        image_url: formData.imageUrl,
        daily_rent_lamports: Math.floor(formData.dailyRentSOL * 1000000000),
        collateral_lamports: Math.floor(formData.collateralSOL * 1000000000),
        min_duration_secs: formData.minDurationDays * 24 * 60 * 60,
        max_duration_secs: formData.maxDurationDays * 24 * 60 * 60,
        owner_id: user.id, // Use authenticated user ID instead of wallet
        active: true,
      });

      if (error) throw error;

      toast({
        title: "Success!",
        description: "Your NFT has been listed for rent.",
      });

      loadListings();
    } catch (error: any) {
      console.error("Error listing NFT:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to list NFT. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleRentNFT = async (listingId: string, durationDays: number) => {
    if (!connected || !publicKey) {
      toast({
        title: "Wallet Required",
        description: "Please connect your wallet to rent an NFT.",
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      navigate('/auth');
      return;
    }

    const program = getProgram(connection, {
      publicKey,
      signTransaction: signTransaction!,
      signAllTransactions: signAllTransactions!
    } as any);

    try {
      const listing = listings.find(l => l.id === listingId);
      if (!listing) {
        throw new Error('Listing not found');
      }

      const mintPubkey = new PublicKey(listing.mint);
      
      // Rent NFT on-chain (simulated for now)
      const result = await rentNFT(program, mintPubkey, durationDays);
      
      console.log('NFT rental simulated:', result);

      // Create rental record in database
      const startDate = new Date();
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + durationDays);

      const totalCost = listing.dailyRentLamports * durationDays;

      const { error: rentalError } = await supabase
        .from('rentals')
        .insert({
          listing_id: listingId,
          renter_id: user.id,
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
          duration_days: durationDays,
          daily_rent_lamports: listing.dailyRentLamports,
          collateral_lamports: listing.collateralLamports,
          total_cost_lamports: totalCost,
          status: 'active'
        });

      if (rentalError) throw rentalError;

      // Update the listing to mark it as rented
      const { error: updateError } = await supabase
        .from('nft_listings')
        .update({ 
          active: false,
          current_rental_id: listingId
        })
        .eq('id', listingId);

      if (updateError) throw updateError;

      toast({
        title: "Success!",
        description: `You have successfully rented ${listing.name} for ${durationDays} days!`,
      });

      loadListings();
    } catch (error: any) {
      console.error("Error renting NFT:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to rent NFT. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="relative z-10 border-b border-white/10 backdrop-blur-xl bg-background/80">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-8 h-8 text-primary" />
              <span className="text-xl font-bold glow-text">NFT Rental</span>
            </div>
            <WalletButton />
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{ backgroundImage: `url(${heroImage})` }}
        />
        <div className="relative container mx-auto px-6 py-20 text-center">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-7xl font-bold mb-6 glow-text bg-gradient-to-r from-white to-accent bg-clip-text text-transparent">
              Rent NFTs on Solana
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              The first decentralized NFT rental marketplace. Earn passive income from your NFTs or rent utility NFTs without buying.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                variant="hero" 
                size="lg" 
                className="gap-2"
                onClick={() => {
                  if (!user) {
                    navigate('/auth');
                  } else if (connected) {
                    setActiveTab('list');
                    document.querySelector('[data-section="marketplace"]')?.scrollIntoView({ 
                      behavior: 'smooth',
                      block: 'start'
                    });
                  } else {
                    toast({
                      title: "Connect Wallet Required",
                      description: "Please connect your Solana wallet to list your NFT for rent",
                      variant: "destructive",
                    });
                  }
                }}
              >
                <Plus className="w-5 h-5" />
                {user ? 'List Your NFT' : 'Sign In to List'}
                <ArrowRight className="w-5 h-5" />
              </Button>
              <Button 
                variant="glass" 
                size="lg" 
                className="gap-2"
                onClick={() => {
                  setActiveTab('marketplace');
                  // Scroll to marketplace section
                  document.querySelector('[data-section="marketplace"]')?.scrollIntoView({ 
                    behavior: 'smooth',
                    block: 'start'
                  });
                }}
              >
                Explore Marketplace
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 border-b border-white/10">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="card-glass text-center">
              <CardContent className="p-6">
                <div className="flex items-center justify-center mb-4">
                  <TrendingUp className="w-8 h-8 text-accent" />
                </div>
                <div className="text-3xl font-bold text-accent mb-2">{stats.totalListings}</div>
                <div className="text-muted-foreground">Total Listings</div>
              </CardContent>
            </Card>
            
            <Card className="card-glass text-center">
              <CardContent className="p-6">
                <div className="flex items-center justify-center mb-4">
                  <Users className="w-8 h-8 text-accent" />
                </div>
                <div className="text-3xl font-bold text-accent mb-2">{stats.activeRentals}</div>
                <div className="text-muted-foreground">Active Rentals</div>
              </CardContent>
            </Card>
            
            <Card className="card-glass text-center">
              <CardContent className="p-6">
                <div className="flex items-center justify-center mb-4">
                  <Zap className="w-8 h-8 text-accent" />
                </div>
                <div className="text-3xl font-bold text-accent mb-2">{stats.totalVolume.toFixed(1)}</div>
                <div className="text-muted-foreground">SOL Volume</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16" data-section="marketplace">
        <div className="container mx-auto px-6">
          {!user ? (
            <Card className="card-glass max-w-md mx-auto text-center">
              <CardContent className="p-8">
                <Shield className="w-16 h-16 text-accent mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Sign In Required</h3>
                <p className="text-muted-foreground mb-6">
                  Sign in to start renting or listing NFTs on the marketplace
                </p>
                <Button onClick={() => navigate('/auth')}>
                  Sign In
                </Button>
              </CardContent>
            </Card>
          ) : !connected ? (
            <Card className="card-glass max-w-md mx-auto text-center">
              <CardContent className="p-8">
                <Shield className="w-16 h-16 text-accent mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Connect Your Wallet</h3>
                <p className="text-muted-foreground mb-6">
                  Connect your Solana wallet to start renting or listing NFTs
                </p>
                <WalletButton />
              </CardContent>
            </Card>
          ) : (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full max-w-2xl mx-auto grid-cols-4 mb-8">
                <TabsTrigger value="marketplace">Marketplace</TabsTrigger>
                <TabsTrigger value="my-rentals">My Rentals</TabsTrigger>
                <TabsTrigger value="my-listings">My Listings</TabsTrigger>
                <TabsTrigger value="list">List NFT</TabsTrigger>
              </TabsList>
              
              <TabsContent value="marketplace" className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold">Available NFTs</h2>
                  <Badge variant="secondary" className="gap-2">
                    <Clock className="w-4 h-4" />
                    {listings.filter(l => l.active).length} Available
                  </Badge>
                </div>
                
                {loading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Card key={i} className="card-glass">
                        <CardContent className="p-6">
                          <div className="animate-pulse space-y-4">
                            <div className="bg-muted rounded-lg h-48 w-full"></div>
                            <div className="space-y-2">
                              <div className="bg-muted rounded h-4 w-3/4"></div>
                              <div className="bg-muted rounded h-4 w-1/2"></div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {listings.map((listing) => (
                        <NFTCard
                          key={listing.id}
                          listing={listing}
                          onRent={handleRentNFT}
                        />
                      ))}
                    </div>
                    
                    {listings.length === 0 && (
                      <Card className="card-glass text-center py-16">
                        <CardContent>
                          <Sparkles className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                          <h3 className="text-xl font-semibold mb-2">No NFTs Listed Yet</h3>
                          <p className="text-muted-foreground">Be the first to list an NFT for rent!</p>
                        </CardContent>
                      </Card>
                    )}
                  </>
                )}
              </TabsContent>
              
              <TabsContent value="my-rentals">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold">My Rentals</h2>
                  </div>
                  <MyRentals />
                </div>
              </TabsContent>
              
              <TabsContent value="my-listings">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold">My Listings</h2>
                  </div>
                  <MyListings />
                </div>
              </TabsContent>

              <TabsContent value="list">
                <ListNFTForm onSubmit={handleListNFT} />
              </TabsContent>
            </Tabs>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 border-t border-white/10">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Why Choose NFT Rental?</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Revolutionary Web3 infrastructure for NFT rentals with trustless escrow and automatic settlements.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="card-glass">
              <CardContent className="p-6 text-center">
                <Shield className="w-12 h-12 text-accent mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Secure Escrow</h3>
                <p className="text-muted-foreground">
                  Smart contracts handle collateral and payments automatically with built-in dispute resolution.
                </p>
              </CardContent>
            </Card>
            
            <Card className="card-glass">
              <CardContent className="p-6 text-center">
                <Clock className="w-12 h-12 text-accent mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Flexible Terms</h3>
                <p className="text-muted-foreground">
                  Set your own rental periods, pricing, and collateral requirements for maximum flexibility.
                </p>
              </CardContent>
            </Card>
            
            <Card className="card-glass">
              <CardContent className="p-6 text-center">
                <TrendingUp className="w-12 h-12 text-accent mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Passive Income</h3>
                <p className="text-muted-foreground">
                  Earn consistent returns from your idle NFTs while maintaining full ownership rights.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;