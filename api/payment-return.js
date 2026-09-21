"use strict";
module.exports=async function(req,res){
 const crypto=require("node:crypto"),{extractPaymentRefs,confirmPayment}=require("./_lib/payment-confirmation"),refs=extractPaymentRefs(req);
 let target="/checkout?payment=failed";
 if(/^[0-9a-f-]{36}$/i.test(refs.orderId)){
  target="/order-success?order="+encodeURIComponent(refs.orderId);
  if(/^\d+$/.test(refs.paymentId))try{await confirmPayment(refs.orderId,refs.paymentId)}catch(e){console.error("payment_return_confirmation_failed",{requestId:crypto.randomUUID(),orderId:refs.orderId,code:e.message})}
 }
 res.setHeader("Cache-Control","no-store");
 res.setHeader("Content-Type","text/html; charset=utf-8");
 res.status(200).send(`<!doctype html><html lang="he" dir="rtl"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>חוזרים ל-PaperPop</title><body><p>מעבירים אותך לאישור ההזמנה…</p><p><a target="_top" href="${target}">המשך לאישור ההזמנה</a></p><script>window.top.location.replace(${JSON.stringify(target)});</script></body></html>`);
};
