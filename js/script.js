/* =========================================================
Crystal Services: site interactions
========================================================= */
// Business config: update before going live
const CONFIG = {
whatsapp: "919677011991",
gst: 0.18,
// Prices live in PRICES (calculator section)
// Chennai + suburbs PIN range (600xxx–603xxx)
pinRegex: /^60[0-3]\d{3}$/,
};

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const inr = (n) => "₹" + Math.round(n).toLocaleString("en-IN");
const round100 = (n) => Math.round(n / 100) * 100;
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const waLink = (text) => `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(text)}`;

$("#year").textContent = new Date().getFullYear();

/* ---------- Toast ---------- */
const toastEl = $("#toast");
let toastTimer;
function toast(msg) {
toastEl.textContent = msg;
toastEl.classList.add("show");
clearTimeout(toastTimer);
toastTimer = setTimeout(() => toastEl.classList.remove("show"), 3200);
}

/* ---------- Scroll-driven UI (header, progress, active link, floating buttons, parallax) ---------- */
const header = $("#header");
const progress = $("#progress");
const toTop = $("#toTop");
const floatBook = $("#floatBook");
const navLinks = $$(".nav > a[href^='#']");
const sections = navLinks.map((a) => $(a.getAttribute("href"))).filter(Boolean);
const parallaxEls = $$("[data-parallax]");
const hero = $("#home");
let ticking = false;

function onScroll() {
const y = window.scrollY;
const max = document.documentElement.scrollHeight - innerHeight;
header.classList.toggle("scrolled", y > 30);
progress.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
const pastHero = y > hero.offsetHeight * 0.7;
toTop.classList.toggle("show", pastHero);
floatBook.classList.toggle("show", pastHero);

let current = "";
sections.forEach((s) => { if (y >= s.offsetTop - 140) current = s.id; });
navLinks.forEach((a) => a.classList.toggle("active", a.getAttribute("href") === "#" + current));

if (!reduceMotion) {
parallaxEls.forEach((el) => {
const r = el.getBoundingClientRect();
if (r.bottom < 0 || r.top > innerHeight) return;
const speed = parseFloat(el.dataset.parallax) || 0.1;
el.style.translate = `0 ${(r.top + r.height / 2 - innerHeight / 2) * -speed}px`;
});
}
updateTimeline();
ticking = false;
}
window.addEventListener("scroll", () => { if (!ticking) { requestAnimationFrame(onScroll); ticking = true; } }, { passive: true });
window.addEventListener("resize", onScroll, { passive: true });
toTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" }));

/* ---------- Mobile menu ---------- */
const nav = $("#nav");
const menuToggle = $("#menuToggle");
const menuFocusables = () => $$('a[href], button:not(:disabled)', nav).filter((el) => el.getClientRects().length > 0);
function setMenu(open) {
nav.classList.toggle("open", open);
header.classList.toggle("menu-open", open);
menuToggle.setAttribute("aria-expanded", open);
menuToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
document.body.classList.toggle("no-scroll", open);
if (open) requestAnimationFrame(() => menuFocusables()[0]?.focus());
else if (nav.contains(document.activeElement) && menuToggle.getClientRects().length) menuToggle.focus();
}
menuToggle.addEventListener("click", () => setMenu(!nav.classList.contains("open")));
$$("a", nav).forEach((a) => a.addEventListener("click", () => setMenu(false)));
document.addEventListener("keydown", (e) => {
if (!nav.classList.contains("open")) return;
if (e.key === "Escape") { setMenu(false); return; }
if (e.key !== "Tab") return;
const items = menuFocusables();
if (!items.length) { e.preventDefault(); return; }
const first = items[0], last = items[items.length - 1];
if (e.shiftKey && (document.activeElement === first || !nav.contains(document.activeElement))) { e.preventDefault(); last.focus(); }
else if (!e.shiftKey && (document.activeElement === last || !nav.contains(document.activeElement))) { e.preventDefault(); first.focus(); }
});
matchMedia("(min-width: 1101px)").addEventListener("change", (mq) => { if (mq.matches) setMenu(false); });

/* ---------- Reveal on scroll ---------- */
const revealIO = new IntersectionObserver((entries) => {
entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("is-in"); revealIO.unobserve(e.target); } });
}, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
$$("[data-reveal]").forEach((el) => revealIO.observe(el));

/* ---------- Hero word rotator ---------- */
(() => {
const words = $$(".rot-word");
if (words.length < 2 || reduceMotion) return;
let i = 0;
setInterval(() => {
const prev = words[i];
prev.classList.remove("is-active");
prev.classList.add("is-out");
setTimeout(() => prev.classList.remove("is-out"), 650);
i = (i + 1) % words.length;
words[i].classList.add("is-active");
}, 2800);
})();

/* ---------- Counters ---------- */
const counterIO = new IntersectionObserver((entries) => {
entries.forEach(({ isIntersecting, target }) => {
if (!isIntersecting) return;
counterIO.unobserve(target);
const end = parseFloat(target.dataset.target);
const dec = parseInt(target.dataset.decimals || "0", 10);
const fmt = (v) => dec ? v.toFixed(dec) : Math.round(v).toLocaleString("en-IN");
if (reduceMotion) { target.textContent = fmt(end); return; }
const start = performance.now();
const step = (now) => {
const p = Math.min((now - start) / 1800, 1);
target.textContent = fmt(end * (1 - Math.pow(1 - p, 4)));
if (p < 1) requestAnimationFrame(step);
};
requestAnimationFrame(step);
});
}, { threshold: 0.6 });
$$(".counter").forEach((c) => counterIO.observe(c));

/* ---------- Accessible tabs (services + policies) ---------- */
function initTabs(tablist, onChange) {
const tabs = $$("[role='tab']", tablist);
const select = (tab, focus = false) => {
let selectedPanel = null;
tabs.forEach((t) => {
const on = t === tab;
t.setAttribute("aria-selected", on);
t.tabIndex = on ? 0 : -1;
const panel = document.getElementById(t.getAttribute("aria-controls"));
if (panel) { panel.hidden = !on; panel.classList.toggle("is-active", on); }
if (on) selectedPanel = panel;
});
if (focus) tab.focus();
tab.scrollIntoView({ block: "nearest", inline: "nearest", behavior: reduceMotion ? "auto" : "smooth" });
if (tablist.matches(".svc-tabs") && window.matchMedia("(max-width: 600px)").matches) {
const serviceInfo = selectedPanel?.querySelector(".svc-info") || selectedPanel;
requestAnimationFrame(() => serviceInfo?.scrollIntoView({ block: "start", behavior: reduceMotion ? "auto" : "smooth" }));
}
onChange?.(tabs.indexOf(tab));
};
tabs.forEach((t, i) => {
t.addEventListener("click", () => select(t));
t.addEventListener("keydown", (e) => {
const keys = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
if (keys[e.key]) { e.preventDefault(); select(tabs[(i + keys[e.key] + tabs.length) % tabs.length], true); }
if (e.key === "Home") { e.preventDefault(); select(tabs[0], true); }
if (e.key === "End") { e.preventDefault(); select(tabs[tabs.length - 1], true); }
});
});
return { select: (i) => select(tabs[i]) };
}
initTabs($(".svc-tabs"));
initTabs($(".pol-tabs"));

