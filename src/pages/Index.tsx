import { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { getAssociatedTokenAddress } from '@solana/spl-token';
import { PublicKey } from '@solana/web3.js';
import {
  acceptSwapOffer,
  buySaleNFT,
  cancelSaleNFT,
  cancelSwapOffer,
  createSwapOffer,
  fetchRentalListings,
  fetchSaleListings,
  fetchSwapOffers,
  getProgram,
  listRentalNFT,
  listSaleNFT,
  rentNFT,
  toLamports,
} from '@/lib/anchor';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import WalletButton from '@/components/WalletButton';
import NFTCard from '@/components/NFTCard';
import ListNFTForm, { ListingFormData } from '@/components/ListNFTForm';
import { useToast } from '@/hooks/use-toast';
import { Clock, Shield, Sparkles } from 'lucide-react';

const Index = () => {
  const { connected, publicKey, signTransaction, signAllTransactions } = useWallet();
  const { connection } = useConnection();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('rentals');
  const [rentalListings, setRentalListings] = useState<any[]>([]);
  const [saleListings, setSaleListings] = useState<any[]>([]);
  const [swapOffers, setSwapOffers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saleForm, setSaleForm] = useState({ mint: '', priceSol: '0.1' });
  const [swapForm, setSwapForm] = useState({ makerMint: '', takerMint: '', makerSolDelta: '0' });

  const program = useMemo(() => {
    if (!connected || !publicKey || !signTransaction || !signAllTransactions) return null;
    return getProgram(connection, { publicKey, signTransaction, signAllTransactions } as any);
  }, [connected, publicKey, signTransaction, signAllTransactions, connection]);

  const loadOnChainState = async () => {
    if (!program) return;
    try {
      const [rentals, sales, swaps] = await Promise.all([
        fetchRentalListings(program),
        fetchSaleListings(program),
        fetchSwapOffers(program),
      ]);

      setRentalListings(
        rentals.map((entry) => ({
          id: entry.publicKey.toBase58(),
          owner: entry.account.owner.toBase58(),
          mint: entry.account.mint.toBase58(),
          name: `Rental ${entry.account.mint.toBase58().slice(0, 6)}`,
          image: 'https://via.placeholder.com/400x400?text=Rental+NFT',
          dailyRentLamports: entry.account.dailyRentLamports.toNumber(),
          collateralLamports: entry.account.collateralLamports.toNumber(),
          minDurationSecs: entry.account.minDurationDays * 86400,
          maxDurationSecs: entry.account.maxDurationDays * 86400,
          active: entry.account.isActive,
        }))
      );
      setSaleListings(
        sales.map((entry) => ({
          id: entry.publicKey.toBase58(),
          mint: entry.account.mint.toBase58(),
          seller: entry.account.seller.toBase58(),
          priceLamports: entry.account.priceLamports.toNumber(),
          active: entry.account.isActive,
        }))
      );
      setSwapOffers(
        swaps.map((entry) => ({
          id: entry.publicKey.toBase58(),
          makerMint: entry.account.makerMint.toBase58(),
          takerMint: entry.account.takerMint.toBase58(),
          maker: entry.account.maker.toBase58(),
          makerSolDeltaLamports: entry.account.makerSolDeltaLamports.toNumber(),
        }))
      );
    } catch (error) {
      console.error(error);
      toast({ title: 'Error', description: 'Failed to load on-chain state', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOnChainState();
  }, [program]);

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

    try {
      if (!program || !publicKey) throw new Error('Wallet not connected');
      const mint = new PublicKey(formData.mintAddress);
      const ownerTokenAccount = await getAssociatedTokenAddress(mint, publicKey);
      await listRentalNFT(
        program,
        mint,
        ownerTokenAccount,
        toLamports(formData.dailyRentSOL),
        toLamports(formData.collateralSOL),
        formData.minDurationDays,
        formData.maxDurationDays
      );
      toast({ title: 'Success!', description: 'NFT listed for rental on-chain.' });
      await loadOnChainState();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to list rental', variant: 'destructive' });
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

    try {
      if (!program) throw new Error('Wallet not connected');
      const listing = rentalListings.find((l) => l.id === listingId);
      if (!listing) throw new Error('Listing not found');
      await rentNFT(program, new PublicKey(listing.mint), new PublicKey(listing.owner), durationDays);
      toast({ title: 'Success!', description: 'Rental transaction confirmed.' });
      await loadOnChainState();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to rent NFT', variant: 'destructive' });
    }
  };

  const handleListSale = async () => {
    try {
      if (!program || !publicKey) throw new Error('Wallet not connected');
      const mint = new PublicKey(saleForm.mint);
      const ownerTokenAccount = await getAssociatedTokenAddress(mint, publicKey);
      await listSaleNFT(program, mint, ownerTokenAccount, toLamports(Number(saleForm.priceSol)));
      toast({ title: 'Success!', description: 'Sale listing created on-chain.' });
      await loadOnChainState();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to list sale', variant: 'destructive' });
    }
  };

  const handleBuySale = async (mint: string, seller: string) => {
    try {
      if (!program) throw new Error('Wallet not connected');
      await buySaleNFT(program, new PublicKey(mint), new PublicKey(seller));
      toast({ title: 'Success!', description: 'Sale purchase completed.' });
      await loadOnChainState();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to buy sale listing', variant: 'destructive' });
    }
  };

  const handleCancelSale = async (mint: string) => {
    try {
      if (!program) throw new Error('Wallet not connected');
      await cancelSaleNFT(program, new PublicKey(mint));
      toast({ title: 'Success!', description: 'Sale listing cancelled.' });
      await loadOnChainState();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to cancel sale', variant: 'destructive' });
    }
  };

  const handleCreateSwap = async () => {
    try {
      if (!program || !publicKey) throw new Error('Wallet not connected');
      const makerMint = new PublicKey(swapForm.makerMint);
      const takerMint = new PublicKey(swapForm.takerMint);
      const makerTokenAccount = await getAssociatedTokenAddress(makerMint, publicKey);
      await createSwapOffer(
        program,
        makerMint,
        takerMint,
        makerTokenAccount,
        toLamports(Number(swapForm.makerSolDelta))
      );
      toast({ title: 'Success!', description: 'Swap offer posted on-chain.' });
      await loadOnChainState();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to create swap', variant: 'destructive' });
    }
  };

  const handleAcceptSwap = async (makerMint: string, takerMint: string) => {
    try {
      if (!program || !publicKey) throw new Error('Wallet not connected');
      const takerTokenAccount = await getAssociatedTokenAddress(new PublicKey(takerMint), publicKey);
      await acceptSwapOffer(program, new PublicKey(makerMint), new PublicKey(takerMint), takerTokenAccount);
      toast({ title: 'Success!', description: 'Swap accepted.' });
      await loadOnChainState();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to accept swap', variant: 'destructive' });
    }
  };

  const handleCancelSwap = async (makerMint: string) => {
    try {
      if (!program) throw new Error('Wallet not connected');
      await cancelSwapOffer(program, new PublicKey(makerMint));
      toast({ title: 'Success!', description: 'Swap cancelled.' });
      await loadOnChainState();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to cancel swap', variant: 'destructive' });
    }
  };

  return (
    <div className="min-h-screen">
      <nav className="relative z-10 border-b border-primary/15 backdrop-blur-xl bg-background/85">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary drop-shadow-[0_0_8px_hsl(158_100%_45%/0.5)]" />
            <span className="text-lg font-bold tracking-tight">On-chain NFT Market</span>
          </div>
          <WalletButton />
        </div>
      </nav>

      <section className="py-16">
        <div className="container mx-auto px-6">
          {!user ? (
            <Card className="card-glass max-w-md mx-auto text-center">
              <CardContent className="p-8">
                <Shield className="w-16 h-16 text-accent mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Wallet sign-in</h3>
                <p className="text-muted-foreground mb-6">
                  Connect your Solana wallet, then tap <span className="text-foreground font-medium">Sign in</span> in the header to sign the message and unlock the marketplace.
                </p>
                <Button onClick={() => navigate('/auth')}>Open sign-in</Button>
              </CardContent>
            </Card>
          ) : (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full max-w-3xl mx-auto grid-cols-5 mb-8">
                <TabsTrigger value="rentals">Rentals</TabsTrigger>
                <TabsTrigger value="list-rental">List Rental</TabsTrigger>
                <TabsTrigger value="sales">Sales</TabsTrigger>
                <TabsTrigger value="list-sale">List Sale</TabsTrigger>
                <TabsTrigger value="swaps">Swaps</TabsTrigger>
              </TabsList>
              
              <TabsContent value="rentals" className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold">Rental Listings</h2>
                  <Badge variant="secondary" className="gap-2">
                    <Clock className="w-4 h-4" />
                    {rentalListings.length} Active
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
                      {rentalListings.map((listing) => (
                        <NFTCard
                          key={listing.id}
                          listing={listing}
                          onRent={handleRentNFT}
                        />
                      ))}
                    </div>
                    
                    {rentalListings.length === 0 && (
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

              <TabsContent value="list-rental">
                <ListNFTForm onSubmit={handleListNFT} />
              </TabsContent>

              <TabsContent value="sales" className="space-y-4">
                {saleListings.map((sale) => (
                  <Card key={sale.id} className="card-glass">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div>
                        <p className="font-medium">Mint: {sale.mint}</p>
                        <p className="text-sm text-muted-foreground">Price: {sale.priceLamports / 1_000_000_000} SOL</p>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => handleBuySale(sale.mint, sale.seller)}>Buy</Button>
                        <Button size="sm" variant="outline" onClick={() => handleCancelSale(sale.mint)}>Cancel</Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {saleListings.length === 0 && <p className="text-muted-foreground">No active sale listings.</p>}
              </TabsContent>

              <TabsContent value="list-sale">
                <Card className="card-glass">
                  <CardContent className="p-6 space-y-4">
                    <div>
                      <Label htmlFor="saleMint">NFT Mint</Label>
                      <Input
                        id="saleMint"
                        value={saleForm.mint}
                        onChange={(e) => setSaleForm((s) => ({ ...s, mint: e.target.value }))}
                        placeholder="Mint address"
                      />
                    </div>
                    <div>
                      <Label htmlFor="salePrice">Price (SOL)</Label>
                      <Input
                        id="salePrice"
                        value={saleForm.priceSol}
                        onChange={(e) => setSaleForm((s) => ({ ...s, priceSol: e.target.value }))}
                      />
                    </div>
                    <Button onClick={handleListSale}>List for Sale</Button>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="swaps" className="space-y-4">
                <Card className="card-glass">
                  <CardContent className="p-6 space-y-4">
                    <div>
                      <Label>Maker Mint</Label>
                      <Input
                        value={swapForm.makerMint}
                        onChange={(e) => setSwapForm((s) => ({ ...s, makerMint: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label>Taker Mint</Label>
                      <Input
                        value={swapForm.takerMint}
                        onChange={(e) => setSwapForm((s) => ({ ...s, takerMint: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label>Extra SOL paid by taker</Label>
                      <Input
                        value={swapForm.makerSolDelta}
                        onChange={(e) => setSwapForm((s) => ({ ...s, makerSolDelta: e.target.value }))}
                      />
                    </div>
                    <Button onClick={handleCreateSwap}>Create Swap Offer</Button>
                  </CardContent>
                </Card>

                {swapOffers.map((offer) => (
                  <Card key={offer.id} className="card-glass">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="text-sm">
                        <p>Maker mint: {offer.makerMint}</p>
                        <p>Taker mint: {offer.takerMint}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => handleAcceptSwap(offer.makerMint, offer.takerMint)}>Accept</Button>
                        <Button size="sm" variant="outline" onClick={() => handleCancelSwap(offer.makerMint)}>Cancel</Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>
            </Tabs>
          )}
        </div>
      </section>
    </div>
  );
};

export default Index;