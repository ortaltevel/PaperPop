"use strict";
const { neon } = require("@neondatabase/serverless");
function sql(){if(!process.env.DATABASE_URL)throw Error("DATABASE_NOT_CONFIGURED");return neon(process.env.DATABASE_URL)}
async function createOrder(o){await sql()`INSERT INTO orders(id,status,customer,items,shipping_method,subtotal_agorot,shipping_agorot,total_agorot) VALUES(${o.id},'pending',${JSON.stringify(o.customer)}::jsonb,${JSON.stringify(o.items)}::jsonb,${o.shipping},${o.subtotal*100},${o.shippingCost*100},${o.total*100})`}
async function getOrder(id){const rows=await sql()`SELECT * FROM orders WHERE id=${id} LIMIT 1`;return rows[0]||null}
async function markPaid(id,paymentId){const rows=await sql()`UPDATE orders SET status='paid',sumit_payment_id=${String(paymentId)},paid_at=now() WHERE id=${id} AND status='pending' RETURNING *`;return rows[0]||null}
async function ensureOrderNumbers(){
 const db=sql();
 await db.query("CREATE SEQUENCE IF NOT EXISTS order_number_seq START WITH 1001");
 await db.query("ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_number bigint");
 await db.query("ALTER TABLE orders ALTER COLUMN order_number SET DEFAULT nextval('order_number_seq')");
 await db.query("ALTER SEQUENCE order_number_seq OWNED BY orders.order_number");
 await db.query("UPDATE orders SET order_number=nextval('order_number_seq') WHERE order_number IS NULL");
 await db.query("SELECT setval('order_number_seq', GREATEST(COALESCE((SELECT MAX(order_number) FROM orders), 1000), 1000), true)");
 await db.query("ALTER TABLE orders ALTER COLUMN order_number SET NOT NULL");
 await db.query("CREATE UNIQUE INDEX IF NOT EXISTS orders_order_number_idx ON orders(order_number)");
}
module.exports={createOrder,getOrder,markPaid,ensureOrderNumbers};
