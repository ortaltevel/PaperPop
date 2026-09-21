BEGIN;

CREATE SEQUENCE IF NOT EXISTS order_number_seq START WITH 1001;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_number bigint;
ALTER TABLE orders ALTER COLUMN order_number SET DEFAULT nextval('order_number_seq');
ALTER SEQUENCE order_number_seq OWNED BY orders.order_number;

UPDATE orders
SET order_number = nextval('order_number_seq')
WHERE order_number IS NULL;

SELECT setval(
  'order_number_seq',
  GREATEST(COALESCE((SELECT MAX(order_number) FROM orders), 1000), 1000),
  true
);

ALTER TABLE orders ALTER COLUMN order_number SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS orders_order_number_idx ON orders(order_number);

COMMIT;