/* ---------- Price list: one source for service tabs, packages, hero card and calculator ---------- */
// Edit prices here only. Everything on the page that shows a price reads from this object.
const PRICES = {
 bhk: { "1 BHK": 3499, "2 BHK": 4499, "3 BHK": 5499, "4 BHK": 6999, "4 BHK+": 6999, "5 BHK+": 9999 },
 homeFurnished: { "1 BHK": 4499, "2 BHK": 5499, "3 BHK": 6999, "4 BHK": 7999, "4 BHK+": 7999, "5 BHK+": 9999 },
 // The home tariff is based on the selected BHK across property types.
 homeMult: { apartment: 1, "independent house": 1, villa: 1 },
// Furnishing multiplier for homes and commercial spaces. Both 1 = same price; e.g. set unfurnished: 0.9 for 10% less
furnishMult: { furnished: 1, unfurnished: 1 },
sqftRate: { office: 4, "shop / showroom": 4.5, "clinic / hospital": 6, "restaurant / hotel": 0 },
serviceMult: { "Deep cleaning": 1, "Move-in / Move-out": 1.1, "Post-construction": 1.4, "Commercial cleaning": 1.05 },
extra: { bath: 599, balcony: 499 },
floorRate: { "Machine floor scrubbing": 1.5, "Manual floor scrubbing & polish": 3 },
floorMin: 499,
unit: { kitchen: 1499, kitchenFurnished: 2299, bathroom: 599, sofaSeat: 250, mattress: 599, carpet: 599, fridge: 400, homeFridge: 300, washingMachine: 200, oven: 200 },
minCommercial: 2999,
};
// "from" prices shown on the service tabs, derived from the list above
const FROM = {
home: PRICES.bhk["1 BHK"],
homeFurnished: PRICES.homeFurnished["1 BHK"],
kitchen: PRICES.unit.kitchen,
kitchenFurnished: PRICES.unit.kitchenFurnished,
bathroom: PRICES.unit.bathroom,
mattress: PRICES.unit.mattress,
carpet: PRICES.unit.carpet,
fridge: PRICES.unit.fridge,
washingMachine: PRICES.unit.washingMachine,
oven: PRICES.unit.oven,
move: PRICES.bhk["1 BHK"] * PRICES.serviceMult["Move-in / Move-out"],
build: PRICES.bhk["1 BHK"] * PRICES.serviceMult["Post-construction"],
};
const rupees = (n) => "₹" + n.toLocaleString("en-IN", { maximumFractionDigits: 2 });

function applyPrices() {
// Display hooks: <el data-p="from.kitchen"> and <el data-p="bhk.2 BHK">
$$("[data-p]").forEach((el) => {
const key = el.dataset.p;
if (key.startsWith("bhk.") || key.startsWith("bhkFurnished.")) {
const furnished = key.startsWith("bhkFurnished.");
const v = (furnished ? PRICES.homeFurnished : PRICES.bhk)[key.slice(furnished ? 13 : 4)];
if (el.classList.contains("num")) { el.dataset.price = v; el.textContent = v.toLocaleString("en-IN"); }
else el.textContent = inr(v);
} else if (key === "from.sofa") el.textContent = `${rupees(PRICES.unit.sofaSeat)}/seat`;
else if (key === "from.carpet") el.textContent = `${rupees(PRICES.unit.carpet)} per carpet`;
else if (key.startsWith("from.")) el.textContent = inr(FROM[key.slice(5)]);
});
// Calculator inputs
$$("input[name='size']").forEach((i) => (i.dataset.price = PRICES.bhk[i.value]));
$$("input[name='ptype']").forEach((i) => {
if (i.dataset.kind === "home") i.dataset.mult = PRICES.homeMult[i.value];
if (i.dataset.kind === "sqft") i.dataset.rate = PRICES.sqftRate[i.value];
});
$$("input[name='stype']").forEach((i) => (i.dataset.mult = PRICES.serviceMult[i.value]));
$$(".qty-row[data-qty]").forEach((r) => (r.dataset.price = PRICES.extra[r.dataset.qty]));
$$("input[name='floor']").forEach((i) => (i.dataset.rate = PRICES.floorRate[i.value]));
$$("input[data-pk]").forEach((i) => {
i.dataset.price = PRICES.unit[i.dataset.pk];
const note = $(".a-note", i.closest(".addon"));
if (note) note.textContent = i.dataset.unit === "fridge"
? `Starting at ${inr(+i.dataset.price)} per fridge; varies by size`
: `Starting at ${inr(+i.dataset.price)} ${i.dataset.unit === "seat" ? "per seat" : "each"}${i.dataset.noteExtra ? ", " + i.dataset.noteExtra : ""}`;
});
}
applyPrices();

/* ---------- Cost calculator wizard ---------- */
const wizard = $("#wizard");
const wzSteps = $$(".wz-step", wizard);
const wzDots = $$(".wz-steps li", wizard);
const wzBar = $("#wzBar");
const wzBack = $("#wzBack");
const wzRestart = $("#wzRestart");
const wzNext = $("#wzNext");
const sqft = $("#sqft");
const sqftOut = $("#sqftOut");
const LAST = wzSteps.length - 1;
let step = 0;
let lastEstimate = null;

const checked = (name) => $(`input[name="${name}"]:checked`, wizard);
const kind = () => checked("ptype").dataset.kind; // "home" | "sqft" | "single"
let previousPropertyKind = kind();
function syncHomeServiceVariant(value = checked("furnish")?.value || "furnished") {
$$('[data-home-cleaning-option]').forEach((button) => {
const selected = button.dataset.homeCleaningOption === value;
button.classList.toggle("is-selected", selected);
button.setAttribute("aria-pressed", String(selected));
});
$$('[data-home-variant-panel]').forEach((panel) => { panel.hidden = panel.dataset.homeVariantPanel !== value; });
const price = $("#homeStartingPrice");
if (price) price.textContent = inr(value === "furnished" ? FROM.homeFurnished : FROM.home);
}
let kitchenServiceFurnish = "furnished";
function syncKitchenServiceVariant(value = kitchenServiceFurnish) {
kitchenServiceFurnish = value;
$$('[data-kitchen-cleaning-option]').forEach((button) => {
const selected = button.dataset.kitchenCleaningOption === value;
button.classList.toggle("is-selected", selected);
button.setAttribute("aria-pressed", String(selected));
});
const price = $("#kitchenStartingPrice");
if (price) price.textContent = inr(value === "furnished" ? PRICES.unit.kitchenFurnished : PRICES.unit.kitchen);
}
// Single services skip service type, rooms and add-ons: Property → Services → Estimate
const flow = () => (kind() === "single" ? [0, 1, LAST] : wzSteps.map((_, i) => i));

function syncSizeStep() {
const k = kind();
$("#sizeHome").hidden = k !== "home";
$("#sizeSqft").hidden = k !== "sqft";
$("#sizeSingle").hidden = k !== "single";
const singleKitchen = k === "single" && checked("single")?.dataset.pk === "kitchen";
$("#singleServicesHint").hidden = k !== "single";
const furnishHome = $("#furnishHome");
$("#furnishBottomSlot").append(furnishHome);
$("#furnishHome").hidden = k === "single" && !singleKitchen;
$("#furnishLbl").textContent = singleKitchen ? "Is the kitchen furnished?" : k === "sqft" ? "Is the space furnished?" : "Is the home furnished?";
$("#sizeLegend").textContent = k === "single" ? "Which services do you need?" : "How big is it?";
wzDots[1].textContent = k === "single" ? "Services" : "Size";
}
function syncSqft() {
const pct = ((sqft.value - sqft.min) / (sqft.max - sqft.min)) * 100;
sqft.style.setProperty("--fill", pct + "%");
sqftOut.textContent = (+sqft.value).toLocaleString("en-IN") + (+sqft.value >= +sqft.max ? "+" : "");
}

