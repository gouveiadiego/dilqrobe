-- Add transfer columns to transactions table
ALTER TABLE transactions
ADD COLUMN transfer_id uuid,
ADD COLUMN is_transfer boolean DEFAULT false,
ADD COLUMN transfer_destination_account_id uuid REFERENCES bank_accounts(id);

-- Add index for better performance on transfer queries
CREATE INDEX idx_transactions_transfer_id ON transactions(transfer_id) WHERE transfer_id IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN transactions.transfer_id IS 'UUID linking two paired transactions (one withdrawal, one deposit)';
COMMENT ON COLUMN transactions.is_transfer IS 'Flag to identify transfer transactions';
COMMENT ON COLUMN transactions.transfer_destination_account_id IS 'Reference to the destination account for transfers';