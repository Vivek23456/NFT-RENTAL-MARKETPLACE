-- PHASE 1 & 2: Fix Database Security Issues

-- First, drop the conflicting RLS policies
DROP POLICY IF EXISTS "Anyone can view active listings" ON public.nft_listings;
DROP POLICY IF EXISTS "Anyone can view active listings and users can view their own" ON public.nft_listings;

-- Update existing null owner_id records (temporary fix - will need proper user association later)
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

-- Ensure proper INSERT policy (already exists but let's recreate for clarity)
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

-- Create profiles table for user data
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  wallet_address text UNIQUE,
  display_name text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
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

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data ->> 'name', NEW.email));
  RETURN NEW;
END;
$$;

-- Trigger to create profile when user signs up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Add foreign key constraint to link nft_listings to profiles
ALTER TABLE public.nft_listings 
ADD CONSTRAINT fk_nft_listings_owner 
FOREIGN KEY (owner_id) REFERENCES public.profiles(id) ON DELETE CASCADE;