// Bathrooms & balconies already covered by each home package
const INCLUDED = {
"1 BHK": { bath: 1, balcony: 1 }, "2 BHK": { bath: 2, balcony: 1 }, "3 BHK": { bath: 3, balcony: 2 },
"4 BHK": { bath: 4, balcony: 2 }, "4 BHK+": { bath: 4, balcony: 2 }, "5 BHK+": { bath: 5, balcony: 3 },
};
// Approx. carpet area per home size, used to price floor care
const AREA = { "1 BHK": 600, "2 BHK": 1000, "3 BHK": 1400, "4 BHK": 1900, "4 BHK+": 2500, "5 BHK+": 2500 };
// Services that already include machine floor scrubbing
const MACHINE_INCLUDED = ["Deep cleaning", "Move-in / Move-out", "Post-construction"];

const qtyRow = (key) => $(`.qty-row[data-qty="${key}"]`, wizard);
const getQty = (key) => +$(".st-val", qtyRow(key)).textContent;
function setQty(row, v) {
v = Math.max(+row.dataset.min, Math.min(+row.dataset.max, v));
$(".st-val", row).textContent = v;
$("[data-delta='-1']", row).disabled = v <= +row.dataset.min;
$("[data-delta='1']", row).disabled = v >= +row.dataset.max;
}
// Checkbox + count cards (add-ons and single services). Card total = unit price × count
const addonCount = (card) => +$(".st-val", card).textContent;
const itemLabel = (a, n) => {
const label = a.value === "Sofa shampoo" ? "Sofa cleaning" : a.value === "Carpet shampoo" ? "Carpet cleaning" : a.value;
return a.dataset.unit === "seat" ? `${label} (${n} seats)` : n > 1 ? `${label} ×${n}` : label;
};
function syncAddonCard(card) {
const input = $("input", card);
$(".stepper", card).hidden = !input.checked;
card.classList.toggle("is-on", input.checked);
const sofaIncluded = input.name === "addon" && input.value === "Sofa shampoo" && kind() === "home" && checked("stype").value === "Deep cleaning";
const count = input.checked ? addonCount(card) : +input.dataset.default;
const billableCount = sofaIncluded ? Math.max(0, count - 3) : count;
const kitchenRate = input.dataset.pk === "kitchen"
? (checked("furnish")?.value === "furnished" ? PRICES.unit.kitchenFurnished : PRICES.unit.kitchen)
: +input.dataset.price;
const note = $(".a-note", card);
if (note && input.name === "addon" && input.value === "Sofa shampoo") {
note.textContent = sofaIncluded ? "3 seats included with home deep cleaning; extra seats start at ₹250" : `Starting at ${inr(+input.dataset.price)} per seat`;
}
if (note && input.dataset.pk === "kitchen") note.textContent = `Starting at ${inr(PRICES.unit.kitchen)} unfurnished · ${inr(PRICES.unit.kitchenFurnished)} furnished`;
$(".a-total", card).textContent = sofaIncluded && billableCount === 0 ? "Included" : "+" + inr(kitchenRate * billableCount);
}
$$(".acard", wizard).forEach((card) => { setQty(card, +$("input", card).dataset.default); syncAddonCard(card); });

wizard.addEventListener("click", (e) => {
const btn = e.target.closest(".st-btn");
if (!btn) return;
const box = btn.closest(".qty-row, .acard");
setQty(box, +$(".st-val", box).textContent + +btn.dataset.delta);
if (box.classList.contains("acard")) syncAddonCard(box);
if (step === LAST) renderEstimate();
});

function context() {
const p = checked("ptype");
const isSqft = p.dataset.kind === "sqft";
const size = checked("size").value;
return {
p, isSqft, size,
included: isSqft ? { bath: 0, balcony: 0 } : INCLUDED[size],
area: isSqft ? +sqft.value : AREA[size] * (+p.dataset.mult || 1),
};
}
const floorPrice = (input, area) => Math.max(PRICES.floorMin, round100(area * +input.dataset.rate));

// Reset counts to the package defaults and refresh notes/prices when property, size or service changes
function syncRooms(resetCounts = true) {
if (kind() === "single") return;
const ctx = context();
const bathRow = qtyRow("bath");
const balcRow = qtyRow("balcony");
const bathP = `Starting at ${inr(PRICES.extra.bath)}`;
const balcP = `Starting at ${inr(PRICES.extra.balcony)}`;
if (resetCounts) { setQty(bathRow, ctx.included.bath); setQty(balcRow, ctx.included.balcony); }
if (ctx.isSqft) {
$("#roomHint").textContent = "How many washrooms and balconies or terraces should we clean?";
$(".q-note", bathRow).textContent = `${bathP} per washroom`;
$(".q-note", balcRow).textContent = `${balcP} per balcony / terrace`;
} else {
const { bath, balcony } = ctx.included;
$("#roomHint").textContent = `Your ${ctx.size} package already includes ${bath} bathroom${bath > 1 ? "s" : ""} and ${balcony} balcon${balcony > 1 ? "ies" : "y"}. Add any extra ones below.`;
$(".q-note", bathRow).textContent = `${bath} included · ${bathP} per extra`;
$(".q-note", balcRow).textContent = `${balcony} included · ${balcP} per extra`;
}
const service = checked("stype").value;
$$("input[name='floor']", wizard).forEach((f) => {
const label = $(".floor-price", f.closest(".addon"));
const included = f.value === "Machine floor scrubbing" && MACHINE_INCLUDED.includes(service);
f.disabled = included;
if (included) f.checked = false;
f.closest(".addon").classList.toggle("is-included", included);
label.textContent = ctx.isSqft ? "" : included ? "Included in your service" : "+" + inr(floorPrice(f, ctx.area));
});
}

