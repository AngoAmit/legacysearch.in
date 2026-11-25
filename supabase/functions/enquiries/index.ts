import {makeHandler} from "./handler.js";
import transactions from "../_shared/transactions.json" with { type: "json" };
const env=(name:string)=>Deno.env.get(name)??"";
const url=env("SUPABASE_URL");
const apiKey=env("SUPABASE_SERVICE_ROLE_KEY") || JSON.parse(env("SUPABASE_SECRET_KEYS")||"{}").default;
const secret=env("ENQUIRY_HMAC_SECRET");
const origins=env("ALLOWED_ORIGINS").split(",").map(x=>x.trim()).filter(Boolean);
if(!url||!apiKey||secret.length<32||!origins.length)throw Error("Enquiry function needs deployment configuration.");
const handler=makeHandler({origins,secret,transactions,
 async store(payload:unknown){
 const response=await fetch(url+"/rest/v1/rpc/accept_enquiry",{method:"POST",headers:{apikey:apiKey,
 ...(apiKey.startsWith("sb_secret_")?{}:{Authorization:"Bearer "+apiKey}),"Content-Type":"application/json"},
 body:JSON.stringify(payload),signal:AbortSignal.timeout(8000)});
 if(!response.ok)throw Error("Database unavailable");return await response.json();
 },
 async notify(reference:string){
 const token=env("RESEND_API_KEY"),to=env("LEAD_NOTIFY_TO"),from=env("LEAD_NOTIFY_FROM");
 if(!token||!to||!from)return;
 const response=await fetch("https://api.resend.com/emails",{method:"POST",headers:{Authorization:"Bearer "+token,
 "Content-Type":"application/json","Idempotency-Key":"enquiry-"+reference},body:JSON.stringify({from,to:[to],subject:"New Legacy Search enquiry",
 text:"An enquiry has been stored. Open the private Supabase dashboard to review it. Reference "+reference}),signal:AbortSignal.timeout(3500)});
 if(!response.ok)throw Error("Notification unavailable");
 }});
Deno.serve(handler);
