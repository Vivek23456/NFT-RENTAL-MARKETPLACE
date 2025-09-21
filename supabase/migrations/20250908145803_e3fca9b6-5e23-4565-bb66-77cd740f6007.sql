-- Create rentals table to track NFT rentals
CREATE TABLE public.rentals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id UUID NOT NULL REFERENCES public.nft_listings(id) ON DELETE CASCADE,
  renter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_days INTEGER NOT NULL,
  daily_rent_lamports BIGINT NOT NULL,
  collateral_lamports BIGINT NOT NULL,
  total_cost_lamports BIGINT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.rentals ENABLE ROW LEVEL SECURITY;

-- Create policies for rentals table
CREATE POLICY "Users can view their own rentals and rentals of their listings" 
ON public.rentals 
FOR SELECT 
USING (
  auth.uid() = renter_id OR 
  auth.uid() IN (
    SELECT owner_id FROM public.nft_listings WHERE id = rentals.listing_id
  )
);

CREATE POLICY "Users can create rentals" 
ON public.rentals 
FOR INSERT 
WITH CHECK (auth.uid() = renter_id);

CREATE POLICY "Users can update their own rentals and rentals of their listings" 
ON public.rentals 
FOR UPDATE 
USING (
  auth.uid() = renter_id OR 
  auth.uid() IN (
    SELECT owner_id FROM public.nft_listings WHERE id = rentals.listing_id
  )
);

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_rentals_updated_at
BEFORE UPDATE ON public.rentals
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for better performance
CREATE INDEX idx_rentals_renter_id ON public.rentals(renter_id);
CREATE INDEX idx_rentals_listing_id ON public.rentals(listing_id);
CREATE INDEX idx_rentals_status ON public.rentals(status);
CREATE INDEX idx_rentals_end_date ON public.rentals(end_date);