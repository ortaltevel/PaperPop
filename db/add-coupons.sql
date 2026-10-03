BEGIN;

CREATE TABLE IF NOT EXISTS coupons (
  code text PRIMARY KEY CHECK(code=upper(code) AND code~'^[A-Z0-9_-]{3,32}$'),
  discount_percent smallint NOT NULL CHECK(discount_percent BETWEEN 1 AND 100),
  active boolean NOT NULL DEFAULT true,
  starts_at timestamptz,
  ends_at timestamptz,
  max_redemptions integer CHECK(max_redemptions IS NULL OR max_redemptions>0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK(ends_at IS NULL OR starts_at IS NULL OR ends_at>starts_at)
);

ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_agorot integer NOT NULL DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS coupon_code text REFERENCES coupons(code);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_percent smallint;

CREATE TABLE IF NOT EXISTS coupon_redemptions (
  order_id uuid PRIMARY KEY REFERENCES orders(id) ON DELETE CASCADE,
  coupon_code text NOT NULL REFERENCES coupons(code),
  status text NOT NULL CHECK(status IN ('reserved','paid')),
  reserved_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  paid_at timestamptz
);

CREATE INDEX IF NOT EXISTS coupon_redemptions_availability_idx
  ON coupon_redemptions(coupon_code,status,expires_at);

COMMIT;
