-- PHASE 1 & 2: Fix Database Security Issues (Simplified)

-- First, drop the conflicting RLS policies
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

-- Ensure proper INSERT policy
DROP POLICY IF EXISTS "Users can create their own listings" ON public.nft_listings;
CREATE POLICY "Users can create their own listings" 
ON public.nft_listings 
FOR INSERT 
WITH CHECK (auth.uid() = owner_id);

-- Ensure proper UPDATE policy  
DROP POLICY IF EXISTS "Users can update their own listings" ON public.nft_listings;
CREATE POLICY "Users can update their own listings" 
ON public.nft_listings 
FOR UPDATE 
USING (auth.uid() = owner_id)
WITH CHECK (auth.uid() = owner_id);

-- Ensure proper DELETE policy
DROP POLICY IF EXISTS "Users can delete their own listings" ON public.nft_listings;
CREATE POLICY "Users can delete their own listings" 
ON public.nft_listings 
FOR DELETE 
USING (auth.uid() = owner_id);

-- Create profiles table for user data (without foreign key constraint initially)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid NOT NULL PRIMARY KEY,
  wallet_address text UNIQUE,
  display_name text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Users can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (true);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = id);

-- Create trigger for profiles updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();