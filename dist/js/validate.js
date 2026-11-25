import { roles, sectors, questions, independentRoles, consentVersion } from "./form-model.js";
const uuid=/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
const plain=(v,max,min=0)=>typeof v==="string" && v.trim().length>=min && v.trim().length<=max && !/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(v);
export function validate(input, transactions) {
 if (!input || typeof input!=="object" || Array.isArray(input)) return {errors:{form:"Enter a complete enquiry."}};
 const e={}, data={}; 
 function field(key,max,min=0){const val=input[key]??""; if(!plain(val,max,min))e[key]="Enter "+(min?"a value of ":"up to ")+(min?min+"–":"")+max+" characters."; return typeof val==="string"?val.trim():""}
 data.role=field("role",20,1);
 if(!Object.hasOwn(roles,data.role)) return {errors:{role:"Select a stakeholder type."}};
 data.name=field("name",100,2);data.email=field("email",254,3).toLowerCase();
 if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email))e.email="Enter a valid email address.";
 data.country=field("country",4,2);data.phone=field("phone",24,4).replace(/[\s().-]/g,"");
 if(!/^\+[1-9]\d{0,2}$/.test(data.country))e.country="Enter a country code, such as +91.";
 if(!/^\d{4,14}$/.test(data.phone)||!/^\+[1-9]\d{6,14}$/.test(data.country+data.phone))e.phone="Check your number and country code.";
 data.company=field("company",160,1);
 if(data.company==="Independent / Not applicable"&&!independentRoles.includes(data.role))e.company="Enter your company or organisation.";
 data.sector=field("sector",80);if(data.sector&&!sectors.includes(data.sector))e.sector="Select a listed sector.";
 data.answers={};
 const a=input.answers??{};
 for(const q of questions[data.role]){
 const v=a[q.key];
 if(q.type==="text"){if(!plain(v,q.max,1))e[q.key]="Enter up to "+q.max+" characters.";else data.answers[q.key]=v.trim();}
 else if(q.type==="multi"){if(!Array.isArray(v)||!v.length||v.length>q.options.length||v.some(x=>!q.options.includes(x)))e[q.key]="Select one or more options.";else data.answers[q.key]=[...new Set(v)].sort();}
 else if(!q.options.includes(v))e[q.key]="Select an option.";else data.answers[q.key]=v;
 }
 data.linkedin=field("linkedin",300);
 if(data.linkedin){try{const u=new URL(data.linkedin);if(u.protocol!=="https:"||!["linkedin.com","www.linkedin.com"].includes(u.hostname)||u.username||u.password)throw Error();}catch{e.linkedin="Use an https://www.linkedin.com/ profile link.";}}
 data.context=field("context",500);data.transaction=field("transaction",100);
 if(data.transaction&&!transactions.includes(data.transaction))e.transaction="Choose a listed transaction type.";
 data.sourcePage=field("sourcePage",24,1);if(!["home","acquisitions","for-you","our-firm","connect"].includes(data.sourcePage))e.sourcePage="Reload this page and try again.";
 data.sourceCTA=field("sourceCTA",100,1);data.referral=field("referral",160);
 if(input.consent!==true || input.consentVersion!==consentVersion)e.consent="Review the notice and confirm your consent.";
 data.consentVersion=consentVersion;
 if(typeof input.requestId!=="string"||!uuid.test(input.requestId))e.requestId="Refresh the page and try again.";
 return Object.keys(e).length?{errors:e}:{data,requestId:input.requestId};
}