function estimate() {
const startingPrice = (total) => ({ low: Math.round(total) });

if (kind() === "single") {
const picked = $$("input[name='single']:checked", wizard);
const items = [];
let sum = 0;
picked.forEach((a) => {
const n = addonCount(a.closest(".acard"));
const rate = a.dataset.pk === "kitchen"
? (checked("furnish")?.value === "furnished" ? PRICES.unit.kitchenFurnished : PRICES.unit.kitchen)
: +a.dataset.price;
sum += rate * n;
items.push(a.dataset.pk === "kitchen" ? `${itemLabel(a, n)} (${checked("furnish").value})` : itemLabel(a, n));
});
return {
...startingPrice(sum),
single: true, isSqft: false, property: "single service", size: "", sizeLabel: "",
service: picked.length === 1 ? picked[0].value : "Single services",
bookAs: picked[0]?.dataset.svc || "Full Home Deep Cleaning",
addons: items,
};
}

const ctx = context();
const { p, isSqft } = ctx;
const s = checked("stype");
const sizePrice = checked("size").value;
const homePrice = checked("furnish").value === "furnished"
? (PRICES.homeFurnished[sizePrice] ?? PRICES.bhk[sizePrice])
: PRICES.bhk[sizePrice];
const homeInspectionRequired = !isSqft && kind() === "home" && sizePrice === "4 BHK+";
const serviceInspectionRequired = !isSqft && ["Move-in / Move-out", "Post-construction"].includes(s.value);
const base = isSqft
? Math.max(+sqft.value * (+p.dataset.rate || 0) * (PRICES.furnishMult[checked("furnish").value] ?? 1), PRICES.minCommercial)
: (kind() === "home" ? homePrice : +checked("size").dataset.price * (PRICES.furnishMult[checked("furnish").value] ?? 1)) * +p.dataset.mult;

const items = [];
let extras = 0;
const sofaIncluded = !isSqft && p.dataset.kind === "home" && s.value === "Deep cleaning";
if (sofaIncluded) items.push("3-seat sofa shampoo and vacuum included");
// Bathrooms & balconies beyond what's included
[["bath", "bathroom", "bathrooms"], ["balcony", "balcony", "balconies"]].forEach(([key, one, many]) => {
const n = getQty(key);
const extra = Math.max(0, n - ctx.included[key]);
extras += extra * +qtyRow(key).dataset.price;
if (n) items.push(`${n} ${n > 1 ? many : one}${!isSqft && extra ? ` (${extra} extra)` : ""}`);
});
$$("input[name='floor']:checked", wizard).forEach((f) => { extras += floorPrice(f, ctx.area); items.push(f.value); });
$$("input[name='addon']:checked", wizard).forEach((a) => {
const n = addonCount(a.closest(".acard"));
if (sofaIncluded && a.value === "Sofa shampoo") {
const extraSeats = Math.max(0, n - 3);
extras += +a.dataset.price * extraSeats;
if (extraSeats) items.push(`${extraSeats} extra sofa seat${extraSeats > 1 ? "s" : ""}`);
} else {
extras += +a.dataset.price * n;
items.push(itemLabel(a, n));
}
});

return {
...startingPrice(base * +s.dataset.mult + extras),
single: false,
isSqft,
inspectionRequired: isSqft || homeInspectionRequired || serviceInspectionRequired,
homeInspectionRequired,
serviceInspectionRequired,
property: p.value,
size: isSqft ? "" : ctx.size,
furnish: checked("furnish").value,
sizeLabel: isSqft ? `${(+sqft.value).toLocaleString("en-IN")} sq.ft` : ctx.size,
service: s.value,
addons: items,
};
}

function renderEstimate() {
const e = (lastEstimate = estimate());
$(".wz-result").classList.toggle("is-inspection-required", !!e.inspectionRequired);
$(".wz-result .eyebrow").textContent = e.isSqft || e.serviceInspectionRequired ? "Inspection required" : e.homeInspectionRequired ? "Starting estimate · inspection required" : "Starting estimate";
$(".est-range").hidden = !!(e.isSqft || e.serviceInspectionRequired);
$("#estLow").textContent = inr(e.low);
const parts = e.single ? [e.addons.join(", ")] : [`${e.sizeLabel} ${e.furnish ? e.furnish + " " : ""}${e.property}`, e.service];
if (!e.single && e.addons.length) parts.push(e.addons.join(", "));
$("#estSummary").textContent = parts.join(" · ");
$(".est-exact").textContent = e.isSqft
? "An inspection is required to confirm your commercial cleaning price."
: e.homeInspectionRequired
? "This is a starting price. The exact price can be confirmed only after an inspection."
: e.serviceInspectionRequired
? `An inspection is required to confirm your ${e.service.toLowerCase()} price.`
: "This is an approximate starting estimate. We’ll confirm your exact price after inspecting the space and finalising the cleaning requirements.";
$(".fine").textContent = e.isSqft
? "Your selected area helps us assess the space. GST, if applicable, will be confirmed by our team."
: e.homeInspectionRequired
? "The final price depends on the inspection and cleaning requirements. GST, if applicable, will be confirmed by our team."
: e.serviceInspectionRequired
? "Your selected service details help us assess the work. GST, if applicable, will be confirmed by our team."
: "GST, if applicable, will be confirmed by our team.";
const details = e.single
? `Services: ${e.addons.join(", ")}\n`
: `Property: ${e.sizeLabel} ${e.property}${e.furnish ? ` (${e.furnish})` : ""}\nService: ${e.service}\nRooms & add-ons: ${e.addons.join(", ") || "None"}\n`;
$("#estWa").href = waLink(`Hi Crystal Services, I'd like to check the exact price for this cleaning.\n${details}${e.isSqft || e.serviceInspectionRequired ? "I understand an inspection is required to confirm the price." : e.homeInspectionRequired ? `Starting price shown: ${inr(e.low)}. I understand the exact price can be confirmed only after an inspection.` : `Starting price shown: ${inr(e.low)}. Please confirm the exact quote. GST, if applicable, to be confirmed.`}`);
}

