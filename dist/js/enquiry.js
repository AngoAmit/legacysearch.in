import {roles,sectors,questions,independentRoles,consentVersion} from "./form-model.js";
import {validate} from "./validate.js";
import {config} from "./configuration.js";
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const values=Object.keys(config.transactions);
const firstStep=["name","email","country","phone","company","sector","role"];
const ref=new URLSearchParams(location.search);
let referral=(ref.get("utm_source")||ref.get("ref")||"").slice(0,160);
try{if(referral)sessionStorage.setItem("legacy-referral",referral);else referral=sessionStorage.getItem("legacy-referral")||"";}catch{/* Storage is optional. */}
export function setupEnquiry(node){
 const root=document.body.dataset.root,page=document.body.dataset.page;
 let role="owner",step=1,busy=false,complete=false,tx="",sourceCTA="Page enquiry",intent="",expanded=false;
 let requestId=crypto.randomUUID(),sentBody="";
 const base={name:"",email:"",country:"+91",phone:"",company:"",sector:"",linkedin:"",context:"",website:"",consent:false};
 const drafts={},independent={},companies={};
 function read(){
 const form=node.querySelector("form");if(!form)return;
 const fd=new FormData(form);
 for(const k of Object.keys(base)){if(form.elements.namedItem(k)){base[k]=k==="consent"?fd.has(k):String(fd.get(k)??"");}}
 if(step===1){independent[role]=fd.has("independent");if(!independent[role])companies[role]=base.company;}
 if(step===2){for(const q of questions[role])drafts[role][q.key]=q.type==="multi"?fd.getAll(q.key):String(fd.get(q.key)??"");expanded=!!form.querySelector("details")?.open;}
 }
 function setRole(id){if(!Object.hasOwn(roles,id))return;role=id;drafts[role]??={};}
 function context(focus=false){
 if(busy)return;read();const q=new URLSearchParams(location.search);
 const panel=document.querySelector("[data-audience-panel]:not([hidden])");
 const type=document.querySelector("[data-type-panel]:not([hidden])");
 tx=Object.hasOwn(config.transactions,q.get("tx"))?q.get("tx"):"";
 if(!tx && type)tx=type.dataset.typePanel;
 const preferred=q.get("role");
 const chosen=Object.hasOwn(roles,preferred)?preferred:panel?.dataset.audiencePanel||config.transactions[tx]?.audience||"owner";
 setRole(chosen);
 sourceCTA=(q.get("from")||"Page enquiry").slice(0,100);
 intent=q.get("intent")||"";
 if(role==="scout"&&intent)drafts.scout.interest=intent==="join"?"Join the deal scout network":"Originate off-market opportunities";
 step=1;complete=false;render(focus);
 }
 function payload(){return {...base,company:independent[role]?"Independent / Not applicable":base.company,role,answers:drafts[role],transaction:tx,sourcePage:page,sourceCTA,referral,consentVersion,requestId};}
 function errorSlot(key){return `<span class="inline-error" id="err-${key}"></span>`;}
 function field(k,label,control,full=false){return `<div class="field${full?" full":""}"><label for="en-${k}">${label}</label>${control}${errorSlot(k)}</div>`;}
 function input(k,type,attrs=""){return `<input type="${type}" name="${k}" id="en-${k}" value="${esc(base[k])}" aria-describedby="err-${k}" ${attrs}>`;}
 function select(k,options,current,required=true){return `<select id="en-${k}" name="${k}" aria-describedby="err-${k}" ${required?"required":""}><option value="">${required?"Choose an option":"Select a sector (optional)"}</option>${options.map(v=>`<option value="${esc(v)}" ${v===current?"selected":""}>${esc(v)}</option>`).join("")}</select>`;}
 function roleFields(){return questions[role].map(q=>{const v=drafts[role][q.key];if(q.type==="select")return field(q.key,q.label,select(q.key,q.options,v),true);
 if(q.type==="multi")return `<fieldset class="field full" id="en-${q.key}" aria-describedby="err-${q.key}"><legend>${q.label} · Select all that apply</legend><div class="checks">${q.options.map(x=>`<label><input type="checkbox" name="${q.key}" value="${esc(x)}" ${v?.includes(x)?"checked":""}>${esc(x)}</label>`).join("")}</div>${errorSlot(q.key)}</fieldset>`;
 const attr=`name="${q.key}" id="en-${q.key}" maxlength="${q.max}" required aria-describedby="err-${q.key}"`;
 return field(q.key,q.label,q.max>100?`<textarea ${attr}>${esc(v)}</textarea>`:`<input ${attr} value="${esc(v)}">`,true);}).join("");}
 function about(){const comp=independent[role]?"Independent / Not applicable":companies[role]??(base.company==="Independent / Not applicable"?"":base.company);
 return `<fieldset><legend>I’m enquiring as</legend><div class="role-picker">${Object.entries(roles).map(([k,t])=>`<button type="button" data-role="${k}" aria-pressed="${k===role}">${esc(t)}</button>`).join("")}</div></fieldset><div class="fields">${field("name","Full name",input("name","text",'autocomplete="name" required maxlength="100"'))}${field("email","Email address",input("email","email",'autocomplete="email" required maxlength="254"'))}<div class="full"><div class="phone-row">${field("country","Dial code",input("country","tel",'autocomplete="tel-country-code" required maxlength="4"'))}${field("phone","Mobile / WhatsApp number",input("phone","tel",'autocomplete="tel-national" required maxlength="24"'))}</div></div>${field("company","Company / organisation",`<input name="company" id="en-company" autocomplete="organization" maxlength="160" required aria-describedby="err-company" value="${esc(comp)}" ${independent[role]?"readonly":""}>`+(independentRoles.includes(role)?`<label class="check"><input name="independent" type="checkbox" ${independent[role]?"checked":""}>Independent / Not applicable</label>`:""),true)}${field("sector","Industry / sector",select("sector",sectors,base.sector,false),true)}</div>`;}
 function exploring(){return `<p class="eyebrow">${esc(roles[role])}</p><div class="fields">${roleFields()}</div><details class="form-more" ${expanded?"open":""}><summary>Add more details (optional)</summary>${field("linkedin","LinkedIn profile",input("linkedin","url",'placeholder="https://www.linkedin.com/in/…" maxlength="300"'))}${field("context","Additional context · up to 500 characters",`<textarea name="context" id="en-context" maxlength="500" aria-describedby="err-context">${esc(base.context)}</textarea>`)}</details><label class="check"><input type="checkbox" id="en-consent" name="consent" required aria-describedby="err-consent" ${base.consent?"checked":""}><span>I agree that Legacy Search may contact me regarding this enquiry and process the information provided for that purpose. <a href="${root}legal/privacy.html" target="_blank" rel="noopener">Privacy Notice (opens in a new tab)</a>.</span></label>${errorSlot("consent")}`;}
 function render(moveFocus=false){
 node.innerHTML=`<form novalidate><div class="form-head"><h3 tabindex="-1">${step===1?"About you":"What you’re exploring"}</h3><small>Step ${step} of 2</small></div><div class="progress-line" aria-hidden="true"><i></i><i class="${step===1?"off":""}"></i></div>${!config.endpoint?`<p class="preview-note">Preview mode. Online submissions open when the enquiry service is connected. For a private conversation, <a href="${config.tel}"><u>call Legacy Search</u></a>.</p>`:""}${tx?`<p class="context-note">Transaction interest · <strong>${esc(config.transactions[tx].title)}</strong></p>`:""}<div class="step-content">${step===1?about():exploring()}</div><label class="trap" aria-hidden="true">Leave empty<input type="text" name="website" value="${esc(base.website)}" tabindex="-1" autocomplete="off"></label><div class="form-actions">${step===2?'<button type="button" class="back">Back</button>':""}<button class="btn" type="submit">${step===1?"Continue":"Send enquiry"} <span aria-hidden="true">${step===1?"→":"↗"}</span></button></div><p class="form-status" role="status" aria-live="polite"></p></form>`;if(moveFocus)node.querySelector("h3").focus({preventScroll:true});
 }
 function errors(fields){
 node.querySelectorAll(".inline-error").forEach(el=>el.textContent="");node.querySelectorAll("[aria-invalid]").forEach(el=>el.removeAttribute("aria-invalid"));
 let focus;
 for(const [k,t] of Object.entries(fields)){const el=node.querySelector("#en-"+CSS.escape(k));if(!el)continue;const d=el.closest("details");if(d)d.open=true;el.setAttribute("aria-invalid","true");node.querySelector("#err-"+CSS.escape(k)).textContent=t;focus??=el.matches("fieldset")?el.querySelector("input"):el;}
 if(focus){focus.focus();status("Please check the highlighted fields.");}
 }
 function status(s){node.querySelector(".form-status").textContent=s;}
 function success(receipt){complete=true;node.innerHTML=`<div class="receipt"><img src="${root}${config.logo}" width="94" height="52" alt="Legacy Search"><h3 tabindex="-1">Your next chapter is one step closer.</h3><p>Thank you for connecting with Legacy Search. Our team will review your information and reach out where there is a relevant opportunity to collaborate.</p><p>${receipt.state==="duplicate"?"We already have this enquiry. Your original reference":"Your enquiry reference"}<br><code>${esc(receipt.reference)}</code></p><div class="receipt-links"><a class="btn" href="${root}">Return to homepage</a><a href="${config.linkedin}">Follow on LinkedIn</a><a href="${config.tel}">Contact Legacy Search</a></div></div>`;node.querySelector("h3").focus({preventScroll:true});}
 node.addEventListener("click",e=>{if(busy)return;const b=e.target.closest("button");if(!b)return;if(b.dataset.role){read();const prev=role;setRole(b.dataset.role);if(prev!==role){tx="";intent="";sourceCTA="Stakeholder selector";base.consent=false;}render();node.querySelector('[data-role="'+role+'"]').focus({preventScroll:true});}if(b.matches(".back")){read();step=1;render(true);}});
 node.addEventListener("change",e=>{if(e.target.name==="independent"){const c=node.querySelector("#en-company");if(e.target.checked){companies[role]=c.value;c.value="Independent / Not applicable";}else c.value=companies[role]||"";c.readOnly=e.target.checked;}});
 node.addEventListener("submit",async e=>{
 e.preventDefault();if(busy||complete)return;read();const body=payload();const checked=validate(body,values);
 const issues=Object.fromEntries(Object.entries(checked.errors||{}).filter(([k])=>step===2||firstStep.includes(k)));
 if(Object.keys(issues).length){errors(issues);return;}
 if(step===1){step=2;render(true);node.querySelector("h3").scrollIntoView({block:"nearest"});return;}
 errors({});if(!config.endpoint){status("This preview cannot receive enquiries. Your information has not been sent. Call "+config.phone+" to speak with the team.");return;}
 if(!navigator.onLine){status("You appear to be offline. Reconnect and send again. Your details are still here.");return;}
 const comparison=JSON.stringify({...body,requestId:""});
 if(sentBody&&sentBody!==comparison)requestId=crypto.randomUUID();sentBody=comparison;body.requestId=requestId;
 busy=true;const form=e.target;form.setAttribute("aria-busy","true");[...form.elements].forEach(el=>el.disabled=true);status("Sending your enquiry…");
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),16000);
 try{const res=await fetch(config.endpoint,{method:"POST",headers:{"Content-Type":"application/json"},credentials:"omit",body:JSON.stringify(body),signal:controller.signal});const result=await res.json().catch(()=>({}));
 if(res.ok&&["stored","duplicate"].includes(result.state)&&/^[a-f0-9]{8}(-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(result.reference)){success(result);return;}
 if(res.status===422&&result.fields){[...form.elements].forEach(el=>el.disabled=false);errors(result.fields);status("Review the highlighted fields before sending again.");}
 else if(res.status===429)status("Too many enquiries have been sent. Please try in an hour or call "+config.phone+".");
 else if(res.status===409){requestId=crypto.randomUUID();status("This reference was used for a different enquiry. Review your details and send again.");}
 else status("We could not confirm receipt. Your details are still here. Please retry or call "+config.phone+".");
 }catch{status("We could not confirm receipt. Check your connection and retry. Your details are still here.");}
 finally{clearTimeout(timer);busy=false;if(!complete){form.removeAttribute("aria-busy");[...form.elements].forEach(el=>el.disabled=false);}}
 });
 context();return {context,get busy(){return busy;}};
}

