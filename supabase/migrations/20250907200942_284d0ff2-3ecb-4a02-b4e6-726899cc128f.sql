-- Update RLS policy to allow viewing example listings without owner
DROP POLICY IF EXISTS "Anyone can view active listings" ON public.nft_listings;

CREATE POLICY "Anyone can view active listings" 
ON public.nft_listings 
FOR SELECT 
USING (active = true OR owner_id IS NULL);

-- Insert example NFT listings without owner references
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