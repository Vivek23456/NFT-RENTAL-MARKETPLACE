import { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { BN } from '@coral-xyz/anchor';
import { getAssociatedTokenAddress } from '@solana/spl-token';
import { PublicKey } from '@solana/web3.js';
import {
  acceptSwapOffer,
  buySaleNFT,
  cancelSaleNFT,
  cancelSwapOffer,
  claimExpiredRentalNft,
  createSwapOffer,
  fetchRentalListings,
  fetchSaleListings,
  fetchSwapOffers,
  getProgram,
  listRentalNFT,
  listSaleNFT,
  rentNFT,
  returnRentalNft,
  toLamports,
  unlistRentalNft,
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
import MarketplaceExplore from '@/components/MarketplaceExplore';
import type { DemoMarketNft } from '@/data/demoMarketplace';
import { useToast } from '@/hooks/use-toast';
import { Clock, Github, Shield, Sparkles } from 'lucide-react';
import { GITHUB_REPO_URL } from '@/lib/github';

const Index = () => {
  const { connected, publicKey, signTransaction, signAllTransactions } = useWallet();
  const { connection } = useConnection();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('explore');
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
        rentals.map((entry) => {
          const end = entry.account.rentalEndTime;
          const rentalEndTimeUnix = end == null ? null : new BN(end as BN).toNumber();
          const cr = entry.account.currentRenter;
          const currentRenter =
            cr == null
              ? null
              : typeof (cr as PublicKey).toBase58 === 'function'
                ? (cr as PublicKey).toBase58()
                : new PublicKey(cr as string).toBase58();
          return {
            id: entry.publicKey.toBase58(),
            owner: entry.account.owner.toBase58(),
            mint: entry.account.mint.toBase58(),
            name: `Rental ${entry.account.mint.toBase58().slice(0, 6)}`,
            image: 'https://via.placeholder.com/400x400?text=Rental+NFT',
            dailyRentLamports: entry.account.dailyRentLamports.toNumber(),
            collateralLamports: entry.account.collateralLamports.toNumber(),
            minDurationSecs: entry.account.minDurationDays * 86400,
            maxDurationSecs: entry.account.maxDurationDays * 86400,
            active: entry.account.isActive && currentRenter == null,
            currentRenter,
            rentalEndTimeUnix,
          };
        })
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
    if (!program) {
      setLoading(false);
      return;
    }
    setLoading(true);
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

  const handleReturnRental = async (mintStr: string) => {
    if (!user) {
      navigate('/auth');
      return;
    }
    try {
      if (!program) throw new Error('Wallet not connected');
      await returnRentalNft(program, new PublicKey(mintStr));
      toast({ title: 'Rental ended', description: 'Collateral was sent back to your wallet.' });
      await loadOnChainState();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to end rental', variant: 'destructive' });
    }
  };

  const handleClaimExpiredRental = async (mintStr: string) => {
    if (!user) {
      navigate('/auth');
      return;
    }
    try {
      if (!program) throw new Error('Wallet not connected');
      await claimExpiredRentalNft(program, new PublicKey(mintStr));
      toast({ title: 'Claimed', description: 'NFT and collateral returned to your wallet. Listing closed.' });
      await loadOnChainState();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to claim expired rental', variant: 'destructive' });
    }
  };

  const handleUnlistRental = async (mintStr: string) => {
    if (!user) {
      navigate('/auth');
      return;
    }
    try {
      if (!program) throw new Error('Wallet not connected');
      await unlistRentalNft(program, new PublicKey(mintStr));
      toast({ title: 'Listing removed', description: 'NFT returned from escrow to your wallet.' });
      await loadOnChainState();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to remove listing', variant: 'destructive' });
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

  const handleDemoBuy = (nft: DemoMarketNft) => {
    toast({
      title: 'Demo listing',
      description: `${nft.name} is showcase-only. List a real NFT under List Sale / List Rental to trade with SOL on-chain.`,
    });
  };

  const gatedNotice = (
    <Card className="card-glass max-w-md mx-auto text-center">
      <CardContent className="p-8">
        <Shield className="w-14 h-14 text-primary mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Sign in required</h3>
        <p className="text-muted-foreground mb-6 text-sm">
          Connect your wallet and complete sign-in to use on-chain rentals, sales, and swaps.
        </p>
        <Button onClick={() => navigate('/auth')}>Open sign-in</Button>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen">
      <nav className="relative z-10 border-b border-primary/15 backdrop-blur-xl bg-background/85">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary drop-shadow-[0_0_8px_hsl(158_100%_45%/0.5)]" />
            <div className="flex flex-col leading-tight">
              <span className="text-lg font-bold tracking-tight">On-chain NFT Market</span>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-primary">Demo</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-2" asChild>
              <a href={GITHUB_REPO_URL} target="_blank" rel="noopener noreferrer">
                <Github className="h-4 w-4" />
                GitHub
              </a>
            </Button>
            <WalletButton />
          </div>
        </div>
      </nav>

      <section className="py-10 md:py-16">
        <div className="container mx-auto px-4 sm:px-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="mb-8 flex h-auto min-h-11 w-full max-w-5xl mx-auto flex-wrap justify-center gap-1 rounded-full border border-primary/10 bg-muted/80 p-1">
              <TabsTrigger value="explore" className="rounded-full px-3 py-2 text-xs sm:text-sm">
                Explore
              </TabsTrigger>
              <TabsTrigger value="rentals" className="rounded-full px-3 py-2 text-xs sm:text-sm">
                Rentals
              </TabsTrigger>
              <TabsTrigger value="list-rental" className="rounded-full px-3 py-2 text-xs sm:text-sm">
                List Rental
              </TabsTrigger>
              <TabsTrigger value="sales" className="rounded-full px-3 py-2 text-xs sm:text-sm">
                Sales
              </TabsTrigger>
              <TabsTrigger value="list-sale" className="rounded-full px-3 py-2 text-xs sm:text-sm">
                List Sale
              </TabsTrigger>
              <TabsTrigger value="swaps" className="rounded-full px-3 py-2 text-xs sm:text-sm">
                Swaps
              </TabsTrigger>
            </TabsList>

            <TabsContent value="explore" className="mt-0">
              <MarketplaceExplore onDemoBuy={handleDemoBuy} />
            </TabsContent>

            {!user ? (
              <>
                <TabsContent value="rentals">{gatedNotice}</TabsContent>
                <TabsContent value="list-rental">{gatedNotice}</TabsContent>
                <TabsContent value="sales">{gatedNotice}</TabsContent>
                <TabsContent value="list-sale">{gatedNotice}</TabsContent>
                <TabsContent value="swaps">{gatedNotice}</TabsContent>
              </>
            ) : (
              <>
              <TabsContent value="rentals" className="space-y-6">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">On-chain rentals</h2>
                    <p className="text-sm text-muted-foreground">
                      Rent from other wallets on devnet, or manage your own listings (return, claim after expiry, unlist).
                    </p>
                  </div>
                  <Badge variant="secondary" className="gap-2 shrink-0">
                    <Clock className="w-4 h-4" />
                    {rentalListings.length} listing{rentalListings.length === 1 ? '' : 's'}
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
                          viewerWallet={publicKey?.toBase58() ?? null}
                          onRent={handleRentNFT}
                          onReturnRental={handleReturnRental}
                          onClaimExpired={handleClaimExpiredRental}
                          onUnlistRental={handleUnlistRental}
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
              </>
            )}
          </Tabs>
        </div>
      </section>
    </div>
  );
};

export default Index;