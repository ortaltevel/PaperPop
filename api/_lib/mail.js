"use strict";

const SHIPPING_LABELS=Object.freeze({pickup:"איסוף עצמי מרעננה בתיאום מראש",registered:"דואר רשום",courier:"שליח עד הבית"});
const PRODUCT_IMAGES=Object.freeze({
 octopus:Object.freeze({blue:"/assets/products/octopus-blue-tight-600.fallback.png",pink:"/assets/products/OctepusPink-clean-600.fallback.png",green:"/assets/products/OctepusGreen-clean-600.fallback.png",yellow:"/assets/products/OctepusYellow-clean-600.fallback.png"}),
 duck:"/assets/products/duck-tight-600.fallback.png",
 heart:"/assets/products/heart-tight-600.fallback.png",
 soccer:"/assets/products/soccer-tight-600.fallback.png"
});
const INSTAGRAM_URL="https://www.instagram.com/wearepaperpop/";

function escapeHtml(value){return String(value??"").replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]))}
function safeText(value){return String(value??"").replace(/[\r\n]+/g," ").trim()}
function siteUrl(){return String(process.env.PUBLIC_SITE_URL||"https://paperpop.co.il").replace(/\/$/,"")}
function money(agorot){return`<span dir="ltr" style="direction:ltr;unicode-bidi:isolate;white-space:nowrap">${(Number(agorot)/100).toFixed(2)} ₪</span>`}
function orderNumber(order){return String(order.order_number)}
function imageUrl(item){
 const path=item.id==="octopus"?(PRODUCT_IMAGES.octopus[item.color]||PRODUCT_IMAGES.octopus.blue):PRODUCT_IMAGES[item.id];
 return path?`${siteUrl()}${path}`:"";
}
function itemLines(order){
 return order.items.map(item=>{
  const image=imageUrl(item);
  return`<tr><td style="padding:12px 0;border-bottom:1px solid #eadfe1;width:72px">${image?`<div style="width:64px;height:64px;padding:4px;border-radius:10px;background:#f4e8e7"><img src="${escapeHtml(image)}" width="64" height="64" alt="" style="display:block;width:64px;height:64px;object-fit:contain;border:0;border-radius:8px;background:#f4e8e7"></div>`:""}</td><td dir="rtl" style="padding:12px 10px;border-bottom:1px solid #eadfe1;text-align:right">${escapeHtml(item.name)}</td><td dir="ltr" style="padding:12px 8px;border-bottom:1px solid #eadfe1;text-align:center;white-space:nowrap">${Number(item.quantity)}</td><td dir="ltr" style="padding:12px 0;border-bottom:1px solid #eadfe1;text-align:left;white-space:nowrap">${money(Number(item.total)*100)}</td></tr>`;
 }).join("");
}
function address(order){
 if(order.shipping_method==="pickup")return"איסוף עצמי מרעננה בתיאום מראש";
 const c=order.customer;
 return[c.street,c.houseNumber,c.apartment&&`דירה ${c.apartment}`,c.city,c.postalCode&&`מיקוד ${c.postalCode}`].filter(Boolean).map(escapeHtml).join(", ");
}
function shell(content,{showReply=true}={}){return`<!doctype html><html dir="rtl" lang="he"><body dir="rtl" style="margin:0;background:#faf7f4;color:#2b2224;font-family:Arial,sans-serif;text-align:right"><div dir="rtl" style="max-width:620px;margin:auto;padding:32px 20px;text-align:right"><div style="text-align:center;padding-bottom:24px;border-bottom:1px solid #eadfe1"><img src="${siteUrl()}/assets/logo-wordmark.svg" width="150" alt="PaperPop" style="display:inline-block;width:150px;max-width:45%;height:auto"></div>${content}<div style="margin-top:32px;padding-top:24px;border-top:1px solid #eadfe1;text-align:center"><p dir="rtl" style="margin:0 0 14px;color:#6d6265;font-size:14px">דגמים חדשים והפתעות מתפרסמים באינסטגרם שלנו.</p><a href="${INSTAGRAM_URL}" dir="rtl" style="display:inline-block;color:#7d0b27;font-weight:700;text-decoration:underline">עקבו אחרינו באינסטגרם</a>${showReply?`<p dir="rtl" style="margin:22px 0 0;color:#6d6265;font-size:13px">לשאלות אפשר להשיב למייל זה.</p>`:""}</div></div></body></html>`}

