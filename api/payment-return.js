"use strict";
module.exports=function(req,res){const id=String(req.query["OG-ExternalIdentifier"]||"");if(!/^[0-9a-f-]{36}$/i.test(id))return res.redirect(303,"/checkout?payment=failed");return res.redirect(303,"/order-success?order="+encodeURIComponent(id))};
