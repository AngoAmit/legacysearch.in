import {setupEnquiry} from "./enquiry.js";
const $=(s)=>document.querySelector(s),all=s=>[...document.querySelectorAll(s)];
const reduce=matchMedia("(prefers-reduced-motion: reduce)");
const page=document.body.dataset.page;
const toggle=$(".menu-toggle"),menu=$("#mobile-nav");
function closeMenu(restore=false){menu.hidden=true;toggle.setAttribute("aria-expanded","false");if(restore)toggle.focus();}
toggle.addEventListener("click",()=>{if(menu.hidden){menu.hidden=false;toggle.setAttribute("aria-expanded","true");}else closeMenu();});
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&!menu.hidden)closeMenu(true);});
document.addEventListener("click",e=>{if(!menu.hidden&&(!e.target.closest(".site-head")||e.target.closest("#mobile-nav a")))closeMenu();});
document.addEventListener("focusin",e=>{if(!menu.hidden&&!e.target.closest(".site-head"))closeMenu();});
matchMedia("(min-width:761px)").addEventListener("change",e=>{if(e.matches)closeMenu();});
all("[data-year]").forEach(el=>el.textContent=new Date().getFullYear());
function switchChoice(group,value){const name=group.dataset.selector;
 group.querySelectorAll("[data-choice]").forEach(el=>el.setAttribute("aria-pressed",String(el.dataset.choice===value)));
 all("[data-panel]").filter(el=>el.dataset.panel.startsWith(name+":")).forEach(el=>el.hidden=el.dataset.panel!==name+":"+value);
 if(name==="geo")$(".geo-graphic").dataset.market=value;
}
all("[data-selector]").forEach(g=>g.addEventListener("click",e=>{const b=e.target.closest("[data-choice]");if(b){g.dataset.manual="true";switchChoice(g,b.dataset.choice);}}));
function route(scroll=false){
 const url=new URL(location.href);const slug=url.hash.slice(1);
 if(page==="for-you"){
 const links=all("[data-audience]");let id=links.some(l=>l.dataset.audience===slug)?slug:url.searchParams.get("role");
 if(!links.some(l=>l.dataset.audience===id))id=links[0].dataset.audience;
 links.forEach(l=>l.setAttribute("aria-current",String(l.dataset.audience===id)));all("[data-audience-panel]").forEach(p=>p.hidden=p.dataset.audiencePanel!==id);
 if(scroll&&slug===id)$(".audience-nav").scrollIntoView({block:"start",behavior:"instant"});
 }
 if(page==="acquisitions"){
 const panels=all("[data-type-panel]");const p=panels.find(x=>x.dataset.typePanel===slug)||panels.find(x=>x.dataset.typePanel===url.searchParams.get("tx"))||panels[0];
 panels.forEach(x=>x.hidden=x!==p);all("[data-type]").forEach(x=>x.setAttribute("aria-current",String(x.dataset.type===p.dataset.typePanel)));
 all("[data-category]").forEach(x=>x.setAttribute("aria-current",String(x.dataset.category===p.dataset.parent)));
 all("[data-type-list]").forEach(x=>x.hidden=x.dataset.typeList!==p.dataset.parent);
 if(scroll&&slug===p.dataset.typePanel)$(".explorer").scrollIntoView({block:"start",behavior:"instant"});
 }
}
route(true);const enquiry=$("[data-enquiry]")?setupEnquiry($("[data-enquiry]")):null;
function handleRoute(scroll){route(scroll);enquiry?.context();}
window.addEventListener("popstate",()=>handleRoute(false));
window.addEventListener("hashchange",()=>handleRoute(false));
document.addEventListener("click",e=>{
 const link=e.target.closest("a");if(!link||e.defaultPrevented||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey||e.button!==0)return;
 if(link.matches("[data-type],[data-category],[data-audience]")){
 e.preventDefault();if(enquiry?.busy)return;const u=new URL(location.href);u.hash=new URL(link.href).hash;
 ["role","tx","from","intent"].forEach(k=>u.searchParams.delete(k));
 history.pushState(null,"",u);handleRoute(false);return;
 }
 if(link.hasAttribute("data-enquire")){
 e.preventDefault();if(enquiry?.busy)return;history.pushState(null,"",link.href);handleRoute(false);$("#enquiry").scrollIntoView({behavior:reduce.matches?"instant":"smooth"});$(".form-head h3")?.focus({preventScroll:true});
 }
});
const rail=$(".cap-rail");if(rail){const cards=[...rail.children];const prev=$("[data-slide='-1']"),next=$("[data-slide='1']");
 function current(){const x=rail.getBoundingClientRect().left;return cards.reduce((best,c,i)=>Math.abs(c.getBoundingClientRect().left-x)<Math.abs(cards[best].getBoundingClientRect().left-x)?i:best,0);}
 function update(){prev.disabled=rail.scrollLeft<2;next.disabled=rail.scrollLeft+rail.clientWidth>=rail.scrollWidth-2;const first=current()+1;
 const visible=cards.filter(c=>c.getBoundingClientRect().left<rail.getBoundingClientRect().right-3&&c.getBoundingClientRect().right>rail.getBoundingClientRect().left+3);
 const end=cards.indexOf(visible.at(-1))+1;$("[data-slide-count]").textContent=(first===end?first:first+"–"+end)+" / "+cards.length;}
 [prev,next].forEach(b=>b.addEventListener("click",()=>{const to=Math.max(0,Math.min(cards.length-1,current()+Number(b.dataset.slide)));rail.scrollBy({left:cards[to].getBoundingClientRect().left-rail.getBoundingClientRect().left,behavior:reduce.matches?"instant":"smooth"});}));
 rail.addEventListener("scroll",update,{passive:true});new ResizeObserver(update).observe(rail);update();
}
const fan=$(".fan"),process=$(".process"),head=$(".site-head"),dark=$(".manifesto");let queued=false,fanVisible=false,processVisible=false;
function paint(){queued=false;const h=innerHeight;
 if(fan&&fanVisible){
 const progress=reduce.matches?0:Math.min(1,Math.max(0,-$(".hero").getBoundingClientRect().top/h));
 fan.style.setProperty("--p",progress);
 fan.style.setProperty("--spread-factor",1+.14*Math.sin(progress*Math.PI)-.10*progress);
 }
 if(process&&processVisible&&!reduce.matches){const group=process.querySelector(".stages");if(!group.dataset.manual){const r=process.getBoundingClientRect();const i=Math.min(4,Math.max(0,Math.floor(((h*.7-r.top)/(r.height+h*.2))*5)));switchChoice(group,String(i));}}
 const at=document.elementFromPoint(5,Math.min(head.offsetHeight+2,innerHeight-1));head.classList.toggle("on-dark",!!at?.closest(".dark,footer"));
}
function schedule(){if(!queued){queued=true;requestAnimationFrame(paint);}}
const watch=new IntersectionObserver(entries=>{for(const {target,isIntersecting} of entries){if(target===fan)fanVisible=isIntersecting;
 else if(target===process)processVisible=isIntersecting;else if(isIntersecting){target.classList.add("seen");watch.unobserve(target);
 if(target.dataset.count&&!reduce.matches){const n=Number(target.dataset.count),suffix=n===250?"+":"",start=performance.now();
 const count=now=>{const p=Math.min(1,(now-start)/550);target.textContent=Math.round(n*(1-(1-p)**3))+suffix;if(p<1)requestAnimationFrame(count);};requestAnimationFrame(count);}}}schedule();});
[fan,process,...all(".manifest-lines p,.manifest-end,.geo-graphic,[data-count]")].filter(Boolean).forEach(el=>watch.observe(el));
addEventListener("scroll",schedule,{passive:true});addEventListener("resize",schedule,{passive:true});reduce.addEventListener("change",schedule);schedule();

