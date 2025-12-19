-- Add claimed columns to reward_transactions for tracking claim status
ALTER TABLE public.reward_transactions 
ADD COLUMN IF NOT EXISTS claimed boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS claimed_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS claim_tx_hash text;

-- Create index for faster unclaimed rewards lookup
CREATE INDEX IF NOT EXISTS idx_reward_transactions_unclaimed 
ON public.reward_transactions(user_id, claimed) 
WHERE claimed = false;

-- Create claim_requests table to track claim transactions
CREATE TABLE IF NOT EXISTS public.claim_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  amount numeric NOT NULL,
  wallet_address text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  tx_hash text,
  error_message text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  processed_at timestamp with time zone
);

-- Enable RLS
ALTER TABLE public.claim_requests ENABLE ROW LEVEL SECURITY;

-- RLS policies for claim_requests
CREATE POLICY "Users can view their own claim requests"
ON public.claim_requests FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own claim requests"
ON public.claim_requests FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Index for claim_requests
CREATE INDEX IF NOT EXISTS idx_claim_requests_user_status 
ON public.claim_requests(user_id, status);