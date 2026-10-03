"use strict";
const crypto = require("node:crypto");
const CATALOG = Object.freeze({ octopus:{name:"התמנון שעושה סדר",price:45,colors:{blue:"כחול",pink:"ורוד",green:"ירוק",yellow:"צהוב"}}, duck:{name:"הברווז השובב",price:65}, heart:{name:"הלב הפועם",price:45}, soccer:{name:"הכדור שלא מפספס",price:45}, fox:{name:"שועלה של צבעים",price:35}, apple:{name:"תפוח ההפתעות",price:45} });
const SHIPPING = Object.freeze({ pickup:0, registered:17, courier:69 });
const TERMS_VERSION = "2026-09-22";
function clean(v,n){return typeof v==="string"?v.trim().slice(0,n):""}
function validateItems(input){
 if(!Array.isArray(input)||!input.length||input.length>12)throw Error("INVALID_CART");
 return input.map(r=>{const p=CATALOG[r.id],q=Number(r.quantity),color=clean(r.color,20);if(!p||!Number.isInteger(q)||q<1||q>99||p.colors&&!p.colors[color]||!p.colors&&color)throw Error("INVALID_CART");const colorLabel=p.colors?p.colors[color]:"";return{id:r.id,color:color||null,colorLabel:colorLabel||null,name:p.name+(colorLabel?" – "+colorLabel:""),unitPrice:p.price,quantity:q,total:p.price*q}});
}
function normalizeCouponCode(value){const code=clean(value,32).toUpperCase();return/^[A-Z0-9_-]{3,32}$/.test(code)?code:""}
function applyCoupon(order,coupon){
 if(!coupon)return order;
 const percent=Number(coupon.discount_percent);if(!Number.isInteger(percent)||percent<1||percent>100)throw Error("INVALID_COUPON");
 const discountAgorot=Math.round(order.subtotal*100*percent/100);
 return{...order,couponCode:String(coupon.code),discountPercent:percent,discountAgorot,discount:discountAgorot/100,total:(order.subtotal*100-discountAgorot+order.shippingCost*100)/100};
}
function validate(input){
 if(!input)throw Error("INVALID_CART");
 const items=validateItems(input.items);
 const shipping=clean(input.shipping,20);if(!(shipping in SHIPPING))throw Error("INVALID_SHIPPING");
 if(input.termsAccepted!==true)throw Error("TERMS_NOT_ACCEPTED");
 const customer={fullName:clean(input.fullName,100),email:clean(input.email,254).toLowerCase(),phone:clean(input.phone,20),city:clean(input.city,80),street:clean(input.street,100),houseNumber:clean(input.houseNumber,10),apartment:clean(input.apartment,10),postalCode:clean(input.postalCode,10),notes:clean(input.notes,500)};
 if(!customer.fullName||!/^\S+@\S+\.\S+$/.test(customer.email)||!/^[+\d][\d\s().-]{6,19}$/.test(customer.phone))throw Error("INVALID_CUSTOMER");
 if(shipping!=="pickup"&&(!customer.city||!customer.street||!customer.houseNumber||!customer.postalCode))throw Error("INVALID_ADDRESS");
 customer.consent={termsVersion:TERMS_VERSION,acceptedAt:new Date().toISOString()};
 const subtotal=items.reduce((n,x)=>n+x.total,0),shippingCost=shipping==="registered"&&subtotal>=250?0:SHIPPING[shipping];
 return{id:crypto.randomUUID(),items,customer,shipping,subtotal,shippingCost,discountAgorot:0,discount:0,total:subtotal+shippingCost,couponCode:normalizeCouponCode(input.couponCode)};
}
module.exports={validate,validateItems,normalizeCouponCode,applyCoupon,TERMS_VERSION};
