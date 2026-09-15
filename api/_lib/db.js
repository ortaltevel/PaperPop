"use strict";
const { neon } = require("@neondatabase/serverless");
function sql(){if(!process.env.DATABASE_URL)throw Error("DATABASE_NOT_CONFIGURED");return neon(process.env.DATABASE_URL)}
async function createOrder(o){await sql()`INSERT INTO orders(id,status,customer,items,shipping_method,subtotal_agorot,shipping_agorot,total_agorot) VALUES(${o.id},'pending',${JSON.stringify(o.customer)}::jsonb,${JSON.stringify(o.items)}::jsonb,${o.shipping},${o.subtotal*100},${o.shippingCost*100},${o.total*100})`}
async function getOrder(id){const rows=await sql()`SELECT * FROM orders WHERE id=${id} LIMIT 1`;return rows[0]||null}
async function markPaid(id,paymentId){const rows=await sql()`UPDATE orders SET status='paid',sumit_payment_id=${String(paymentId)},paid_at=now() WHERE id=${id} AND status='pending' RETURNING *`;return rows[0]||null}
module.exports={createOrder,getOrder,markPaid};
