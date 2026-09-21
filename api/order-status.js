"use strict";
module.exports=async function(req,res){
 res.setHeader("Cache-Control","no-store");
 if(req.method!=="GET")return res.status(405).json({error:"METHOD_NOT_ALLOWED"});
 const id=String(req.query.order||"");
 if(!/^[0-9a-f-]{36}$/i.test(id))return res.status(400).json({error:"INVALID_ORDER"});
 if(!process.env.DATABASE_URL)return res.status(503).json({error:"NOT_CONFIGURED"});
 try{const{getOrder}=require("./_lib/db"),order=await getOrder(id);if(!order)return res.status(404).json({error:"ORDER_NOT_FOUND"});return res.status(200).json({status:order.status,orderNumber:`PP-${String(order.id).slice(0,8).toUpperCase()}`})}catch(e){console.error("order_status_failed",{requestId:require("node:crypto").randomUUID(),code:e.message});return res.status(500).json({error:"STATUS_UNAVAILABLE"})}
};
