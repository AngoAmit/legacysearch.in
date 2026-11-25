import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";import path from "node:path";import {fileURLToPath} from "node:url";import {execFileSync} from "node:child_process";
const root=fileURLToPath(new URL("../",import.meta.url));
execFileSync(process.execPath,["scripts/build.mjs"],{cwd:root,env:{...process.env,ENQUIRY_ENDPOINT:""}});
const dir=path.join(root,"dist");
const pages=["index.html","acquisitions/index.html","for-you/index.html","our-firm/index.html","connect/index.html","legal/privacy.html","legal/terms.html"];
for(const page of pages)test(page+" has working local resource and navigation paths",()=>{
 const html=fs.readFileSync(path.join(dir,page),"utf8");
 assert.equal([...html.matchAll(/<h1(?:\s|>)/g)].length,1);
 for(const m of ["canonical","og:title","og:description","og:image","application/ld+json"])assert.ok(html.includes(m));
 for(const [,ref] of html.matchAll(/(?:src|href)="([^"]+)"/g)){if(/^(https?:|tel:|#|\?)/.test(ref))continue;
 const file=path.resolve(dir,path.dirname(page),ref.split(/[?#]/)[0]);assert.ok(fs.existsSync(file),"Missing "+ref);
 if(fs.statSync(file).isDirectory())assert.ok(fs.existsSync(path.join(file,"index.html")));}
});
test("Every social card and configured brand asset is packaged",()=>{const b=JSON.parse(fs.readFileSync(path.join(root,"content/brand.json")));for(const key of ["logo","favicon","share"])assert.ok(fs.statSync(path.join(dir,b[key])).size>0);});
test("A production build requires endpoint configuration",()=>{assert.throws(()=>execFileSync(process.execPath,["scripts/build.mjs","--production"],{cwd:root,env:{...process.env,ENQUIRY_ENDPOINT:""},stdio:"pipe"}));});

