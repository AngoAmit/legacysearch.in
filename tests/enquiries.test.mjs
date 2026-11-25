import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {validate} from "../supabase/functions/_shared/validate.js";
import {questions,consentVersion} from "../supabase/functions/_shared/form-model.js";
import {makeHandler} from "../supabase/functions/enquiries/handler.js";
const data=JSON.parse(readFileSync(new URL("../content/editorial.json",import.meta.url)));
const transactions=data.categories.flatMap(c=>c.types.map(t=>t.id));
const origin="https://legacysearch.in",receipt=crypto.randomUUID();
function sample(role="owner"){return {name:"Test visitor",email:"person@example.invalid",country:"+91",phone:"98765 43210",company:"Example Ltd",role,sector:"Education",transaction:"",context:"",linkedin:"",sourcePage:"connect",sourceCTA:"Page enquiry",referral:"",consent:true,consentVersion,requestId:crypto.randomUUID(),answers:Object.fromEntries(questions[role].map(q=>[q.key,q.type==="multi"?q.options.slice(0,2):q.type==="text"?"Hyderabad":q.options[0]]))};}
const handler=(store,notify)=>makeHandler({origins:[origin],secret:"test secret for isolated validation only",transactions,store,notify});
const request=(body,opts={})=>new Request("https://example.invalid/enquiries",{method:"POST",headers:{origin,"content-type":"application/json"},body:JSON.stringify(body),...opts});
for(const role of Object.keys(questions))test("Validates and stores the "+role+" journey",async()=>{const payload=sample(role);let recorded;
const r=await handler(async p=>{recorded=p;return {state:"stored",reference:receipt};})(request(payload));
assert.equal(r.status,201);assert.equal((await r.json()).reference,receipt);assert.equal(recorded.p_data.phone,"9876543210");assert.equal(recorded.p_data.role,role);assert.equal(recorded.p_request,payload.requestId);assert.match(recorded.p_fingerprint,/^[a-f0-9]{64}$/);});
test("Rejects incorrect and unconsented fields",()=>{const p={...sample(),name:" ",email:"bad",country:"91",phone:"x",company:"Independent / Not applicable",answers:{range:"unlisted"},sourcePage:"bogus",context:"x".repeat(501),consent:false,transaction:"unlisted",linkedin:"https://evil.example/path"};
const e=validate(p,transactions).errors;for(const k of ["name","email","country","phone","company","range","interest","geography","context","sourcePage","consent","transaction","linkedin"])assert.ok(e[k],k);});
test("Rejects unlisted roles, malformed arrays and unapproved source fields",()=>{assert.ok(validate({...sample(),role:"toString"},transactions).errors.role);const a=sample("investor");a.answers.interest=["bogus"];assert.ok(validate(a,transactions).errors.interest);const b=validate({...sample(),status:"Closed",assigned_team_member:"x"},transactions).data;assert.ok(!("status" in b));});
test("Blocks unknown origins, oversized requests, malformed data, honeypots and wrong methods before storage",async()=>{let calls=0;const h=handler(()=>{calls++;});const cases=[
 [request({}, {headers:{origin:"https://elsewhere.invalid","content-type":"application/json"}}),403],
 [request("x".repeat(14000)),413],[request({}, {body:"{"}),400],[request({...sample(),website:"bot"}),422],
 [request({}, {headers:{origin,"content-type":"text/plain"}}),415],[new Request("https://example.invalid",{headers:{origin}}),405],
 [request({...sample(),consent:false}),422],[new Request("https://example.invalid",{method:"OPTIONS",headers:{origin}}),204]];
 for(const [req,status] of cases)assert.equal((await h(req)).status,status);assert.equal(calls,0);});
test("Returns only confirmed receipts and distinguishes retry, limit, conflict and database failure",async()=>{
 const cases=[[{state:"duplicate",reference:receipt},200],[{state:"conflict"},409],[{state:"limited"},429],[{},503],[{state:"stored",reference:""},503]];
 for(const [response,status] of cases)assert.equal((await handler(()=>response)(request(sample()))).status,status);
 assert.equal((await handler(()=>{throw Error("db");})(request(sample()))).status,503);});
test("Notification failure preserves the stored receipt",async()=>{const r=await handler(()=>({state:"stored",reference:receipt}),()=>{throw Error("mail");})(request(sample()));assert.equal(r.status,201);});
test("All transaction categories map to valid stakeholder journeys",()=>{assert.equal(new Set(transactions).size,transactions.length);for(const t of data.categories.flatMap(c=>c.types))assert.ok(questions[t.audience]);assert.equal(data.sectors.length,9);});