function goStep(n) {
const f = flow();
if (!f.includes(n)) n = f.find((i) => i > n) ?? LAST;
step = n;
const pos = f.indexOf(step);
wzSteps.forEach((s, i) => s.classList.toggle("is-active", i === step));
wzDots.forEach((d, i) => {
const at = f.indexOf(i);
d.hidden = at === -1;
d.classList.toggle("is-active", i === step);
d.classList.toggle("is-done", at > -1 && at < pos);
});
wzBar.style.width = ((pos + 1) / f.length) * 100 + "%";
wzBack.disabled = pos === 0;
wzRestart.hidden = pos === 0;
const isLast = step === LAST;
wizard.classList.toggle("is-result", isLast);
wizard.classList.toggle("is-final-step", f[pos + 1] === LAST);
wzNext.innerHTML = f[pos + 1] === LAST
? 'See my estimate <svg class="i"><use href="#i-sparkle"/></svg>'
: 'Next <svg class="i"><use href="#i-chev-r"/></svg>';
if (step === 1) syncSizeStep();
if (isLast) { renderEstimate(); wzSteps[step].focus({ preventScroll: true }); }
}
wzNext.addEventListener("click", () => {
if (step === 1 && kind() === "single" && !$$("input[name='single']:checked", wizard).length) {
toast("Tick at least one service to continue.");
return;
}
const f = flow();
goStep(f[f.indexOf(step) + 1] ?? LAST);
});
wzBack.addEventListener("click", () => {
const f = flow();
goStep(f[Math.max(0, f.indexOf(step) - 1)]);
});
wzRestart.addEventListener("click", () => {
// Restore the calculator's initial defaults and clear selections from this estimate.
$("input[name='ptype'][value='apartment']", wizard).checked = true;
$("input[name='size'][value='2 BHK']", wizard).checked = true;
$("input[name='furnish'][value='furnished']", wizard).checked = true;
$("input[name='stype'][value='Deep cleaning']", wizard).checked = true;
$$('input[name="addon"], input[name="single"], input[name="floor"]', wizard).forEach((input) => { input.checked = false; });
$$('.acard', wizard).forEach((card) => {
const input = $("input", card);
setQty(card, +input.dataset.default);
syncAddonCard(card);
});
sqft.value = "1500";
wizard.dataset.kitchenFurnishInitialized = "false";
previousPropertyKind = "home";
lastEstimate = null;
syncHomeServiceVariant("furnished");
syncSizeStep();
syncSqft();
syncRooms(true);
goStep(0);
// Return to the calculator's introduction as well as step one. Scrolling the
// wizard itself leaves the intro above the viewport, which makes the reset
// look like the top of the page was clipped.
$("#calculator").scrollIntoView({ behavior: "smooth", block: "start" });
});
wizard.addEventListener("submit", (e) => e.preventDefault());
function resetPropertySelections(nextPropertyKind) {
$$('input[name="addon"], input[name="single"], input[name="floor"]', wizard).forEach((input) => { input.checked = false; });
$$('.acard', wizard).forEach((card) => {
const input = $("input", card);
setQty(card, +input.dataset.default);
syncAddonCard(card);
});
const defaultService = nextPropertyKind === "sqft" ? "Commercial cleaning" : "Deep cleaning";
const serviceInput = $(`input[name="stype"][value="${defaultService}"]`, wizard);
if (serviceInput) serviceInput.checked = true;
$(`input[name="furnish"][value="${nextPropertyKind === "sqft" ? "unfurnished" : "furnished"}"]`, wizard).checked = true;
wizard.dataset.kitchenFurnishInitialized = "false";
syncHomeServiceVariant();
previousPropertyKind = nextPropertyKind;
}
wizard.addEventListener("change", (e) => {
const n = e.target.name;
if (n === "addon" || n === "single") {
const card = e.target.closest(".acard");
// Start from the default count each time it's ticked
if (e.target.checked) setQty(card, +e.target.dataset.default);
syncAddonCard(card);
if (n === "single") {
const kitchenInput = $("input[name='single'][data-pk='kitchen']", wizard);
if (kitchenInput.checked && wizard.dataset.kitchenFurnishInitialized !== "true") {
$("input[name='furnish'][value='unfurnished']", wizard).checked = true;
wizard.dataset.kitchenFurnishInitialized = "true";
} else if (!kitchenInput.checked) {
$("input[name='furnish'][value='furnished']", wizard).checked = true;
wizard.dataset.kitchenFurnishInitialized = "false";
}
syncSizeStep();
syncAddonCard(kitchenInput.closest(".acard"));
}
}
if (n === "furnish") {
$$("input[name='single']:checked", wizard).forEach((input) => syncAddonCard(input.closest(".acard")));
if (kind() === "home") syncHomeServiceVariant(e.target.value);
}
if (n === "ptype") {
const nextPropertyKind = e.target.dataset.kind;
if (nextPropertyKind !== previousPropertyKind) {
resetPropertySelections(nextPropertyKind);
} else if (nextPropertyKind !== "single" && wizard.dataset.kitchenFurnishInitialized === "true") {
$("input[name='furnish'][value='furnished']", wizard).checked = true;
wizard.dataset.kitchenFurnishInitialized = "false";
}
previousPropertyKind = nextPropertyKind;
syncSizeStep();
// Commercial property types default to commercial cleaning
if (e.target.dataset.kind === "sqft") $("input[name='stype'][value='Commercial cleaning']", wizard).checked = true;
goStep(step); // refresh progress dots for the new flow
}
if (n === "ptype" || n === "size") syncRooms(true);
if (n === "stype") syncRooms(false);
if (n === "stype" || n === "ptype") $$("input[name='addon']", wizard).forEach((input) => syncAddonCard(input.closest(".acard")));
if (step === LAST) renderEstimate();
});
sqft.addEventListener("input", () => { syncSqft(); syncRooms(false); });
syncSqft();
syncRooms(true);
syncHomeServiceVariant();
$$('[data-home-cleaning-option]').forEach((button) => button.addEventListener("click", () => {
const value = button.dataset.homeCleaningOption;
const input = $(`input[name="furnish"][value="${value}"]`, wizard);
input.checked = true;
syncHomeServiceVariant(value);
input.dispatchEvent(new Event("change", { bubbles: true }));
}));
syncKitchenServiceVariant();
$$('[data-kitchen-cleaning-option]').forEach((button) => button.addEventListener("click", () => {
const value = button.dataset.kitchenCleaningOption;
syncKitchenServiceVariant(value);
const input = $(`input[name="furnish"][value="${value}"]`, wizard);
input.checked = true;
input.dispatchEvent(new Event("change", { bubbles: true }));
}));

// "Book at this price" prefills the booking form
const bookingForm = $("#bookingForm");
$("#estBook").addEventListener("click", () => {
const e = lastEstimate || estimate();
const serviceMap = { "Move-in / Move-out": "Move-in / Move-out Cleaning", "Post-construction": "Post-Construction Cleaning" };
if (e.single) {
$("#bService").value = e.bookAs;
syncBookingFields();
$("#bQty").value = e.addons.join(", ");
} else {
$("#bService").value = e.isSqft || e.service === "Commercial cleaning" ? "Office / Commercial Cleaning" : serviceMap[e.service] || "Full Home Deep Cleaning";
$("#bSize").value = e.isSqft ? "" : (e.property === "villa" ? "Villa / Duplex" : e.size);
syncBookingFields();
if (e.isSqft) $("#bQty").value = `${e.sizeLabel} ${e.furnish} ${e.property}`;
}
const what = e.single ? e.addons.join(", ") : `${e.sizeLabel} ${e.furnish ? e.furnish + " " : ""}${e.property}, ${e.service}`;
const label = e.isSqft
? `Inspection required to confirm price · ${what}`
: e.serviceInspectionRequired
? `Inspection required to confirm price · ${what}`
: e.homeInspectionRequired
? `Starting price: ${inr(e.low)} · ${what}; exact price confirmed only after inspection`
: `Starting price: ${inr(e.low)} · ${what}; exact quote to be confirmed`;
$("#bEstimate").value = label;
bookingForm.dataset.estimate = label;
bookingForm.classList.add("has-estimate");
});

