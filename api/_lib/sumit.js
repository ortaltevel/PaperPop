"use strict";
const BASE="https://api.sumit.co.il";
function credentials(){return{CompanyID:Number(process.env.SUMIT_COMPANY_ID),APIKey:process.env.SUMIT_API_KEY}}
async function call(path,body){
 const r=await fetch(BASE+path,{method:"POST",headers:{"content-type":"application/json","content-language":"he"},body:JSON.stringify(body),signal:AbortSignal.timeout(9000)});
 const data=await r.json();
 if(!r.ok||!data||!isSuccess(data.Status)||!data.Data){
  const status=safeLogValue(data&&data.Status),message=safeLogValue(data&&(data.UserErrorMessage||data.ErrorMessage));
  console.error("sumit_request_failed",{path,httpStatus:r.status,providerStatus:status,providerMessage:message});
  throw Error("SUMIT_REQUEST_FAILED");
 }
 return data.Data;
}
function isSuccess(status){return status===0||status==="0"||status==="Success (0)"}
function safeLogValue(value){return typeof value==="string"?value.replace(/[\r\n]/g," ").slice(0,240):value??null}
const SHORT_PRODUCT_NAMES=Object.freeze({octopus:"תמנון",duck:"ברווז",heart:"לב אדום",soccer:"כדורגל",fox:"שועלה של צבעים"});
function orderDescription(order){
 const summary=order.items.map(item=>{
  const product=SHORT_PRODUCT_NAMES[item.id]||item.name||"מוצר";
  const variant=item.colorLabel?` ${item.colorLabel}`:"";
  const quantity=item.quantity>1?`${item.quantity}× `:"";
  return `${quantity}${product}${variant}`;
 }).join(" + ");
 return (summary||"הזמנת PaperPop").slice(0,200);
}
async function begin(order,origin){
 const address=order.shipping==="pickup"?"איסוף עצמי מרעננה בתיאום מראש":[order.customer.street,order.customer.houseNumber,order.customer.apartment&&"דירה "+order.customer.apartment].filter(Boolean).join(" ");
 const items=order.items.map(x=>({Item:{Name:x.name,SKU:x.id,ExternalIdentifier:x.id,SearchMode:0},Quantity:x.quantity,UnitPrice:x.unitPrice}));
 if(order.shippingCost)items.push({Item:{Name:order.shipping==="courier"?"שליח עד הבית":"דואר רשום",SKU:"shipping",SearchMode:0},Quantity:1,UnitPrice:order.shippingCost});
 const data=await call("/billing/payments/beginredirect/",{Credentials:credentials(),Customer:{ExternalIdentifier:order.customer.email,SearchMode:0,Name:order.customer.fullName,Phone:order.customer.phone,EmailAddress:order.customer.email,City:order.customer.city||"רעננה",Address:address,ZipCode:order.customer.postalCode||null,NoVAT:true},Items:items,VATIncluded:true,DocumentType:2,RedirectURL:`${origin}/api/payment-return`,CancelRedirectURL:`${origin}/checkout?payment=cancelled`,ExternalIdentifier:order.id,MaximumPayments:0,SendUpdateByEmailAddress:order.customer.email,ExpirationHours:1,Language:0,Header:" ",UpdateOrganizationOnSuccess:false,UpdateOrganizationOnFailure:false,UpdateCustomerOnSuccess:true,DocumentDescription:orderDescription(order),DraftDocument:false,PreventSavingPaymentMethod:true,IPNURL:`${origin}/api/sumit-ipn`});
 if(!data.RedirectURL)throw Error("SUMIT_MISSING_REDIRECT");return data.RedirectURL;
}
async function getPayment(id){return(await call("/billing/payments/get/",{Credentials:credentials(),PaymentID:Number(id)})).Payment}
async function listPayments(from,to,startIndex=0){return call("/billing/payments/list/",{Credentials:credentials(),Date_From:from,Date_To:to,Valid:true,StartIndex:startIndex})}
module.exports={begin,getPayment,listPayments,orderDescription};
