"use strict";
const{validateItems,normalizeCouponCode}=require("./_lib/store");
module.exports=async function(req,res){
 res.setHeader("Cache-Control","no-store");
 if(req.method!=="POST")return res.status(405).json({error:"METHOD_NOT_ALLOWED"});
 if(req.headers["x-paperpop-request"]!=="coupon")return res.status(403).json({error:"REQUEST_REJECTED"});
 let code,subtotalAgorot;
 try{code=normalizeCouponCode(req.body&&req.body.code);const items=validateItems(req.body&&req.body.items);subtotalAgorot=items.reduce((sum,item)=>sum+item.total*100,0);if(!code)throw Error("INVALID_COUPON")}catch(_){return res.status(400).json({error:"קוד הקופון אינו תקין"})}
 if(!process.env.DATABASE_URL)return res.status(503).json({error:"מערכת הקופונים אינה זמינה כרגע"});
 try{
  const{getAvailableCoupon}=require("./_lib/db"),coupon=await getAvailableCoupon(code);
  if(!coupon)return res.status(404).json({error:"הקופון אינו בתוקף"});
  const discountAgorot=Math.round(subtotalAgorot*Number(coupon.discount_percent)/100);
  return res.status(200).json({code:coupon.code,discountPercent:Number(coupon.discount_percent),discountAgorot,subtotalAgorot,totalAfterDiscountAgorot:subtotalAgorot-discountAgorot});
 }catch(e){console.error("coupon_validation_failed",{code,error:e.message});return res.status(503).json({error:"לא הצלחנו לבדוק את הקופון. נסו שוב"})}
};