// "Get exact price" on service tabs: open the calculator with that service preselected
function presetCalc(key) {
const setRadio = (name, value) => {
const r = $(`input[name="${name}"][value="${value}"]`, wizard);
if (!r) return;
const oldPropertyKind = name === "ptype" ? kind() : null;
r.checked = true;
if (name === "ptype" && r.dataset.kind !== oldPropertyKind) resetPropertySelections(r.dataset.kind);
};
const singles = { kitchen: "Kitchen deep cleaning", bathroom: "Bathroom deep cleaning", sofa: "Sofa shampoo", mattress: "Mattress shampoo", carpet: "Carpet shampoo", fridge: "Fridge cleaning", washingMachine: "Washing machine cleaning", oven: "Oven / microwave cleaning" };
const homes = { home: "Deep cleaning", move: "Move-in / Move-out", build: "Post-construction" };
if (key === "appliances") {
const selectedAppliances = applianceChecks.filter((input) => input.checked);
if (!selectedAppliances.length) {
toast("Select at least one appliance to see an estimate.");
return;
}
setRadio("ptype", "single service");
const selectedKeys = new Set(selectedAppliances.map((input) => input.dataset.appliance.startsWith("Fridge") ? "fridge" : input.dataset.appliance.startsWith("Washing") ? "washingMachine" : "oven"));
$$('input[name="single"]', wizard).forEach((input) => {
input.checked = selectedKeys.has(input.dataset.pk === "washing" ? "washingMachine" : input.dataset.pk);
const card = input.closest(".acard");
setQty(card, +input.dataset.default);
syncAddonCard(card);
});
} else if (singles[key]) {
setRadio("ptype", "single service");
$$("input[name='single']", wizard).forEach((i) => {
i.checked = i.value === singles[key];
const card = i.closest(".acard");
setQty(card, +i.dataset.default);
syncAddonCard(card);
});
if (key === "kitchen") {
setRadio("furnish", kitchenServiceFurnish);
// The kitchen card was refreshed before the furnishing radio changed. Recompute
// its displayed starting price so it matches the choice carried over from Services.
const kitchenInput = $("input[name='single'][data-pk='kitchen']", wizard);
if (kitchenInput) syncAddonCard(kitchenInput.closest(".acard"));
}
} else if (homes[key]) {
if (kind() !== "home") setRadio("ptype", "apartment");
setRadio("stype", homes[key]);
// A new estimate opened from a home service starts at the calculator default.
$("input[name='size'][value='2 BHK']", wizard).checked = true;
} else if (key === "office") {
setRadio("ptype", "office");
// Re-entering the commercial estimate from its service card always starts fresh at Office,
// even if another commercial property type was selected earlier in the calculator.
resetPropertySelections("sqft");
setRadio("stype", "Commercial cleaning");
}
syncSizeStep();
syncRooms(true);
// Home and office services start at property type (apartment / villa / office / shop…);
// single services skip straight to picking items and counts
goStep(singles[key] || key === "appliances" ? 1 : 0);
}
$$("[data-calc]").forEach((b) => b.addEventListener("click", () => presetCalc(b.dataset.calc)));
const commercialChoices = $$(".com-choice");
const commercialQuote = $("#commercialQuote");
function updateCommercialQuote(type = null) {
commercialChoices.forEach((choice) => {
const selected = choice.dataset.commercialType === type;
choice.classList.toggle("is-selected", selected);
choice.setAttribute("aria-pressed", String(selected));
});
const hasSelection = Boolean(type);
commercialQuote.removeAttribute("aria-disabled");
commercialQuote.href = waLink(hasSelection
? `Hi Crystal Services, I would like a commercial cleaning quote for ${type}. Please share the next steps.`
: "Hi Crystal Services, I would like to enquire about your commercial cleaning services. Please share the next steps.");
}
commercialChoices.forEach((choice) => choice.addEventListener("click", () => updateCommercialQuote(choice.dataset.commercialType)));
updateCommercialQuote();
$('.svc-panel#p-office .svc-actions a[href="#commercial"]')?.addEventListener("click", () => updateCommercialQuote());
const applianceChecks = $$(".appliance-select");
const applianceSummary = $("#applianceEstimateSummary");
const applianceEstimateValue = $("#applianceEstimateValue");
const applianceCalculatorEstimate = $("#applianceCalculatorEstimate");
const applianceBook = $("#applianceBookService");
function updateApplianceEstimate() {
applianceChecks.forEach((input) => input.closest(".appliance-option")?.classList.toggle("is-selected", input.checked));
const selected = applianceChecks.filter((input) => input.checked);
if (!selected.length) {
applianceEstimateValue.textContent = "—";
applianceSummary.textContent = "Select one or more appliances to see a combined starting estimate.";
applianceCalculatorEstimate.setAttribute("aria-disabled", "true");
applianceBook.setAttribute("aria-disabled", "true");
return;
}
const total = selected.reduce((sum, input) => sum + Number(input.dataset.price), 0);
const names = selected.map((input) => input.dataset.appliance);
applianceEstimateValue.textContent = inr(total);
applianceSummary.textContent = names.join(", ");
applianceCalculatorEstimate.setAttribute("aria-disabled", "false");
applianceBook.setAttribute("aria-disabled", "false");
}
applianceChecks.forEach((input) => input.addEventListener("change", updateApplianceEstimate));
applianceCalculatorEstimate.addEventListener("click", (event) => {
if (applianceCalculatorEstimate.getAttribute("aria-disabled") === "true") event.preventDefault();
});
applianceBook.addEventListener("click", (event) => {
const selected = applianceChecks.filter((input) => input.checked);
if (!selected.length) {
event.preventDefault();
toast("Select at least one appliance to continue booking.");
return;
}
const serviceField = $("#bService");
serviceField.value = "Appliance Deep Cleaning";
serviceField.dispatchEvent(new Event("change", { bubbles: true }));
const selectedNames = selected.map((input) => input.dataset.appliance);
applianceBookingChecks.forEach((input) => { input.checked = selectedNames.includes(input.value); });
updateBookingApplianceValue();
});
goStep(0);

// Package / service buttons prefill the booking form
const pricingCards = $$(".price-card", $("#pricing"));
function selectPricingCard(selectedCard) {
pricingCards.forEach((card) => {
  const selected = card === selectedCard;
  card.classList.toggle("is-featured", selected);
  const cardButton = $("[data-plan]", card);
  cardButton.classList.toggle("btn-primary", selected);
  cardButton.classList.toggle("btn-outline", !selected);
});
$("#bSize").value = $("[data-plan]", selectedCard).dataset.plan;
}
pricingCards.forEach((card) => card.addEventListener("click", (event) => {
if (event.target.closest("a, button")) return;
selectPricingCard(card);
}));
$$ ("[data-plan]").forEach((b) => b.addEventListener("click", () => {
selectPricingCard(b.closest(".price-card"));
$("#bService").value = "Full Home Deep Cleaning";
 syncBookingFields();
}));
$$("[data-service]").forEach((b) => b.addEventListener("click", () => { $("#bService").value = b.dataset.service; syncBookingFields(); }));

/* ---------- Before / After sliders (mouse, touch, pen, keyboard) ---------- */
$$(".ba").forEach((ba) => {
const range = $(".ba-range", ba);
const setPos = (v) => {
v = Math.max(0, Math.min(100, v));
ba.style.setProperty("--pos", v + "%");
range.value = v;
};
const fromX = (clientX) => {
const r = ba.getBoundingClientRect();
if (r.width) setPos(((clientX - r.left) / r.width) * 100);
};
// Stop the browser from starting a native image drag, which cancels the slide
$$("img", ba).forEach((img) => { img.draggable = false; });
ba.addEventListener("dragstart", (e) => e.preventDefault());

// Track movement on window (not pointer capture) so dragging keeps working
// even when the cursor leaves the image or capture isn't supported
let dragging = false;
const move = (e) => { if (dragging) fromX(e.clientX); };
const stop = () => {
dragging = false;
ba.classList.remove("dragging");
window.removeEventListener("pointermove", move);
window.removeEventListener("pointerup", stop);
window.removeEventListener("pointercancel", stop);
};
ba.addEventListener("pointerdown", (e) => {
if (e.button !== undefined && e.button > 0) return; // left click / touch / pen only
if (e.pointerType === "mouse") e.preventDefault(); // no text selection while dragging
dragging = true;
ba.classList.add("dragging");
fromX(e.clientX);
window.addEventListener("pointermove", move);
window.addEventListener("pointerup", stop);
window.addEventListener("pointercancel", stop);
});
range.addEventListener("input", () => setPos(+range.value));
});

