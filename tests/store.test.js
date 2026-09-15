"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),{validate}=require("../api/_lib/store");
const customer={fullName:"ישראל ישראלי",email:"test@example.com",phone:"0501234567",city:"רעננה",street:"אחוזה",houseNumber:"1",postalCode:"1234567"};
test("server prices ignore client prices",()=>{const o=validate({...customer,shipping:"registered",items:[{id:"duck",quantity:2,price:1}]});assert.equal(o.subtotal,130);assert.equal(o.total,147)});
test("registered shipping becomes free at 250",()=>{const o=validate({...customer,shipping:"registered",items:[{id:"duck",quantity:4}]});assert.equal(o.shippingCost,0)});
test("pickup needs no address",()=>{assert.equal(validate({fullName:"א א",email:"a@b.co",phone:"0501234567",shipping:"pickup",items:[{id:"heart",quantity:1}]}).total,45)});
test("delivery requires address",()=>{assert.throws(()=>validate({fullName:"א א",email:"a@b.co",phone:"0501234567",shipping:"courier",items:[{id:"heart",quantity:1}]}),/INVALID_ADDRESS/)});
test("unknown product is rejected",()=>{assert.throws(()=>validate({...customer,shipping:"pickup",items:[{id:"evil",quantity:1}]}),/INVALID_CART/)});
