-- Create bank_accounts table
CREATE TABLE public.bank_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  bank_name TEXT NOT NULL,
  account_type TEXT NOT NULL DEFAULT 'corrente',
  account_number TEXT,
  initial_balance NUMERIC NOT NULL DEFAULT 0,
  current_balance NUMERIC NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.bank_accounts ENABLE ROW LEVEL SECURITY;

-- Create policies for bank_accounts
CREATE POLICY "Users can view their own bank accounts" 
ON public.bank_accounts 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own bank accounts" 
ON public.bank_accounts 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bank accounts" 
ON public.bank_accounts 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own bank accounts" 
ON public.bank_accounts 
FOR DELETE 
USING (auth.uid() = user_id);

-- Add bank_account_id to transactions table
ALTER TABLE public.transactions 
ADD COLUMN bank_account_id UUID REFERENCES public.bank_accounts(id);

-- Create trigger for automatic timestamp updates on bank_accounts
CREATE TRIGGER update_bank_accounts_updated_at
BEFORE UPDATE ON public.bank_accounts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to update bank account balance
CREATE OR REPLACE FUNCTION public.update_bank_account_balance()
RETURNS TRIGGER AS $$
BEGIN
  -- Update current_balance when transactions are inserted, updated, or deleted
  IF TG_OP = 'INSERT' THEN
    IF NEW.bank_account_id IS NOT NULL THEN
      UPDATE public.bank_accounts 
      SET current_balance = initial_balance + COALESCE((
        SELECT SUM(amount) 
        FROM public.transactions 
        WHERE bank_account_id = NEW.bank_account_id 
        AND user_id = NEW.user_id
      ), 0)
      WHERE id = NEW.bank_account_id AND user_id = NEW.user_id;
    END IF;
    RETURN NEW;
  END IF;
  
  IF TG_OP = 'UPDATE' THEN
    -- Update balance for old account if it changed
    IF OLD.bank_account_id IS NOT NULL AND OLD.bank_account_id != COALESCE(NEW.bank_account_id, OLD.bank_account_id) THEN
      UPDATE public.bank_accounts 
      SET current_balance = initial_balance + COALESCE((
        SELECT SUM(amount) 
        FROM public.transactions 
        WHERE bank_account_id = OLD.bank_account_id 
        AND user_id = OLD.user_id
      ), 0)
      WHERE id = OLD.bank_account_id AND user_id = OLD.user_id;
    END IF;
    
    -- Update balance for new account
    IF NEW.bank_account_id IS NOT NULL THEN
      UPDATE public.bank_accounts 
      SET current_balance = initial_balance + COALESCE((
        SELECT SUM(amount) 
        FROM public.transactions 
        WHERE bank_account_id = NEW.bank_account_id 
        AND user_id = NEW.user_id
      ), 0)
      WHERE id = NEW.bank_account_id AND user_id = NEW.user_id;
    END IF;
    RETURN NEW;
  END IF;
  
  IF TG_OP = 'DELETE' THEN
    IF OLD.bank_account_id IS NOT NULL THEN
      UPDATE public.bank_accounts 
      SET current_balance = initial_balance + COALESCE((
        SELECT SUM(amount) 
        FROM public.transactions 
        WHERE bank_account_id = OLD.bank_account_id 
        AND user_id = OLD.user_id
      ), 0)
      WHERE id = OLD.bank_account_id AND user_id = OLD.user_id;
    END IF;
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for bank account balance updates
CREATE TRIGGER update_bank_balance_on_transaction_change
AFTER INSERT OR UPDATE OR DELETE ON public.transactions
FOR EACH ROW
EXECUTE FUNCTION public.update_bank_account_balance();