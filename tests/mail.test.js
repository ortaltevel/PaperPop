"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),{customerEmail,merchantEmail}=require("../api/_lib/mail");
const order={id:"e1ad4e4b-b0ce-4749-b8c6-4ab12e5d212b",order_number:1004,shipping_method:"courier",total_agorot:11400,items:[{name:"התמנון שעושה סדר – ורוד",quantity:1,total:45}],customer:{fullName:"אורטל <script>",email:"ortal@example.com",phone:"0501234567",city:"רעננה",street:"אחוזה",houseNumber:"1",postalCode:"43600",notes:"ליד <הדלת>"}};
test("customer confirmation includes the friendly order number",()=>{const email=customerEmail(order);assert.match(email.subject,/1004/);assert.match(email.html,/התמנון שעושה סדר/);assert.doesNotMatch(email.html,/<script>/)});
test("merchant notification escapes customer-provided content",()=>{const email=merchantEmail(order);assert.match(email.subject,/1004/);assert.match(email.html,/&lt;script&gt;/);assert.match(email.html,/&lt;הדלת&gt;/)});
