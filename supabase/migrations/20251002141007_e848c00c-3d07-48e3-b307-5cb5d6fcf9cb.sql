-- Add recurrence_type column to transactions table
ALTER TABLE transactions 
ADD COLUMN recurrence_type text DEFAULT 'monthly';

-- Add check constraint for valid recurrence types
ALTER TABLE transactions
ADD CONSTRAINT valid_recurrence_type 
CHECK (recurrence_type IN ('monthly', 'quarterly', 'semiannual', 'annual'));