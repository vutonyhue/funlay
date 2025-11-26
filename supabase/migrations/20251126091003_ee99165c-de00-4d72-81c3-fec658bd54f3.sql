-- Add wallet_type column to profiles table to store MetaMask or Bitget Wallet
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS wallet_type TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.wallet_type IS 'Type of connected wallet: MetaMask or Bitget';

-- Add index on to_address for faster received transaction queries
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_to_address 
ON public.wallet_transactions(to_address);

-- Add index on created_at for sorting transactions by date
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_created_at 
ON public.wallet_transactions(created_at DESC);