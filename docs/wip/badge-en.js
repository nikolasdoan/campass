// WIP (not wired in, do not deploy as is). English names for deal badges, checked against all 87
// distinct `highlight` values in data/deals.json (each maps to a string). To wire in: move into public/app.js
// next to GENERIC_BADGE and use it in badgeHTML() when getLang() === "en" (fall back to the Chinese
// text with lang="zh" when it returns null); add a UI check; bump ?v=.
/* A deal's badge in English. 「9折」 is 90% of the price (10% off), 「95折」 5% off; 「起」 means
   "from", so 「9折起」 is 10% off or more. Badges with no rule here stay as written (Chinese). */
const BADGE_EN = {
  消費贈品: "Free gift", 贈品: "Free gift", 包套贈品: "Package gift", 掛號費優惠: "Lower registration fee",
  免服務費: "No service fee", 專案優惠: "Special offer", 企業會員: "Corporate rate", 優惠價: "Special price",
  會員價: "Member price", 教育優惠: "Education discount", 教育方案優惠: "Education plan", 專屬房價: "Partner room rate",
  保費折扣: "Insurance discount", 免費體驗: "Free trial", 免車馬費: "No travel fee", 買大送大: "Buy a large, get a large",
  半票優惠: "Half-price ticket", 免運費: "Free shipping", 免費入館閱覽: "Free library entry", 免費終身信箱: "Free lifetime email",
  雙倍點數: "Double points",
};
const pctOff = (n) => 100 - (n.length === 1 ? +n * 10 : +n); // 「9」→10, 「95」→5, 「88」→12
function badgeEn(text) {
  const s = String(text).replace(/\s+/g, "");
  if (BADGE_EN[s]) return BADGE_EN[s];
  let m = s.match(/^(.*?)(\d{1,2})折(起)?$/); // 9折, 85折起, 第二杯85折, 旅平險77折
  if (m) {
    const off = `${pctOff(m[2])}%${m[3] ? "+" : ""} off`;
    const what = { "": "", 第二杯: "2nd cup ", 紀念品: "Souvenirs ", 限定月: "Select months: ", 手續費: "Fees ", 旅平險: "Travel insurance " }[m[1]];
    return what === undefined ? null : what + off;
  }
  if ((m = s.match(/^(每人)?折\$([\d,]+)(起)?$/))) return `NT$${(+m[2].replace(/,/g, "")).toLocaleString("en-US")}${m[3] ? "+" : ""} off${m[1] ? " each" : ""}`;
  if ((m = s.match(/^買(一|\d+)送(一|\d+)$/))) return `Buy ${m[1] === "一" ? 1 : m[1]}, get ${m[2] === "一" ? 1 : m[2]} free`;
  if ((m = s.match(/^(\d+)%回饋$/))) return `${m[1]}% cashback`;
  if ((m = s.match(/^額外(\d+)%折扣$/))) return `Extra ${m[1]}% off`;
  return null;
}
export { badgeEn };
