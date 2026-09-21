"use strict";

function extractPaymentRefs(req){
 const values={};
 [req&&req.query,req&&req.body].forEach(source=>collect(values,source));
 return{
  orderId:pick(values,["ogexternalidentifier","externalidentifier"]),
  paymentId:pick(values,["ogpaymentid","paymentid"])
 };
}

function collect(target,source){
 if(!source)return;
 if(typeof source==="string"){
  try{source=JSON.parse(source)}catch(_){source=Object.fromEntries(new URLSearchParams(source))}
 }
 if(typeof source!=="object")return;
 Object.entries(source).forEach(([key,value])=>{
  const normalized=String(key).toLowerCase().replace(/[^a-z0-9]/g,"");
  if(!normalized)return;
  target[normalized]=Array.isArray(value)?value[0]:value;
 });
}

function pick(values,keys){
 for(const key of keys)if(values[key]!==undefined&&values[key]!==null)return String(values[key]);
 return"";
}

async function confirmPayment(orderId,paymentId){
 if(!/^[0-9a-f-]{36}$/i.test(orderId)||!/^[0-9]+$/.test(paymentId))throw Error("INVALID_PAYMENT_REFERENCE");
 const{getOrder,markPaid}=require("./db"),{getPayment}=require("./sumit"),{notify}=require("./mail");
 const order=await getOrder(orderId);
 if(!order)throw Error("ORDER_NOT_FOUND");
 if(order.status==="paid")return order;
 const payment=await getPayment(paymentId);
 if(!payment||payment.ValidPayment!==true||Math.round(Number(payment.Amount)*100)!==order.total_agorot)throw Error("PAYMENT_NOT_CONFIRMED");
 const paid=await markPaid(orderId,paymentId);
 if(paid){
  try{await notify(paid)}catch(e){console.error("order_notification_failed",{orderId,code:e.message})}
 }
 return paid||await getOrder(orderId);
}

module.exports={extractPaymentRefs,confirmPayment};
