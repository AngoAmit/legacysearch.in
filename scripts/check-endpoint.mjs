// Deployment preflight. The invalid payload cannot create a lead.
import fs from "node:fs";
const brand=JSON.parse(fs.readFileSync(new URL("../content/brand.json",import.meta.url),"utf8"));
const endpoint=process.env.ENQUIRY_ENDPOINT;
if(!endpoint)throw Error("Set ENQUIRY_ENDPOINT in repository variables.");
const origin=new URL(brand.domain).origin;
const options=await fetch(endpoint,{method:"OPTIONS",headers:{Origin:origin,"Access-Control-Request-Method":"POST","Access-Control-Request-Headers":"content-type"},signal:AbortSignal.timeout(20000)});
if(options.status!==204||options.headers.get("Access-Control-Allow-Origin")!==origin)throw Error("Production origin failed the enquiry endpoint preflight.");
const probe=await fetch(endpoint,{method:"POST",headers:{Origin:origin,"Content-Type":"application/json"},body:"{}",signal:AbortSignal.timeout(20000)});
const body=await probe.json().catch(()=>({}));
if(probe.status!==422||!body.fields?.role||probe.headers.get("Access-Control-Allow-Origin")!==origin)throw Error("The deployed function did not return the expected validation response.");
console.log("Production origin and enquiry handler verified. Complete a real staging receipt check before cutover.");

