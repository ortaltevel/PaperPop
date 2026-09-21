"use strict";
const { neon } = require("@neondatabase/serverless");
function sql(){if(!process.env.DATABASE_URL)throw Error("DATABASE_NOT_CONFIGURED");return neon(process.env.DATABASE_URL)}
async function createOrder(o){await sql()`INSERT INTO orders(id,status,customer,items,shipping_method,subtotal_agorot,shipping_agorot,total_agorot) VALUES(${o.id},'pending',${JSON.stringify(o.customer)}::jsonb,${JSON.stringify(o.items)}::jsonb,${o.shipping},${o.subtotal*100},${o.shippingCost*100},${o.total*100})`}
async function getOrder(id){const rows=await sql()`SELECT * FROM orders WHERE id=${id} LIMIT 1`;return rows[0]||null}
async function markPaid(id,paymentId){const rows=await sql()`UPDATE orders SET status='paid',sumit_payment_id=${String(paymentId)},paid_at=now() WHERE id=${id} AND status='pending' RETURNING *`;return rows[0]||null}
async function markEmailSent(id,kind){
 if(kind==="customer")await sql()`UPDATE orders SET customer_email_sent_at=COALESCE(customer_email_sent_at,now()),email_last_error=NULL WHERE id=${id}`;
 else if(kind==="merchant")await sql()`UPDATE orders SET merchant_email_sent_at=COALESCE(merchant_email_sent_at,now()),email_last_error=NULL WHERE id=${id}`;
 else throw Error("INVALID_EMAIL_KIND");
}
async function markEmailError(id,error){await sql()`UPDATE orders SET email_last_error=${String(error||"EMAIL_FAILED").slice(0,200)} WHERE id=${id}`}
async function ensureEmailDeliveryColumns(){
 const db=sql();
 await db.query("ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_email_sent_at timestamptz");
 await db.query("ALTER TABLE orders ADD COLUMN IF NOT EXISTS merchant_email_sent_at timestamptz");
 await db.query("ALTER TABLE orders ADD COLUMN IF NOT EXISTS email_last_error text");
}
module.exports={createOrder,getOrder,markPaid,markEmailSent,markEmailError,ensureEmailDeliveryColumns};
