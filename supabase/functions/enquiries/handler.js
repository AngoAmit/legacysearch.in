import {validate} from "../_shared/validate.js";
const encoder=new TextEncoder();
const maxBody=12288;
async function readJson(request){
 const reader=request.body?.getReader();if(!reader)throw Error("empty");
 const chunks=[];let size=0;
 while(true){const {done,value}=await reader.read();if(done)break;
 size+=value.byteLength;if(size>maxBody){await reader.cancel();throw RangeError("size");}chunks.push(value);}
 const bytes=new Uint8Array(size);let offset=0;for(const v of chunks){bytes.set(v,offset);offset+=v.length;}
 return JSON.parse(new TextDecoder("utf-8",{fatal:true}).decode(bytes));
}
export function makeHandler({origins,secret,transactions,store,notify}){
 const key=crypto.subtle.importKey("raw",encoder.encode(secret),{name:"HMAC",hash:"SHA-256"},false,["sign"]);
 async function digest(value){return Array.from(new Uint8Array(await crypto.subtle.sign("HMAC",await key,encoder.encode(value))),n=>n.toString(16).padStart(2,"0")).join("");}
 return async request=>{
 const origin=request.headers.get("origin");
 const headers={"Content-Type":"application/json","Cache-Control":"no-store","Vary":"Origin","X-Content-Type-Options":"nosniff"};
 const reply=(status,body,extra={})=>new Response(body===null?null:JSON.stringify(body),{status,headers:{...headers,...extra}});
 if(!origin||!origins.includes(origin))return reply(403,{error:"origin"});
 headers["Access-Control-Allow-Origin"]=origin;
 if(request.method==="OPTIONS")return reply(204,null,{"Access-Control-Allow-Methods":"POST, OPTIONS","Access-Control-Allow-Headers":"Content-Type","Access-Control-Max-Age":"600"});
 if(request.method!=="POST")return reply(405,{error:"method"},{Allow:"POST, OPTIONS"});
 if(request.headers.get("content-type")?.split(";")[0].trim()!=="application/json")return reply(415,{error:"json"});
 let body;try{body=await readJson(request);}catch(e){return reply(e instanceof RangeError?413:400,{error:"body"});}
 if(body?.website)return reply(422,{error:"invalid"});
 const result=validate(body,transactions);if(result.errors)return reply(422,{error:"invalid",fields:result.errors});
 const {data,requestId}=result;
 // Attribute the last hop supplied by the gateway. Email throttling remains independent of network headers.
 const address=request.headers.get("x-forwarded-for")?.split(",").at(-1)?.trim()||"unknown";
 try{
 const [fingerprint,network,email]=await Promise.all([digest(JSON.stringify(data)),digest("network:"+address),digest("email:"+data.email)]);
 const saved=await store({p_request:requestId,p_fingerprint:fingerprint,p_network:network,p_email:email,p_data:data});
 if(saved?.state==="limited")return reply(429,{error:"limited"},{"Retry-After":"3600"});
 if(saved?.state==="conflict")return reply(409,{error:"conflict"});
 if(!["stored","duplicate"].includes(saved?.state)||!/^\w{8}(-[a-f\d]{4}){3}-[a-f\d]{12}$/i.test(saved.reference))throw Error("unexpected receipt");
 if(saved.state==="stored"&&notify){try{await notify(saved.reference);}catch{console.error("Lead alert unavailable. Check the private queue.");}}
 return reply(saved.state==="stored"?201:200,{reference:saved.reference,state:saved.state});
 }catch{return reply(503,{error:"unavailable"});}
 };
}
