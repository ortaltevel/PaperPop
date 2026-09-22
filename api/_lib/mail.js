"use strict";

const SHIPPING_LABELS=Object.freeze({
 pickup:"איסוף עצמי מרעננה בתיאום מראש",
 registered:"דואר רשום",
 courier:"שליח עד הבית"
});

function escapeHtml(value){
 return String(value??"").replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));
}
function safeText(value){return String(value??"").replace(/[\r\n]+/g," ").trim()}

function money(agorot){return`${(Number(agorot)/100).toFixed(2)} ₪`}
function orderNumber(order){return String(order.order_number)}
function itemLines(order){
 return order.items.map(item=>`<tr><td style="padding:8px 0">${escapeHtml(item.name)}</td><td style="padding:8px 12px;text-align:center">${Number(item.quantity)}</td><td style="padding:8px 0;text-align:left">${money(Number(item.total)*100)}</td></tr>`).join("");
}
function address(order){
 if(order.shipping_method==="pickup")return"איסוף עצמי מרעננה בתיאום מראש";
 const c=order.customer;
 return[c.street,c.houseNumber,c.apartment&&`דירה ${c.apartment}`,c.city,c.postalCode&&`מיקוד ${c.postalCode}`].filter(Boolean).map(escapeHtml).join(", ");
}
function shell(content){return`<!doctype html><html dir="rtl" lang="he"><body style="margin:0;background:#faf7f4;color:#2b2224;font-family:Arial,sans-serif"><div style="max-width:620px;margin:auto;padding:32px 20px"><div style="font-size:28px;font-weight:800;color:#7d0b27">PaperPop</div>${content}<p style="margin-top:32px;color:#6d6265;font-size:13px">לשאלות אפשר להשיב למייל זה.</p></div></body></html>`}

function customerEmail(order){
 const number=orderNumber(order);
 return{
  subject:`הזמנה ${number} התקבלה ב־PaperPop`,
  html:shell(`<h1 style="margin:28px 0 8px">תודה, ${escapeHtml(order.customer.fullName)}!</h1><p>התשלום אושר והזמנה <strong>${number}</strong> התקבלה.</p><table style="width:100%;border-collapse:collapse;margin:24px 0"><thead><tr><th style="text-align:right">מוצר</th><th>כמות</th><th style="text-align:left">סכום</th></tr></thead><tbody>${itemLines(order)}</tbody></table><p><strong>משלוח:</strong> ${escapeHtml(SHIPPING_LABELS[order.shipping_method]||order.shipping_method)}<br><strong>סה״כ:</strong> ${money(order.total_agorot)}</p><p>הקבלה החשבונאית תישלח בנפרד ממערכת SUMIT.</p>`)
 };
}

function merchantEmail(order){
 const number=orderNumber(order),c=order.customer;
 return{
  subject:`הזמנה חדשה ${number} · ${safeText(c.fullName)}`,
  html:shell(`<h1 style="margin:28px 0 8px">הזמנה חדשה ${number}</h1><table style="width:100%;border-collapse:collapse;margin:24px 0"><tbody>${itemLines(order)}</tbody></table><p><strong>סה״כ:</strong> ${money(order.total_agorot)}<br><strong>משלוח:</strong> ${escapeHtml(SHIPPING_LABELS[order.shipping_method]||order.shipping_method)}<br><strong>כתובת:</strong> ${address(order)}</p><p><strong>לקוחה:</strong> ${escapeHtml(c.fullName)}<br><strong>טלפון:</strong> ${escapeHtml(c.phone)}<br><strong>מייל:</strong> ${escapeHtml(c.email)}</p>${c.notes?`<p><strong>הערות:</strong> ${escapeHtml(c.notes)}</p>`:""}`)
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
