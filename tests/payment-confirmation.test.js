"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),{extractPaymentRefs}=require("../api/_lib/payment-confirmation");

test("extracts SUMIT lowercase hyphenated query fields",()=>{
 assert.deepEqual(extractPaymentRefs({query:{"og-externalidentifier":"84bc977a-229e-4dc8-a60d-d3bb066e76f5","og-paymentid":"12345"}}),{orderId:"84bc977a-229e-4dc8-a60d-d3bb066e76f5",paymentId:"12345"});
});

test("extracts SUMIT fields from form encoded body",()=>{
 assert.deepEqual(extractPaymentRefs({body:"OG-ExternalIdentifier=84bc977a-229e-4dc8-a60d-d3bb066e76f5&OG-PaymentID=67890"}),{orderId:"84bc977a-229e-4dc8-a60d-d3bb066e76f5",paymentId:"67890"});
});
