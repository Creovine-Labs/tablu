import { useState } from "react";
import { Link } from "react-router-dom";

/* ------------------------------------------------------------------ *
 * Tablu landing page: RESTAURANT-FACING (the restaurant is the buyer).
 * Layout language from the Brewhaus Framer template (alternating dark /
 * warm-cream sections, centered display headings, pill buttons, marquee
 * tag strips), but the message sells outcomes to operators: more covers,
 * higher tickets, a live kitchen, and guests who come back.
 *
 * Imagery is the real Tablu product (renders from /public/marketing,
 * copied from deck/assets): owner dashboard, kitchen display, guest CRM,
 * the four guest phone screens, the QR table stand, food photography.
 * ------------------------------------------------------------------ */

const A = (f: string) => `/marketing/${f}`;
const CONTACT = "hello@tabluhq.com";
const DEMO = `mailto:${CONTACT}?subject=Tablu%20demo`;
const CREAM = "#F6F1EA";

/* ---------- building blocks ---------- */

function Pill({ href, to, children, variant = "solid", dark = false }: {
  href?: string; to?: string; children: React.ReactNode; variant?: "solid" | "outline"; dark?: boolean;
}) {
  const base = "inline-flex items-center justify-center font-extrabold px-7 py-3.5 rounded-full transition text-sm sm:text-base";
  const styles = variant === "solid"
    ? "bg-tablu-orange text-white hover:brightness-95 shadow-sm"
    : dark ? "border-2 border-white/30 text-white hover:bg-white/10" : "border-2 border-tablu-black/15 text-tablu-black hover:border-tablu-black/40";
  const cls = `${base} ${styles}`;
  if (to) return <Link to={to} className={cls}>{children}</Link>;
  return <a href={href} className={cls}>{children}</a>;
}

function Heading({ children, light = false, className = "" }: { children: React.ReactNode; light?: boolean; className?: string }) {
  return <h2 className={`text-4xl sm:text-5xl lg:text-[3.5rem] leading-[1.02] font-extrabold tracking-tight ${light ? "text-white" : "text-tablu-black"} ${className}`}>{children}</h2>;
}

/** Landscape UI screenshot in a browser chrome (dashboard, kitchen). */
function Browser({ src, alt, dark = false }: { src: string; alt: string; dark?: boolean }) {
  return (
    <div className={`rounded-large overflow-hidden shadow-2xl border ${dark ? "border-white/10" : "border-black/10"} bg-[#1b1b1b]`}>
      <div className="h-8 flex items-center gap-1.5 px-4 bg-[#262626]">
        <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
        <span className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
        <span className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
      </div>
      <img src={src} alt={alt} className="block w-full" />
    </div>
  );
}

