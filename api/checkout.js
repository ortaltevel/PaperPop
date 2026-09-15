"use strict";
const {validate}=require("./_lib/store");
module.exports=async function(req,res){
 res.setHeader("Cache-Control","no-store");
 if(req.method!=="POST")return res.status(405).json({error:"METHOD_NOT_ALLOWED"});
 if(req.headers["x-paperpop-request"]!=="checkout")return res.status(403).json({error:"REQUEST_REJECTED"});
 let order;try{order=validate(req.body)}catch(_){return res.status(400).json({error:"פרטי ההזמנה אינם תקינים"})}
 const mock=process.env.ALLOW_MOCK_CHECKOUT==="true"&&process.env.VERCEL_ENV!=="production";
 if(mock)return res.status(201).json({orderId:order.id,paymentUrl:`${origin(req)}/mock-payment?order=${encodeURIComponent(order.id)}`});
  if(!process.env.SUMIT_COMPANY_ID||!process.env.SUMIT_API_KEY||!process.env.DATABASE_URL)return res.status(503).json({error:"מערכת התשלום עדיין אינה פעילה"});
  try{const{createOrder}=require("./_lib/db"),{begin}=require("./_lib/sumit");await createOrder(order);const paymentUrl=await begin(order,origin(req));return res.status(201).json({orderId:order.id,paymentUrl})}catch(e){console.error("checkout_failed",{orderId:order.id,code:e.message});return res.status(502).json({error:"לא הצלחנו לפתוח את התשלום"})}
};
function origin(req){const proto=req.headers["x-forwarded-proto"]==="https"?"https":"http",host=String(req.headers.host||"localhost:3000").replace(/[^a-zA-Z0-9.:[\]-]/g,"");return`${proto}://${host}`}
