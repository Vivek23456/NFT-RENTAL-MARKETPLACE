-- Drop the overly permissive policy that allows public access to all profiles
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

-- Create a more secure policy that allows:
-- 1. Users to view their own profile
-- 2. NFT owners to view profiles of users who have rented their NFTs
-- 3. Prevents general public access to all profiles
CREATE POLICY "Users can view own profile and renters of their NFTs" 
ON public.profiles 
FOR SELECT 
USING (
  auth.uid() = id OR 
  auth.uid() IN (
    SELECT nl.owner_id 
    FROM nft_listings nl
    JOIN rentals r ON nl.id = r.listing_id
    WHERE r.renter_id = profiles.id
  )
);