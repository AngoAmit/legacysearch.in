import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {brand,navPages,header,footer,enquiry,esc} from "./components.mjs";
import {home} from "./home.mjs";
import {extraPages,seoContent,discovery,seoGraph} from "./seo-pages.mjs";
import {acquisitions,audience,firm,legal} from "./inner-pages.mjs";
const repo=fileURLToPath(new URL("../",import.meta.url));const dist=path.join(repo,"dist");
const data=JSON.parse(fs.readFileSync(path.join(repo,"content/editorial.json"),"utf8"));
const endpoint=process.env.ENQUIRY_ENDPOINT?.trim()||"";
if(process.argv.includes("--production")&&!endpoint)throw Error("Set the public ENQUIRY_ENDPOINT before building for release.");
if(endpoint){const u=new URL(endpoint);if(u.protocol!=="https:"&&!(["localhost","127.0.0.1"].includes(u.hostname)&&!process.argv.includes("--production")))throw Error("Use HTTPS for the enquiry endpoint.");if(u.username||u.password||u.search||u.hash||u.hostname.includes("your_project"))throw Error("Use the deployed function URL without credentials or query parameters.");}
function put(name,text){const f=path.join(dist,name);fs.mkdirSync(path.dirname(f),{recursive:true});fs.writeFileSync(f,text);}
fs.mkdirSync(dist,{recursive:true});fs.cpSync(path.join(repo,"public"),dist,{recursive:true});
const tx=Object.fromEntries(data.categories.flatMap(c=>c.types.map(t=>[t.id,{title:t.title,audience:t.audience}])));
for(const f of ["form-model.js","validate.js"])fs.copyFileSync(path.join(repo,"supabase/functions/_shared",f),path.join(dist,"js",f));
const txFile=path.join(repo,"supabase/functions/_shared/transactions.json");fs.writeFileSync(txFile,JSON.stringify(Object.keys(tx),null,2)+"\n");
put("js/configuration.js","export const config = "+JSON.stringify({endpoint,transactions:tx,logo:brand.logo,tel:brand.tel,phone:brand.phone,linkedin:brand.linkedin},null,2)+";\n");
const meta={
 home:["Legacy Search | Family Business Acquisitions in India","Founder-led acquisition advisory connecting established Indian businesses with their next generation of owners, operators and investors."],
 acquisitions:["Acquisition Capabilities | Legacy Search","Explore succession-led acquisitions, strategic buyouts, corporate deal sourcing and cross-border acquisitions of Indian businesses."],
 "for-you":["For Owners, Acquirers, Investors and Operators | Legacy Search","Find your ownership pathway, from family business succession to operator-led acquisition and off-market M&A origination."],
 "our-firm":["Our Firm & Founder | Legacy Search","Meet Ango Amit and learn about Legacy Search’s approach to ownership transitions, pan-India origination and international relationships."],
 connect:["Start a Private Enquiry | Legacy Search","Share your acquisition objectives, succession priorities, investment criteria or origination interests with our team."],
 privacy:["Privacy Notice | Legacy Search","How Legacy Search uses contact details, manages enquiry records and handles requests about your information."],
 terms:["Terms of Use & Advisory Disclaimer | Legacy Search","Terms covering website use, enquiries, acquisition advisory and independent professional advice."]};
for(const g of extraPages)meta[g.id]=[g.title+" | Legacy Search",g.description];
const urls=[];
function render(page,file,r,content){const [title,desc]=meta[page];const url=brand.domain+"/"+file.replace(/index\.html$/,"");urls.push(url);
 const org={"@context":"https://schema.org","@type":"Organization",name:brand.legalName,alternateName:brand.name,url:brand.domain,logo:brand.domain+"/"+brand.logo,telephone:brand.phone,sameAs:[brand.linkedin,brand.instagram],founder:{"@type":"Person",name:"Ango Amit",sameAs:brand.founderLinkedin}};
 put(file,`<!doctype html><html lang="en-IN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#f7f7f2"><meta name="referrer" content="strict-origin-when-cross-origin"><title>${esc(title)}</title><meta name="description" content="${esc(desc)}"><link rel="canonical" href="${url}"><meta property="og:type" content="website"><meta property="og:site_name" content="Legacy Search"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}"><meta property="og:url" content="${url}"><meta property="og:image" content="${brand.domain}/${brand.share}"><meta property="og:image:alt" content="Legacy Search — Great businesses. Greater next chapters."><meta name="twitter:card" content="summary_large_image"><link rel="icon" href="${r}${brand.favicon}" type="image/png"><link rel="stylesheet" href="${r}css/main.css"><link rel="stylesheet" href="${r}css/layout.css"><link rel="stylesheet" href="${r}css/seo.css"><script type="application/ld+json">${JSON.stringify(seoGraph(org,page,url,title,desc)).replace(/</g,"\\u003c")}</script><script type="module" src="${r}js/main.js"></script></head><body data-root="${r}" data-page="${page}">${header(r,page)}<main tabindex="-1" id="main">${content}</main>${page.startsWith("seo-")?"":discovery(r,page)}${footer(r)}</body></html>`);}
const pages={home,acquisitions,"for-you":audience,"our-firm":firm,connect:()=>""};
for(const [id,,route] of navPages){const r=route?"../":"./";render(id,route+"index.html",r,pages[id](r,data)+enquiry(r,id));}
for(const g of extraPages){const r="../".repeat(g.route.split("/").filter(Boolean).length);render(g.id,g.route+"index.html",r,seoContent(g,r));}
for(const kind of ["privacy","terms"])render(kind,"legal/"+kind+".html","../",legal(kind,"../"));
put("sitemap.xml",'<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+urls.map(u=>"<url><loc>"+u+"</loc></url>").join("")+"</urlset>");
put("robots.txt","User-agent: *\nAllow: /\nSitemap: "+brand.domain+"/sitemap.xml\n");put(".nojekyll","");put("CNAME",new URL(brand.domain).hostname+"\n");
console.log("Built five primary pages, two legal pages and SEO guides. Enquiries: "+(endpoint?"endpoint configured":"preview mode"));

