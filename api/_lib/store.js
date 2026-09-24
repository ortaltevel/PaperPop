"use strict";
const crypto = require("node:crypto");
const CATALOG = Object.freeze({ octopus:{name:"התמנון שעושה סדר",price:45,colors:{blue:"כחול",pink:"ורוד",green:"ירוק",yellow:"צהוב"}}, duck:{name:"הברווז השובב",price:65}, heart:{name:"הלב הפועם",price:45}, soccer:{name:"הכדור שלא מפספס",price:45}, fox:{name:"שועלה של צבעים",price:35} });
const SHIPPING = Object.freeze({ pickup:0, registered:17, courier:69 });
function clean(v,n){return typeof v==="string"?v.trim().slice(0,n):""}
function validate(input){
 if(!input||!Array.isArray(input.items)||!input.items.length||input.items.length>12)throw Error("INVALID_CART");
 const items=input.items.map(r=>{const p=CATALOG[r.id],q=Number(r.quantity),color=clean(r.color,20);if(!p||!Number.isInteger(q)||q<1||q>99||p.colors&&!p.colors[color]||!p.colors&&color)throw Error("INVALID_CART");const colorLabel=p.colors?p.colors[color]:"";return{id:r.id,color:color||null,colorLabel:colorLabel||null,name:p.name+(colorLabel?" – "+colorLabel:""),unitPrice:p.price,quantity:q,total:p.price*q}});
 const shipping=clean(input.shipping,20);if(!(shipping in SHIPPING))throw Error("INVALID_SHIPPING");
 const customer={fullName:clean(input.fullName,100),email:clean(input.email,254).toLowerCase(),phone:clean(input.phone,20),city:clean(input.city,80),street:clean(input.street,100),houseNumber:clean(input.houseNumber,10),apartment:clean(input.apartment,10),postalCode:clean(input.postalCode,10),notes:clean(input.notes,500)};
 if(!customer.fullName||!/^\S+@\S+\.\S+$/.test(customer.email)||!/^[+\d][\d\s().-]{6,19}$/.test(customer.phone))throw Error("INVALID_CUSTOMER");
 if(shipping!=="pickup"&&(!customer.city||!customer.street||!customer.houseNumber||!customer.postalCode))throw Error("INVALID_ADDRESS");
 const subtotal=items.reduce((n,x)=>n+x.total,0),shippingCost=shipping==="registered"&&subtotal>=250?0:SHIPPING[shipping];
 return{id:crypto.randomUUID(),items,customer,shipping,subtotal,shippingCost,total:subtotal+shippingCost};
}
module.exports={validate};
