"use strict";
const BASE="https://api.sumit.co.il";
function credentials(){return{CompanyID:Number(process.env.SUMIT_COMPANY_ID),APIKey:process.env.SUMIT_API_KEY}}
async function call(path,body){const r=await fetch(BASE+path,{method:"POST",headers:{"content-type":"application/json","content-language":"he"},body:JSON.stringify(body),signal:AbortSignal.timeout(9000)});const data=await r.json();if(!r.ok||!data||data.Status!=="Success (0)"||!data.Data)throw Error("SUMIT_REQUEST_FAILED");return data.Data}
async function begin(order,origin){
 const address=order.shipping==="pickup"?"איסוף עצמי מרעננה בתיאום מראש":[order.customer.street,order.customer.houseNumber,order.customer.apartment&&"דירה "+order.customer.apartment].filter(Boolean).join(" ");
 const items=order.items.map(x=>({Item:{Name:x.name,SKU:x.id,ExternalIdentifier:x.id,SearchMode:0},Quantity:x.quantity,UnitPrice:x.unitPrice}));
 if(order.shippingCost)items.push({Item:{Name:order.shipping==="courier"?"שליח עד הבית":"דואר רשום",SKU:"shipping",SearchMode:0},Quantity:1,UnitPrice:order.shippingCost});
 const data=await call("/billing/payments/beginredirect/",{Credentials:credentials(),Customer:{ExternalIdentifier:order.customer.email,SearchMode:0,Name:order.customer.fullName,Phone:order.customer.phone,EmailAddress:order.customer.email,City:order.customer.city||"רעננה",Address:address,ZipCode:order.customer.postalCode||null,NoVAT:true},Items:items,VATIncluded:true,DocumentType:"Receipt (2)",RedirectURL:`${origin}/api/payment-return`,CancelRedirectURL:`${origin}/checkout?payment=cancelled`,ExternalIdentifier:order.id,MaximumPayments:0,SendUpdateByEmailAddress:order.customer.email,ExpirationHours:1,Language:"Hebrew (0)",UpdateOrganizationOnSuccess:false,UpdateOrganizationOnFailure:false,UpdateCustomerOnSuccess:false,DocumentDescription:`הזמנת PaperPop ${order.id}`,DraftDocument:false,PreventSavingPaymentMethod:true,IPNURL:`${origin}/api/sumit-ipn`});
 if(!data.RedirectURL)throw Error("SUMIT_MISSING_REDIRECT");return data.RedirectURL;
}
async function getPayment(id){return(await call("/billing/payments/get/",{Credentials:credentials(),PaymentID:Number(id)})).Payment}
module.exports={begin,getPayment};