function Marquee({ dark = false }: { dark?: boolean }) {
  const tags = ["More covers per shift", "Higher average ticket", "Fewer staff trips", "Live kitchen tickets", "Guests who come back", "MoMo settled instantly"];
  const row = [...tags, ...tags];
  return (
    <div className={`overflow-hidden border-y ${dark ? "bg-tablu-black border-white/10" : "bg-tablu-orange border-transparent"} py-4`}>
      <div className="flex w-max animate-marquee">
        {row.map((t, i) => (
          <span key={i} className={`flex items-center gap-3 px-6 font-extrabold whitespace-nowrap ${dark ? "text-white/90" : "text-white"}`}>
            <span className={dark ? "text-tablu-orange" : "text-white/70"}>✦</span> {t}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ---------- sections ---------- */

function AnnouncementBar() {
  return (
    <div className="bg-tablu-black text-white text-center text-xs sm:text-sm font-bold py-2 px-4">
      Now live in Kigali, <a href={DEMO} className="text-tablu-orange hover:underline">bring Tablu to your restaurant →</a>
    </div>
  );
}

function Nav() {
  const [open, setOpen] = useState(false);
  const left = [["Platform", "#platform"], ["How it works", "#how"]];
  const right = [["Why Tablu", "#why"], ["For guests", "#guests"]];
  return (
    <header className="sticky top-3 z-40 px-4">
      <nav className="max-w-5xl mx-auto bg-white/90 backdrop-blur-md rounded-full shadow-lg shadow-black/5 border border-black/5 px-5 sm:px-7 h-14 flex items-center justify-between">
        <div className="hidden md:flex items-center gap-7 flex-1">
          {left.map(([l, h]) => <a key={h} href={h} className="text-sm font-bold text-tablu-gray hover:text-tablu-black transition">{l}</a>)}
        </div>
        <a href="#top" className="flex items-center md:justify-center md:flex-1"><img src="/brand/tablu-logo-trans.png" alt="Tablu" className="h-6" /></a>
        <div className="hidden md:flex items-center gap-7 flex-1 justify-end">
          {right.map(([l, h]) => <a key={h} href={h} className="text-sm font-bold text-tablu-gray hover:text-tablu-black transition">{l}</a>)}
          <a href={DEMO} className="bg-tablu-orange text-white text-sm font-extrabold px-5 py-2 rounded-full hover:brightness-95 transition">Book a demo</a>
        </div>
        <button className="md:hidden text-tablu-black" onClick={() => setOpen(v => !v)} aria-label="Menu">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            {open ? <path d="M6 6l12 12M18 6L6 18" /> : <><path d="M4 7h16" /><path d="M4 12h16" /><path d="M4 17h16" /></>}
          </svg>
        </button>
      </nav>
      {open && (
        <div className="md:hidden max-w-5xl mx-auto mt-2 bg-white rounded-large shadow-lg border border-black/5 p-5 flex flex-col gap-4">
          {[...left, ...right].map(([l, h]) => <a key={h} href={h} onClick={() => setOpen(false)} className="font-bold text-tablu-black">{l}</a>)}
          <a href={DEMO} className="bg-tablu-orange text-white font-extrabold px-5 py-3 rounded-full text-center">Book a demo</a>
        </div>
      )}
    </header>
  );
}

function Hero() {
  return (
    <section id="top" className="relative bg-tablu-black text-white -mt-[68px] pt-[120px] pb-20 sm:pb-28 px-6 overflow-hidden">
      {/* dark food photography backdrop */}
      <img src={A("_hero_cover.jpg")} alt="" aria-hidden className="absolute inset-0 w-full h-full object-cover opacity-25" />
      <div className="absolute inset-0 bg-gradient-to-b from-tablu-black/70 via-tablu-black/85 to-tablu-black" />
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[800px] h-[600px] rounded-full bg-tablu-orange/15 blur-[120px] pointer-events-none" />

      <div className="relative max-w-3xl mx-auto text-center">
        <h1 className="text-5xl sm:text-6xl lg:text-[4.75rem] leading-[0.98] font-extrabold tracking-tight">
          Run a <span className="text-tablu-orange">smarter</span> restaurant.
        </h1>
        <p className="mt-6 text-lg sm:text-xl text-white/70 font-semibold max-w-xl mx-auto">
          Guests scan, order, and pay from their phone. You get live kitchen tickets, a real-time
          dashboard, and a guest list that brings them back, all from one platform.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Pill href={DEMO}>Book a demo →</Pill>
          <Pill href="#platform" variant="outline" dark>See the platform</Pill>
        </div>
      </div>

      {/* product hero: owner dashboard + guest phone overlap */}
      <div className="relative max-w-5xl mx-auto mt-16">
        <Browser src={A("dashboard.png")} alt="Tablu owner dashboard: revenue, orders, guests and live tickets" dark />
        <img src={A("ph_menu.png")} alt="The Tablu guest menu on a phone" className="hidden sm:block absolute -bottom-10 -left-6 w-44 lg:w-52 drop-shadow-2xl" />
      </div>
    </section>
  );
}

/** Zigzag product feature row. */
function Feature({ img, title, body, points, reverse = false, browser = true }: {
  img: string; title: string; body: string; points: string[]; reverse?: boolean; browser?: boolean;
}) {
  return (
    <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
      <div className={reverse ? "lg:order-2" : ""}>
        <Heading className="!text-4xl sm:!text-5xl">{title}</Heading>
        <p className="mt-4 text-tablu-gray font-semibold text-lg max-w-md">{body}</p>
        <ul className="mt-6 space-y-2.5">
          {points.map((p) => (
            <li key={p} className="flex items-center gap-3 font-bold text-tablu-black">
              <span className="w-5 h-5 rounded-full bg-tablu-orange grid place-items-center text-white text-xs shrink-0">✓</span>{p}
            </li>
          ))}
        </ul>
      </div>
      <div className={reverse ? "lg:order-1" : ""}>
        {browser ? <Browser src={img} alt={title} /> : <img src={img} alt={title} className="w-full rounded-large shadow-2xl border border-black/5" />}
      </div>
    </div>
  );
}

function Platform() {
  return (
    <section id="platform" style={{ background: CREAM }} className="py-20 sm:py-28 px-6">
      <div className="text-center max-w-2xl mx-auto">
        <Heading>Everything you need<br />to run service.</Heading>
        <p className="mt-5 text-tablu-gray font-semibold text-lg">
          Not just a digital menu. Tablu runs ordering, the kitchen, payments, and your guest book, together.
        </p>
      </div>
      <div className="mt-16 space-y-20 sm:space-y-28">
        <Feature
          title="Your whole shift, at a glance."
          body="Live revenue, covers, average ticket and every order as it happens, so you can read the room without leaving the floor."
          points={["Revenue & average ticket in real time", "Dine-in vs pickup at a glance", "Live order feed across the room"]}
          img={A("dashboard.png")}
        />
        <Feature
          reverse
          title="Orders straight to the line."
          body="Every order lands on the kitchen screen the moment it's placed, colour-coded by stage. No paper tickets, no shouting across the pass."
          points={["New / Preparing / Ready columns", "Table & pickup clearly marked", "Nothing lost between front and back"]}
          img={A("kitchen.png")}
        />
        <Feature
          title="Turn diners into regulars."
          body="Every order quietly builds a guest profile: visits, spend, favourite dishes, allergies and notes. Bring people back with something that feels personal."
          points={["Spend, visits & loyalty per guest", "Favourite dishes & dietary notes", "Your guest list, owned by you, not a delivery app"]}
          img={A("crm.png")}
          browser={false}
        />
      </div>
    </section>
  );
}

function VideoMenu() {
  const reels = [
    { src: A("videos/reel-1.mp4"), poster: A("bowl.jpg"), name: "Creamy Linguine", price: "9,500" },
    { src: A("videos/reel-2.mp4"), poster: A("pizza.jpg"), name: "Truffle Tagliatelle", price: "12,000" },
    { src: A("videos/reel-3.mp4"), poster: A("salad.jpg"), name: "Sizzling Wok Greens", price: "6,500" },
    { src: A("videos/reel-4.mp4"), poster: A("served.jpg"), name: "Chef's Noodle Bowl", price: "8,500" },
  ];
  return (
    <section className="bg-tablu-black text-white py-20 sm:py-28 px-6">
      <div className="text-center max-w-2xl mx-auto">
        <Heading light>Guests buy better<br />when they can see it.</Heading>
        <p className="mt-5 text-white/60 font-semibold text-lg">
          Put your dishes in motion. Video on the menu turns &ldquo;I&apos;ll think about it&rdquo; into
          &ldquo;I&apos;ll have that&rdquo;. It lifts the average ticket without a single upsell.
        </p>
      </div>
      <div className="mt-14 grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 max-w-5xl mx-auto">
        {reels.map((r) => (
          <figure key={r.name} className="group">
            <div className="relative aspect-[9/16] rounded-xl overflow-hidden shadow-2xl border border-white/10 bg-white/5">
              <video
                src={r.src} poster={r.poster}
                muted loop autoPlay playsInline preload="metadata"
                className="w-full h-full object-cover"
              />
              <span className="absolute top-3 left-3 bg-black/50 backdrop-blur text-white text-[11px] font-extrabold px-2.5 py-1 rounded-full flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" /> LIVE
              </span>
            </div>
            <figcaption className="mt-3 flex items-center justify-between gap-2">
              <span className="font-extrabold leading-tight">{r.name}</span>
              <span className="font-extrabold text-tablu-orange whitespace-nowrap">{r.price} RWF</span>
            </figcaption>
          </figure>
        ))}
      </div>
      <p className="mt-12 text-center text-white/50 font-semibold text-sm">
        Real, auto-playing video. No tap required. Powered by Tablu&apos;s built-in video pipeline.
      </p>
    </section>
  );
}

/** Scan step: real photo of a guest scanning the Tablu stand, cropped to the phone/hand. */
function ScanShot() {
  return (
    <div className="aspect-[9/16] w-full max-w-[220px] mx-auto rounded-[1.6rem] overflow-hidden shadow-2xl border border-white/10">
      <img src={A("scan.png")} alt="A guest scanning the Tablu code" className="w-full h-full object-cover object-[64%_42%]" />
    </div>
  );
}

function GuestExperience() {
  const screens: { img?: string; scan?: boolean; cap: string; sub: string }[] = [
    { scan: true, cap: "Scan", sub: "Point the camera at the code" },
    { img: A("ph_menu.png"), cap: "Browse", sub: "Opens instantly, no app" },
    { img: A("ph_dish.png"), cap: "See it on video", sub: "Photos & video per dish" },
    { img: A("ph_pay.png"), cap: "Pay with MoMo", sub: "Straight from the phone" },
    { img: A("ph_receipt.png"), cap: "Instant receipt", sub: "Sent the moment they pay" },
  ];
  return (
    <section id="guests" className="bg-tablu-black text-white py-20 sm:py-28 px-6">
      <div className="text-center max-w-2xl mx-auto">
        <Heading light>A beautiful experience<br />for them. Every order, yours.</Heading>
        <p className="mt-5 text-white/60 font-semibold text-lg">
          Guests order from a menu that sells, with photos and video on every dish, and pay before you've printed a bill.
        </p>
      </div>
      <div className="mt-14 grid grid-cols-2 lg:grid-cols-5 gap-8 max-w-6xl mx-auto">
        {screens.map((s, i) => (
          <div key={s.cap} className="text-center">
            {s.scan
              ? <ScanShot />
              : <img src={s.img} alt={s.cap} className="w-full max-w-[220px] mx-auto drop-shadow-2xl" />}
            <p className="mt-5 font-extrabold text-lg flex items-center justify-center gap-2">
              <span className="text-tablu-orange">{i + 1}.</span>{s.cap}
            </p>
            <p className="text-white/50 font-semibold text-sm">{s.sub}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function QRStand() {
  return (
    <section id="how" style={{ background: CREAM }} className="py-20 sm:py-28 px-6">
      <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
        <div>
          <Heading>One scan.<br />No app. Every table.</Heading>
          <p className="mt-5 text-tablu-gray font-semibold text-lg max-w-md">
            We set up your menu and hand you Tablu codes for every table, counter and takeaway bag.
            Guests point their camera and they&apos;re ordering. No download, no account.
          </p>
          <div className="mt-7 grid grid-cols-3 gap-4 max-w-md">
            {[["Scan", "Camera opens the menu"], ["Order", "Sent to your kitchen"], ["Pay", "MoMo, in seconds"]].map(([t, b], i) => (
              <div key={t}>
                <div className="w-9 h-9 rounded-full bg-tablu-orange text-white font-extrabold grid place-items-center">{i + 1}</div>
                <p className="mt-2 font-extrabold text-tablu-black">{t}</p>
                <p className="text-tablu-gray font-semibold text-sm">{b}</p>
              </div>
            ))}
          </div>
          <div className="mt-8"><Pill href={DEMO}>Book a demo →</Pill></div>
        </div>
        <img src={A("_qr_stand_preview.jpg")} alt="Tablu QR table stand on a restaurant table" className="w-full max-w-md mx-auto rounded-xl shadow-2xl" />
      </div>
    </section>
  );
}

function Why() {
  const values = [
    ["More covers per shift", "Guests order and pay on their own time, so tables turn faster without adding staff."],
    ["Higher average ticket", "A visual, video menu nudges the extra side, drink or dessert. No upsell script needed."],
    ["Fewer staff trips", "No running menus, taking orders or chasing bills. Your team focuses on hospitality."],
    ["Guests who come back", "Every order builds your guest list, so you can bring people back, not just serve them once."],
  ];
  return (
    <section id="why" style={{ background: CREAM }} className="py-20 sm:py-28 px-6">
      <div className="text-center max-w-2xl mx-auto">
        <Heading>It pays for itself<br />on a busy night.</Heading>
      </div>
      <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-10 max-w-6xl mx-auto">
        {values.map(([t, b]) => (
          <div key={t}>
            <div className="w-11 h-11 rounded-full bg-tablu-orange/15 grid place-items-center text-tablu-orange font-extrabold text-lg">✦</div>
            <h3 className="mt-4 text-xl font-extrabold text-tablu-black">{t}</h3>
            <p className="mt-2 text-tablu-gray font-semibold">{b}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function Testimonials() {
  const quotes = [
    { q: "We turn tables noticeably faster on weekends. Guests pay the second they're ready.", n: "Patrick M.", r: "Café owner, Kimihurura" },
    { q: "The video menu does the upselling for us. Average tickets are up since we switched.", n: "Jordan T.", r: "Restaurant manager, Nyarutarama" },
    { q: "Setup took an afternoon. Now every order lands in the kitchen with zero confusion.", n: "Sofia R.", r: "Bar & grill, Kigali Heights" },
  ];
  return (
    <section style={{ background: CREAM }} className="py-20 sm:py-28 px-6">
      <div className="text-center max-w-2xl mx-auto">
        <Heading>What operators say.</Heading>
      </div>
      <div className="mt-14 grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {quotes.map((t) => (
          <figure key={t.n} className="bg-white rounded-xl p-7 shadow-sm flex flex-col">
            <span className="text-tablu-orange text-5xl font-extrabold leading-none">&ldquo;</span>
            <blockquote className="mt-2 text-lg font-bold text-tablu-black leading-snug flex-1">{t.q}</blockquote>
            <figcaption className="mt-5 font-extrabold text-tablu-black">{t.n}<span className="block text-sm font-bold text-tablu-gray">{t.r}</span></figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}

function CTABand() {
  return (
    <section className="px-6 py-16" style={{ background: CREAM }}>
      <div className="bg-tablu-orange rounded-2xl px-8 py-14 sm:px-16 sm:py-20 text-center text-white max-w-6xl mx-auto">
        <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight">Bring Tablu to your restaurant.</h2>
        <p className="mt-4 text-lg font-semibold text-white/90 max-w-xl mx-auto">
          See it live on your own menu. We&apos;ll set up a demo and walk you through it. No commitment.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <a href={DEMO} className="bg-white text-tablu-black font-extrabold px-8 py-4 rounded-full shadow-sm hover:bg-white/90 transition">Book a demo →</a>
          <Link to="/admin" className="bg-tablu-black/20 text-white font-extrabold px-8 py-4 rounded-full hover:bg-tablu-black/30 transition">Restaurant login</Link>
        </div>
        <p className="mt-6 font-bold text-white/80">Kigali, Rwanda · <a href={`mailto:${CONTACT}`} className="underline">{CONTACT}</a></p>
      </div>
    </section>
  );
}

function Footer() {
  const cols = [
    { h: "Platform", links: [["Dashboard & kitchen", "#platform"], ["How it works", "#how"], ["Why Tablu", "#why"], ["Guest experience", "#guests"]] },
    { h: "Company", links: [["Book a demo", DEMO], ["Restaurant login", "/admin"]] },
  ];
  return (
    <footer className="bg-tablu-black text-white">
      <div className="max-w-6xl mx-auto px-6 py-16 grid sm:grid-cols-2 lg:grid-cols-4 gap-10">
        <div className="lg:col-span-2">
          <img src={A("logo_white.png")} alt="Tablu" className="h-8" />
          <p className="mt-5 text-white/55 font-semibold max-w-xs">The ordering and guest platform for modern restaurants in Kigali. Scan. Order. Pay.</p>
          <a href={`mailto:${CONTACT}`} className="mt-4 inline-block font-extrabold text-tablu-orange">{CONTACT}</a>
        </div>
        {cols.map((c) => (
          <div key={c.h}>
            <p className="font-extrabold uppercase tracking-wide text-xs text-white/50">{c.h}</p>
            <ul className="mt-4 space-y-3">
              {c.links.map(([label, href]) => (
                <li key={label}>
                  {href.startsWith("/")
                    ? <Link to={href} className="font-bold text-white/80 hover:text-white">{label}</Link>
                    : <a href={href} className="font-bold text-white/80 hover:text-white">{label}</a>}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-white/10">
        <div className="max-w-6xl mx-auto px-6 py-6 flex flex-wrap items-center justify-between gap-3 text-sm font-bold text-white/50">
          <span>© 2026 Tablu. All rights reserved.</span>
          <a href="#top" className="hover:text-white">Back to top ↑</a>
        </div>
      </div>
    </footer>
  );
}

export default function LandingPage() {
  return (
    <div className="bg-white min-h-full">
      <AnnouncementBar />
      <Nav />
      <main>
        <Hero />
        <Marquee dark />
        <VideoMenu />
        <Platform />
        <QRStand />
        <GuestExperience />
        <Why />
        <Testimonials />
        <CTABand />
        <Marquee />
      </main>
      <Footer />
    </div>
  );
}
