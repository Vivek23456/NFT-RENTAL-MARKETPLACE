-- Insert example NFT listings
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
  '00000000-0000-0000-0000-000000000001',
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
  '00000000-0000-0000-0000-000000000002',
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