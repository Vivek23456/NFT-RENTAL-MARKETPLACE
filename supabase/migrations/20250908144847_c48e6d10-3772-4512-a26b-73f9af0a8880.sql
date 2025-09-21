-- Drop existing foreign key constraint first
ALTER TABLE public.nft_listings 
DROP CONSTRAINT IF EXISTS nft_listings_owner_id_fkey;

-- Drop the conflicting RLS policies
DROP POLICY IF EXISTS "Anyone can view active listings" ON public.nft_listings;
DROP POLICY IF EXISTS "Anyone can view active listings and users can view their own" ON public.nft_listings;

-- Update existing null owner_id records (temporary fix)
UPDATE public.nft_listings SET owner_id = gen_random_uuid() WHERE owner_id IS NULL;

-- Make owner_id NOT NULL to prevent security bypasses
ALTER TABLE public.nft_listings ALTER COLUMN owner_id SET NOT NULL;

-- Create a single, secure RLS policy for SELECT
CREATE POLICY "Users can view active listings and their own listings" 
ON public.nft_listings 
FOR SELECT 
USING (
  active = true OR auth.uid() = owner_id
);

-- Recreate proper policies
DROP POLICY IF EXISTS "Users can create their own listings" ON public.nft_listings;
CREATE POLICY "Users can create their own listings" 
ON public.nft_listings 
FOR INSERT 
WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Users can update their own listings" ON public.nft_listings;
CREATE POLICY "Users can update their own listings" 
ON public.nft_listings 
FOR UPDATE 
USING (auth.uid() = owner_id)
WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Users can delete their own listings" ON public.nft_listings;
CREATE POLICY "Users can delete their own listings" 
ON public.nft_listings 
FOR DELETE 
USING (auth.uid() = owner_id);