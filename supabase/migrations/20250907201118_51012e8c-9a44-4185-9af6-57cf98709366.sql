-- Update image URLs to use proper asset imports
UPDATE public.nft_listings 
SET image_url = CASE 
  WHEN name = 'Cool Ape #1234' THEN 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=400&fit=crop&crop=faces'
  WHEN name = 'Pixel Dragon #567' THEN 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&h=400&fit=crop&crop=center'
  ELSE image_url
END
WHERE name IN ('Cool Ape #1234', 'Pixel Dragon #567');