function customerEmail(order){
 const number=orderNumber(order);
 return{
  subject:`הזמנה ${number} התקבלה בפייפרפופ`,
  html:shell(`<h1 dir="rtl" style="margin:28px 0 8px;text-align:right">תודה, ${escapeHtml(order.customer.fullName)}!</h1><p dir="rtl" style="text-align:right">התשלום אושר והזמנה <strong dir="ltr" style="unicode-bidi:isolate">${number}</strong> התקבלה.</p><table dir="rtl" role="presentation" style="width:100%;border-collapse:collapse;margin:24px 0;text-align:right"><thead><tr><th aria-label="תמונה"></th><th style="text-align:right;padding:8px 10px">מוצר</th><th style="text-align:center;padding:8px">כמות</th><th style="text-align:left;padding:8px 0">סכום</th></tr></thead><tbody>${itemLines(order)}</tbody></table><p dir="rtl" style="text-align:right;line-height:1.8"><strong>משלוח:</strong> ${escapeHtml(SHIPPING_LABELS[order.shipping_method]||order.shipping_method)}<br><strong>סה״כ:</strong> ${money(order.total_agorot)}</p><p dir="rtl" style="text-align:right">הקבלה החשבונאית תישלח בנפרד ממערכת <bdi dir="ltr" style="unicode-bidi:isolate">SUMIT</bdi>.</p>`)
 };
}
function merchantEmail(order){
 const number=orderNumber(order),c=order.customer;
 return{
  subject:`הזמנה חדשה ${number} · ${safeText(c.fullName)}`,
  html:shell(`<h1 dir="rtl" style="margin:28px 0 8px;text-align:right">הזמנה חדשה <span dir="ltr" style="unicode-bidi:isolate">${number}</span></h1><table dir="rtl" role="presentation" style="width:100%;border-collapse:collapse;margin:24px 0;text-align:right"><tbody>${itemLines(order)}</tbody></table><p dir="rtl" style="text-align:right;line-height:1.8"><strong>סה״כ:</strong> ${money(order.total_agorot)}<br><strong>משלוח:</strong> ${escapeHtml(SHIPPING_LABELS[order.shipping_method]||order.shipping_method)}<br><strong>כתובת:</strong> ${address(order)}</p><p dir="rtl" style="text-align:right;line-height:1.8"><strong>לקוחה:</strong> ${escapeHtml(c.fullName)}<br><strong>טלפון:</strong> <span dir="ltr" style="unicode-bidi:isolate">${escapeHtml(c.phone)}</span><br><strong>מייל:</strong> <span dir="ltr" style="unicode-bidi:isolate">${escapeHtml(c.email)}</span></p>${c.notes?`<p dir="rtl" style="text-align:right"><strong>הערות:</strong> ${escapeHtml(c.notes)}</p>`:""}`,{showReply:false})
 };
}
async function send(resend,payload,idempotencyKey){
 const result=await resend.emails.send(payload,{idempotencyKey});
 if(result&&result.error)throw Error(`RESEND_${result.error.name||result.error.statusCode||"FAILED"}`);
 if(!result||!result.data||!result.data.id)throw Error("RESEND_NO_MESSAGE_ID");
}
async function notify(order){
 if(!process.env.RESEND_API_KEY)throw Error("RESEND_NOT_CONFIGURED");
 const{Resend}=require("resend"),resend=new Resend(process.env.RESEND_API_KEY);
 const from=process.env.ORDER_FROM_EMAIL||"PaperPop <hello@paperpop.co.il>";
 const replyTo=process.env.ORDER_REPLY_TO||"paperpop6767@gmail.com";
 const{markEmailSent,markEmailError}=require("./db");
 try{
  if(!order.customer_email_sent_at){
   const email=customerEmail(order);
   await send(resend,{from,to:[order.customer.email],replyTo,subject:email.subject,html:email.html},`paperpop-${order.id}-customer-v1`);
   await markEmailSent(order.id,"customer");
  }
  if(!order.merchant_email_sent_at){
   const email=merchantEmail(order);
   await send(resend,{from,to:[process.env.ORDER_NOTIFY_EMAIL||"paperpop6767@gmail.com"],replyTo:order.customer.email,subject:email.subject,html:email.html},`paperpop-${order.id}-merchant-v1`);
   await markEmailSent(order.id,"merchant");
  }
 }catch(error){
  try{await markEmailError(order.id,error.message)}catch(dbError){console.error("email_error_record_failed",{orderId:order.id,code:dbError.message})}
  throw error;
 }
}

module.exports={notify,customerEmail,merchantEmail,escapeHtml};
