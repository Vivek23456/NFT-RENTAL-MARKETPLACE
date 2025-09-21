-- Make owner_id nullable for demo data
ALTER TABLE public.nft_listings 
ALTER COLUMN owner_id DROP NOT NULL;

-- Update policies to handle demo data (null owner_id)
DROP POLICY IF EXISTS "Anyone can view active listings" ON public.nft_listings;
DROP POLICY IF EXISTS "Users can view their own listings" ON public.nft_listings;

-- Create new policy that allows viewing all active listings and user's own listings
CREATE POLICY "Anyone can view active listings and users can view their own" 
ON public.nft_listings 
FOR SELECT 
USING (active = true OR auth.uid() = owner_id);

-- Insert example NFT listings with null owner_id for demo
INSERT INTO public.nft_listings (
  owner_id, 
  mint_address, 
  name, 
  description, 
  image_url, 
  daily_rent_lamports, 
  collateral_lamports, 
  min_duration_secs, 
  max_duration_secs, 
  active
) VALUES 
(
  NULL,
  'DEF456GHI789JKL012',
  'Cool Ape #1234',
  'A rare and valuable ape NFT from the prestigious Cool Apes collection. Features unique traits and vibrant colors.',
  '/src/assets/cool-ape-nft.jpg',
  100000000,
  1000000000,
  86400,
  2592000,
  true
),
(
  NULL,
  'JKL012MNO345PQR678',
  'Pixel Dragon #567', 
  'Mythical pixel dragon with fire-breathing abilities. Perfect for gaming and metaverse adventures.',
  '/src/assets/pixel-dragon-nft.jpg',
  200000000,
  2000000000,
  259200,
  1296000,
  false
);