// Carousel between transformations
(() => {
const slides = $$(".ba-slide");
const tabs = $$(".ba-tabs [role='tab']");
const idx = $("#baIdx");
let cur = 0;
const show = (n, focus = false) => {
cur = (n + slides.length) % slides.length;
slides.forEach((s, i) => {
s.classList.toggle("is-active", i === cur);
s.setAttribute("aria-hidden", i !== cur);
$(".ba-range", s).tabIndex = i === cur ? 0 : -1;
});
tabs.forEach((t, i) => { t.setAttribute("aria-selected", i === cur); t.tabIndex = i === cur ? 0 : -1; });
if (focus) tabs[cur].focus();
idx.textContent = String(cur + 1).padStart(2, "0");
};
tabs.forEach((t, i) => {
t.addEventListener("click", () => show(i));
t.addEventListener("keydown", (e) => {
if (e.key === "ArrowRight") { e.preventDefault(); show(cur + 1, true); }
if (e.key === "ArrowLeft") { e.preventDefault(); show(cur - 1, true); }
});
});
$("#baPrev").addEventListener("click", () => show(cur - 1));
$("#baNext").addEventListener("click", () => show(cur + 1));
show(0);
})();

/* ---------- Process timeline fill ---------- */
const timeline = $("#timeline");
const tlFill = $("#tlFill");
const tlItems = $$("li", timeline);
function updateTimeline() {
const r = timeline.getBoundingClientRect();
const mid = innerHeight * 0.6;
const pct = Math.max(0, Math.min(1, (mid - r.top) / r.height));
tlFill.style.height = pct * 100 + "%";
tlItems.forEach((li) => {
const dot = $(".tl-dot", li).getBoundingClientRect();
li.classList.toggle("is-lit", dot.top + dot.height / 2 < mid);
});
}

/* ---------- Duplicate area chips for a seamless loop ---------- */
$$(".marquee-track").forEach((track) => {
[...track.children].forEach((el) => track.appendChild(el.cloneNode(true)));
});
/* ---------- Duplicate review cards for two seamless scrolling rows ---------- */
$(".review-rows") && $$(".review-track").forEach((track) => {
[...track.children].forEach((card) => {
const clone = card.cloneNode(true);
clone.setAttribute("aria-hidden", "true");
clone.tabIndex = -1;
track.appendChild(clone);
});
});

/* ---------- Bento cursor glow ---------- */
$$(".glow").forEach((card) => card.addEventListener("pointermove", (e) => {
const r = card.getBoundingClientRect();
card.style.setProperty("--mx", e.clientX - r.left + "px");
card.style.setProperty("--my", e.clientY - r.top + "px");
}));

/* ---------- Gallery lightbox ---------- */
(() => {
const items = $$(".m-item");
const lb = $("#lightbox");
const img = $("#lbImg");
const cap = $("#lbCap");
let cur = 0;
let opener;
const render = () => {
const it = items[cur];
img.src = it.dataset.full;
img.alt = $("img", it).alt;
cap.textContent = $("span", it).textContent;
};
const open = (i) => { opener = document.activeElement; cur = i; render(); lb.hidden = false; document.body.classList.add("no-scroll"); $("#lbClose").focus(); };
const close = () => { lb.hidden = true; document.body.classList.remove("no-scroll"); opener?.focus(); };
const go = (d) => { cur = (cur + d + items.length) % items.length; render(); };
items.forEach((it, i) => it.addEventListener("click", () => open(i)));
$("#lbClose").addEventListener("click", close);
$("#lbPrev").addEventListener("click", () => go(-1));
$("#lbNext").addEventListener("click", () => go(1));
lb.addEventListener("click", (e) => { if (e.target === lb) close(); });
document.addEventListener("keydown", (e) => {
if (lb.hidden) return;
if (e.key === "Escape") close();
if (e.key === "ArrowLeft") go(-1);
if (e.key === "ArrowRight") go(1);
if (e.key === "Tab") trapFocus(e, lb);
});
// Swipe on touch screens
let sx = null;
lb.addEventListener("touchstart", (e) => { sx = e.touches[0].clientX; }, { passive: true });
lb.addEventListener("touchend", (e) => {
if (sx === null) return;
const dx = e.changedTouches[0].clientX - sx;
if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
sx = null;
});
})();

function trapFocus(e, container) {
const f = $$("button, a[href], input, select, textarea", container).filter((el) => !el.disabled && el.offsetParent !== null);
if (!f.length) return;
const first = f[0], last = f[f.length - 1];
if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
}

/* ---------- Areas: PIN check + locality search ---------- */
const digitsOnly = (el) => el.addEventListener("input", () => { el.value = el.value.replace(/\D/g, ""); });
["#pinInput", "#bPin", "#bPhone", "#mPhone"].forEach((s) => digitsOnly($(s)));

$("#pinCheck").addEventListener("submit", (e) => {
e.preventDefault();
const v = $("#pinInput").value.trim();
const msg = $("#pinMsg");
if (!/^\d{6}$/.test(v)) { msg.textContent = "Please enter a 6-digit PIN code."; msg.className = "pin-msg bad"; return; }
if (CONFIG.pinRegex.test(v)) {
msg.textContent = `✓ Great news, we serve ${v}. Same-day slots may be available.`;
msg.className = "pin-msg ok";
$("#bPin").value = v;
} else {
msg.textContent = `We don't cover ${v} yet. We currently serve Chennai and nearby suburbs.`;
msg.className = "pin-msg bad";
}
});
$("#areaSearch").addEventListener("input", (e) => {
const q = e.target.value.trim().toLowerCase();
let shown = 0;
$$("#areaList li").forEach((li) => {
const match = li.textContent.toLowerCase().includes(q);
li.hidden = !match;
if (match) shown++;
});
$("#areaEmpty").hidden = shown > 0;
});
// Tapping an area chip prefills the booking locality
$$("#areaList li").forEach((li) => {
li.tabIndex = 0;
li.setAttribute("role", "button");
const pick = () => { $("#bArea").value = li.textContent; toast(`${li.textContent} selected for your booking`); };
li.addEventListener("click", pick);
li.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); pick(); } });
});

/* ---------- Form validation helpers ---------- */
const today = new Date();
const toISO = (d) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().split("T")[0];
const bDate = $("#bDate");
const maxDate = new Date(); maxDate.setDate(today.getDate() + 90);
bDate.min = toISO(today);
bDate.max = toISO(maxDate);

