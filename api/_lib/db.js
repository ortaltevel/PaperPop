"use strict";
const { neon } = require("@neondatabase/serverless");
function sql(){if(!process.env.DATABASE_URL)throw Error("DATABASE_NOT_CONFIGURED");return neon(process.env.DATABASE_URL)}
async function getAvailableCoupon(code){const rows=await sql()`SELECT c.code,c.discount_percent FROM coupons c WHERE c.code=${code} AND c.active=true AND (c.starts_at IS NULL OR c.starts_at<=now()) AND (c.ends_at IS NULL OR c.ends_at>now()) AND (c.max_redemptions IS NULL OR (SELECT count(*) FROM coupon_redemptions r WHERE r.coupon_code=c.code AND (r.status='paid' OR (r.status='reserved' AND r.expires_at>now())))<c.max_redemptions) LIMIT 1`;return rows[0]||null}
async function createOrder(o){
 const db=sql(),customer=JSON.stringify(o.customer),items=JSON.stringify(o.items),subtotal=Math.round(o.subtotal*100),shipping=Math.round(o.shippingCost*100),total=Math.round(o.total*100);
 if(!o.couponCode)return db`INSERT INTO orders(id,status,customer,items,shipping_method,subtotal_agorot,shipping_agorot,discount_agorot,total_agorot) VALUES(${o.id},'pending',${customer}::jsonb,${items}::jsonb,${o.shipping},${subtotal},${shipping},0,${total})`;
 const results=await db.transaction(tx=>[
  tx`SELECT pg_advisory_xact_lock(hashtext(${o.couponCode}))`,
  tx`INSERT INTO orders(id,status,customer,items,shipping_method,subtotal_agorot,shipping_agorot,discount_agorot,total_agorot,coupon_code,discount_percent) SELECT ${o.id},'pending',${customer}::jsonb,${items}::jsonb,${o.shipping},${subtotal},${shipping},${o.discountAgorot},${total},c.code,c.discount_percent FROM coupons c WHERE c.code=${o.couponCode} AND c.discount_percent=${o.discountPercent} AND c.active=true AND (c.starts_at IS NULL OR c.starts_at<=now()) AND (c.ends_at IS NULL OR c.ends_at>now()) AND (c.max_redemptions IS NULL OR (SELECT count(*) FROM coupon_redemptions r WHERE r.coupon_code=c.code AND (r.status='paid' OR (r.status='reserved' AND r.expires_at>now())))<c.max_redemptions) RETURNING id`,
  tx`INSERT INTO coupon_redemptions(order_id,coupon_code,status,expires_at) SELECT ${o.id},${o.couponCode},'reserved',now()+interval '1 hour' WHERE EXISTS(SELECT 1 FROM orders WHERE id=${o.id}) RETURNING order_id`
 ]);
 if(!results[1]||!results[1].length)throw Error("COUPON_UNAVAILABLE");
}
async function getOrder(id){const rows=await sql()`SELECT * FROM orders WHERE id=${id} LIMIT 1`;return rows[0]||null}
async function markPaid(id,paymentId){const rows=await sql()`WITH paid_order AS (UPDATE orders SET status='paid',sumit_payment_id=${String(paymentId)},paid_at=now() WHERE id=${id} AND status='pending' RETURNING *),coupon_use AS (UPDATE coupon_redemptions SET status='paid',paid_at=now() WHERE order_id IN (SELECT id FROM paid_order) AND status='reserved') SELECT * FROM paid_order`;return rows[0]||null}
async function markEmailSent(id,kind){
 if(kind==="customer")await sql()`UPDATE orders SET customer_email_sent_at=COALESCE(customer_email_sent_at,now()),email_last_error=NULL WHERE id=${id}`;
 else if(kind==="merchant")await sql()`UPDATE orders SET merchant_email_sent_at=COALESCE(merchant_email_sent_at,now()),email_last_error=NULL WHERE id=${id}`;
 else throw Error("INVALID_EMAIL_KIND");
}
async function markEmailError(id,error){await sql()`UPDATE orders SET email_last_error=${String(error||"EMAIL_FAILED").slice(0,200)} WHERE id=${id}`}
module.exports={createOrder,getOrder,getAvailableCoupon,markPaid,markEmailSent,markEmailError};
