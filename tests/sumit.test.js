"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),{orderDescription,paymentItems}=require("../api/_lib/sumit");

test("SUMIT description lists products and the octopus color",()=>{
 const order={items:[
  {id:"octopus",colorLabel:"ורוד",name:"התמנון שעושה סדר – ורוד",quantity:1},
  {id:"heart",name:"הלב הפועם",quantity:1}
 ]};
 assert.equal(orderDescription(order),"תמנון ורוד + לב אדום");
});

test("SUMIT description includes quantities above one",()=>{
 assert.equal(orderDescription({items:[{id:"duck",name:"הברווז השובב",quantity:3}]}),"3× ברווז");
});
test("SUMIT receives coupon as a negative document line",()=>{const items=paymentItems({items:[{id:"heart",name:"הלב הפועם",quantity:1,unitPrice:45}],couponCode:"SAVE10",discountAgorot:450,shippingCost:0});assert.equal(items.length,2);assert.equal(items[1].UnitPrice,-4.5);assert.match(items[1].Item.Name,/SAVE10/)});
