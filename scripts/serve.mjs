import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";
const dir=fileURLToPath(new URL("../dist/",import.meta.url)),port=Number(process.env.PORT||4173);
const mime={".html":"text/html; charset=utf-8",".css":"text/css",".js":"text/javascript",".png":"image/png",".webp":"image/webp",".jpg":"image/jpeg",".woff2":"font/woff2",".ttf":"font/ttf",".xml":"application/xml",".txt":"text/plain"};
if(!fs.existsSync(path.join(dir,"index.html")))throw Error("Build the site first with npm run build.");
http.createServer((req,res)=>{try{const p=decodeURIComponent(new URL(req.url,"http://localhost").pathname);let f=path.resolve(dir,"."+p);
if(!f.startsWith(dir)&&f!==path.resolve(dir))throw Error();
if(fs.statSync(f).isDirectory()){if(!p.endsWith("/")){res.writeHead(308,{Location:p+"/"+new URL(req.url,"http://localhost").search}).end();return;}f=path.join(f,"index.html");}
res.writeHead(200,{"Content-Type":mime[path.extname(f)]||"application/octet-stream","Cache-Control":"no-cache","X-Content-Type-Options":"nosniff"});fs.createReadStream(f).pipe(res);}catch{res.writeHead(404).end("Page not found");}
}).listen(port,"127.0.0.1",()=>console.log("Preview http://127.0.0.1:"+port+"/"));