const RULES = {
name: (v) => v.trim().length >= 2 || "Please enter your name.",
phone: (v) => /^[6-9]\d{9}$/.test(v) || "Enter a valid 10-digit Indian mobile number.",
service: (v) => !!v || "Please choose a service.",
area: (v) => !!v || "Please select your locality.",
pincode: (v) => CONFIG.pinRegex.test(v) || "We serve Chennai PIN codes only (600xxx).",
address: (v) => v.trim().length >= 10 || "Please enter your full address.",
date: (v) => (v && v >= bDate.min && v <= bDate.max) || "Pick a date within the next 90 days.",
slot: (v) => !!v || "Please choose a time slot.",
qty: (v) => v.trim().length >= 1 || "Please tell us what and how many.",
message: (v) => v.trim().length >= 5 || "Please tell us a little about what you need.",
};
function validate(el) {
const rule = RULES[el.name];
if (!rule) return true;
const res = rule(el.value);
const field = el.closest(".field");
field.classList.toggle("invalid", res !== true);
$(".err", field).textContent = res === true ? "" : res;
el.setAttribute("aria-invalid", res !== true);
return res === true;
}
function validateForm(form) {
const applianceMode = form === $("#bookingForm") && $("#bService").value === "Appliance Deep Cleaning";
const els = $$("input, select, textarea", form).filter((el) => RULES[el.name] && el.type !== "hidden" && !el.disabled && !(applianceMode && el.id === "bQty"));
const ok = els.map(validate).every(Boolean);
if (!ok) { els.find((el) => el.getAttribute("aria-invalid") === "true")?.focus(); return false; }
if (applianceMode) {
const choices = $$("input[name='applianceChoice']:checked", form);
const group = $("#applianceBookingChoices", form);
const valid = choices.length > 0;
group.closest(".field").classList.toggle("invalid", !valid);
$(".err", group.closest(".field")).textContent = valid ? "" : "Please select at least one appliance.";
if (!valid) $$("input[name='applianceChoice']", group).at(0)?.focus();
return valid;
}
return true;
}
[$("#bookingForm"), $("#msgForm")].forEach((form) => {
$$("input, select, textarea", form).forEach((el) => {
el.addEventListener("blur", () => { if (el.value) validate(el); });
el.addEventListener("input", () => { if (el.closest(".field")?.classList.contains("invalid")) validate(el); });
});
});

/* ---------- Booking request (no backend: details go to WhatsApp, team confirms the slot) ---------- */
// Single services and offices ask "what & how many" instead of home size
const DETAIL_FIELDS = {
"Appliance Deep Cleaning": ["Selected appliances", "Select appliances in the services section"],
"Kitchen Deep Cleaning": ["Kitchen & add-on details", "e.g. 1 kitchen, 1 fridge, 1 microwave"],
"Bathroom Deep Cleaning": ["How many bathrooms?", "e.g. 2 bathrooms"],
"Sofa & Upholstery Cleaning": ["How many sofa seats?", "e.g. 5 seats (3 + 2)"],
"Mattress Dry Vacuuming": ["How many mattresses?", "e.g. 2 mattresses"],
"Carpet Cleaning": ["What size is the carpet?", "e.g. 6×9 ft"],
"Office / Commercial Cleaning": ["Area & type of space", "e.g. 1,500 sq.ft office"],
};
const fSize = $("#fSize");
const fQty = $("#fQty");
const bQty = $("#bQty");
const applianceBookingChoices = $("#applianceBookingChoices");
const applianceBookingChecks = $$('input[name="applianceChoice"]', applianceBookingChoices);
function updateBookingApplianceValue() {
bQty.value = applianceBookingChecks.filter((input) => input.checked).map((input) => input.value).join(", ");
if (bQty.value) {
fQty.classList.remove("invalid");
$(".err", fQty).textContent = "";
}
}
applianceBookingChecks.forEach((input) => input.addEventListener("change", updateBookingApplianceValue));
let previousBookingService = $("#bService").value;
function syncBookingFields() {
const service = $("#bService").value;
const detail = DETAIL_FIELDS[service];
if (service !== previousBookingService) {
  bQty.value = "";
  if (service !== "Appliance Deep Cleaning") applianceBookingChecks.forEach((input) => { input.checked = false; });
  if (previousBookingService === "Appliance Deep Cleaning" && service !== previousBookingService) applianceBookingChecks.forEach((input) => { input.checked = false; });
  previousBookingService = service;
}
const isApplianceService = service === "Appliance Deep Cleaning";
fSize.hidden = !!detail;
$("#bSize").disabled = !!detail;
fQty.hidden = !detail;
bQty.hidden = isApplianceService;
bQty.disabled = !detail;
applianceBookingChoices.hidden = !isApplianceService;
if (detail) {
$("#bQtyLbl").textContent = isApplianceService ? "Choose appliances" : detail[0];
bQty.placeholder = detail[1];
}
fQty.classList.remove("invalid");
$(".err", fQty).textContent = "";
}
$("#bService").addEventListener("change", syncBookingFields);
syncBookingFields();

function resetBookingForm() {
bookingForm.reset();
bookingForm.classList.remove("has-estimate");
delete bookingForm.dataset.estimate;
$(".field", bookingForm).forEach((field) => field.classList.remove("invalid"));
$(".err", bookingForm).forEach((message) => { message.textContent = ""; });
syncBookingFields();
updateBookingApplianceValue();
}
// Clear details from an earlier enquiry before route-specific click handlers
// prefill the selected service, package size, appliance choices, or estimate.
document.addEventListener("click", (event) => {
const bookingLink = event.target.closest('a[href="#book"]');
if (bookingLink) resetBookingForm();
}, true);

function bookingLines() {
const f = Object.fromEntries(new FormData(bookingForm)); // disabled fields are left out
const date = f.date ? new Date(f.date + "T00:00").toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" }) : "";
return [
["Name", f.name], ["Mobile", "+91 " + f.phone], ["Service", f.service],
f.qty !== undefined ? ["Details", f.qty.trim()] : ["Home size", f.size || "N/A"],
["Booking type", "One-time"],
["Address", `${f.address}, ${f.area}, Chennai ${f.pincode}`],
["Preferred slot", `${date}, ${f.slot}`],
...(f.estimate ? [["Starting estimate", f.estimate.replace("Starting estimate: ", "")]] : []),
...(f.notes?.trim() ? [["Notes", f.notes.trim()]] : []),
];
}
const bookingText = (lines) =>
"Hi Crystal Services, I'd like to request a cleaning slot.\n" +
lines.map(([k, v]) => `${k}: ${v}`).join("\n") +
"\n\nPlease confirm if this slot is available.";

// Open WhatsApp via a real link click (works with popup blockers, unlike window.open + noopener)
function openWhatsApp(text) {
const a = document.createElement("a");
a.href = waLink(text);
a.target = "_blank";
a.rel = "noopener";
document.body.appendChild(a);
a.click();
a.remove();
}

$("#faqMessageForm").addEventListener("submit", (event) => {
event.preventDefault();
const message = $("#faqMessage").value.trim();
if (!message) { $("#faqMessage").focus(); return; }
openWhatsApp(message);
});

bookingForm.addEventListener("submit", (e) => {
e.preventDefault();
if (!validateForm(bookingForm)) { toast("Please fill in the highlighted fields."); return; }
openWhatsApp(bookingText(bookingLines()));
toast("Opening WhatsApp. We'll reply to confirm your slot.");
});

/* ---------- Contact message → WhatsApp ---------- */
$("#msgForm").addEventListener("submit", (e) => {
e.preventDefault();
const form = e.target;
if (!validateForm(form)) return;
const f = Object.fromEntries(new FormData(form));
window.open(waLink(`Hi Crystal Services, this is ${f.name} (+91 ${f.phone}).\n${f.message.trim()}`), "_blank", "noopener");
form.reset();
toast("Opening WhatsApp with your message…");
});

/* ---------- FAQ: one open at a time (fallback for browsers without <details name>) ---------- */
$$(".faq details").forEach((d) => d.addEventListener("toggle", () => {
if (d.open) $$(".faq details").forEach((o) => { if (o !== d) o.open = false; });
}));

onScroll();
