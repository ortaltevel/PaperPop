"use strict";
const crypto=require("node:crypto");
module.exports=async function(req,res){
 res.setHeader("Cache-Control","no-store");
 if(req.method!=="POST")return res.status(405).end();
 const{extractPaymentRefs,confirmPayment}=require("./_lib/payment-confirmation"),refs=extractPaymentRefs(req);
 if(!/^[0-9a-f-]{36}$/i.test(refs.orderId)||!/^\d+$/.test(refs.paymentId)){
  console.error("sumit_ipn_invalid",{requestId:crypto.randomUUID(),contentType:req.headers["content-type"]||null,queryKeys:Object.keys(req.query||{}),bodyKeys:req.body&&typeof req.body==="object"?Object.keys(req.body):[]});
  return res.status(400).end();
 }
 try{await confirmPayment(refs.orderId,refs.paymentId);return res.status(204).end()}
 catch(e){console.error("sumit_ipn_failed",{requestId:crypto.randomUUID(),orderId:refs.orderId,code:e.message});return res.status(e.message==="PAYMENT_NOT_CONFIRMED"?409:500).end()}
};
