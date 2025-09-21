-- Delete existing example listings and create diverse new ones
DELETE FROM public.nft_listings WHERE owner_id IS NULL;

-- Insert diverse NFT examples
INSERT INTO public.nft_listings (
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
  'ABC123XYZ789DEF456',
  'Cosmic Warrior #888',
  'Elite space warrior with plasma armor and quantum weapons. Rare legendary tier NFT from the Galactic Heroes collection.',
  'https://images.unsplash.com/photo-1614730321146-b6fa6a46bcb4?w=400&h=400&fit=crop&crop=center',
  150000000,
  1500000000,
  172800,
  1209600,
  true
),
(
  'GHI789JKL012MNO345',
  'Cyberpunk Cat #2077', 
  'Neon-enhanced feline with neural implants roaming Neo Tokyo streets. Perfect for cyberpunk gaming worlds.',
  'https://images.unsplash.com/photo-1574158622682-e40e69881006?w=400&h=400&fit=crop&crop=center',
  80000000,
  800000000,
  86400,
  604800,
  true
),
(
  'PQR456STU789VWX012',
  'Ancient Rune Stone #42',
  'Mystical artifact containing powerful enchantments. Grants special abilities in fantasy RPG games.',
  'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=400&fit=crop&crop=center',
  300000000,
  3000000000,
  432000,
  2592000,
  false
),
(
  'YZA123BCD456EFG789',
  'Digital Samurai #1337',
  'Honor-bound warrior wielding a plasma katana. Exclusive access to premium samurai guilds and tournaments.',
  'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&h=400&fit=crop&crop=center',
  250000000,
  2500000000,
  259200,
  1728000,
  true
);