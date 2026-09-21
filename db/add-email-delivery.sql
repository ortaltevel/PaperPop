BEGIN;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_email_sent_at timestamptz;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS merchant_email_sent_at timestamptz;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS email_last_error text;
COMMIT;
