"use strict";
module.exports=async function(req,res){
 res.setHeader("Cache-Control","no-store");
 if(req.method!=="POST")return res.status(405).json({error:"METHOD_NOT_ALLOWED"});
 const orderId=String(req.body&&req.body.order||"");
 if(!/^[0-9a-f-]{36}$/i.test(orderId))return res.status(400).json({error:"INVALID_ORDER"});
 try{
  const{getOrder}=require("./_lib/db"),{listPayments}=require("./_lib/sumit"),{confirmPayment}=require("./_lib/payment-confirmation");
  const order=await getOrder(orderId);
  if(!order)return res.status(404).json({error:"ORDER_NOT_FOUND"});
  if(order.status==="paid")return res.status(200).json({status:"paid"});
  const created=new Date(order.created_at),from=new Date(created.getTime()-86400000).toISOString(),to=new Date(created.getTime()+86400000).toISOString();
  let startIndex=0,match=null;
  for(let page=0;page<10&&!match;page++){
   const data=await listPayments(from,to,startIndex),payments=Array.isArray(data&&data.Payments)?data.Payments:[];
   match=payments.find(payment=>payment.ValidPayment===true&&String(payment.ExternalIdentifier||"")===orderId&&Math.round(Number(payment.Amount)*100)===order.total_agorot)||null;
   if(!data||!data.HasNextPage)break;
   startIndex+=payments.length;
   if(!payments.length)break;
  }
  if(!match)return res.status(404).json({error:"PAYMENT_NOT_FOUND"});
  const paid=await confirmPayment(orderId,String(match.ID));
  return res.status(200).json({status:paid.status});
 }catch(e){console.error("payment_reconciliation_failed",{code:e.message});return res.status(500).json({error:"RECONCILIATION_FAILED"})}
};
