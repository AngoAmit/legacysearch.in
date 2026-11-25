// Shared by the browser renderer and the server-side validator.
export const sectors = ["Manufacturing and industrials","Chemicals and specialty materials","Healthcare and pharmaceuticals","Education","Automotive and engineering","Consumer businesses","Logistics and distribution","Technology and business services","Hospitality and commercial assets","Other / Multi-sector"];
export const roles = {owner:"Business owner",acquirer:"Corporate acquirer",investor:"Investor / Family office / PE",operator:"Entrepreneur / Operator",scout:"Deal scout / Partner",general:"General enquiry"};
const revenue = ["Below ₹25 crore","₹25–100 crore","₹100–250 crore","₹250–500 crore","₹500–1,000 crore"];
const pick = (key,label,options) => ({key,label,options,type:"select"});
const many = (key,label,options) => ({key,label,options,type:"multi"});
const free = (key,label,max=100) => ({key,label,max,type:"text"});
export const questions = {
 owner:[pick("interest","What are you exploring?",["Full business exit","Majority stake sale","Succession planning","Strategic partnership","Growth capital","Exploring options"]),pick("range","Approximate annual business revenue",[...revenue,"₹1,000 crore+","Prefer to discuss privately"]),free("geography","Business location")],
 acquirer:[pick("interest","Acquisition objective",["Strategic expansion","Capacity addition","Geographic expansion","Vertical integration","Roll-up / consolidation","New business acquisition","Other"]),pick("range","Indicative acquisition budget",[...revenue,"₹1,000–2,000 crore","₹2,000 crore+","Flexible / Undecided"]),many("geography","Preferred target geography",["Pan-India","North India","South India","East India","West India","Central India","Northeast India","UAE","Singapore","Other markets"])],
 investor:[pick("background","Investor type",["Family office","Private equity","Micro private equity","Holding company","Individual investor","Search fund investor","Institutional investor","Other"]),pick("range","Indicative investment ticket size",["Below ₹5 crore","₹5–25 crore","₹25–100 crore","₹100–250 crore","₹250 crore+","Flexible / Deal dependent"]),many("interest","Areas of interest",["Direct acquisitions","Majority / control investments","Investor-backed operators","Search funds","Co-investment opportunities","Strategic partnerships"])],
 operator:[pick("background","Current professional background",["Entrepreneur","Corporate executive","Industry professional","Search fund entrepreneur","Independent operator","Early-career professional","Other"]),pick("experience","Years of operating experience",["0–3 years","3–7 years","7–15 years","15+ years"]),pick("interest","What are you exploring?",["Acquiring and operating a business","Investor-backed acquisition","Search fund opportunities","Management-led buyout","Exploring entrepreneurship through acquisition"])],
 scout:[pick("background","Professional background",["Business adviser","Chartered accountant / finance professional","Independent deal originator","Industry professional","Entrepreneur","Consultant","Student","Other"]),pick("interest","How would you like to collaborate?",["Introduce business owners","Introduce potential acquirers","Introduce investors","Originate off-market opportunities","Join the deal scout network"]),free("geography","Primary geographic network")],
 general:[free("message","How can we help?",500)]
};
export const independentRoles = ["operator","investor","scout","general"];
export const consentVersion="2026-11-25";

