-- Create NFT listings table
CREATE TABLE public.nft_listings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  mint_address TEXT NOT NULL,
  name TEXT,
  description TEXT,
  image_url TEXT,
  daily_rent_lamports BIGINT NOT NULL DEFAULT 0,
  collateral_lamports BIGINT NOT NULL DEFAULT 0,
  min_duration_secs INTEGER NOT NULL DEFAULT 86400,
  max_duration_secs INTEGER NOT NULL DEFAULT 2592000,
  active BOOLEAN NOT NULL DEFAULT true,
  current_rental_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.nft_listings ENABLE ROW LEVEL SECURITY;

-- Create policies for NFT listings
CREATE POLICY "Anyone can view active listings" 
ON public.nft_listings 
FOR SELECT 
USING (active = true);

CREATE POLICY "Users can view their own listings" 
ON public.nft_listings 
FOR SELECT 
USING (auth.uid() = owner_id);

CREATE POLICY "Users can create their own listings" 
ON public.nft_listings 
FOR INSERT 
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their own listings" 
ON public.nft_listings 
FOR UPDATE 
USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete their own listings" 
ON public.nft_listings 
FOR DELETE 
USING (auth.uid() = owner_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_nft_listings_updated_at
  BEFORE UPDATE ON public.nft_listings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();