import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { getSocket } from "../lib/socket";
import type { PublicMenu, PublicDish, CartLine } from "../lib/types";
import { MuxVideo } from "./MuxVideo";
import { PoweredByTablu } from "../components/TabluMark";

type View = "menu" | "cart" | "checkout" | "tracker";

export default function MenuApp() {
  const { slug = "", n } = useParams();
  const { data: menu, isLoading, isError } = useQuery({
    queryKey: ["menu", slug],
    queryFn: () => api<PublicMenu>(`/api/r/${slug}`),
    retry: false,
  });

  const [cart, setCart] = useState<CartLine[]>([]);
  const [selected, setSelected] = useState<PublicDish | null>(null);
  const [view, setView] = useState<View>("menu");
  const [activeCat, setActiveCat] = useState<string>("all");
  const [orderId, setOrderId] = useState<string | null>(null);

  const color = menu?.primaryColor || "#F25623";
  const count = cart.reduce((s, l) => s + l.qty, 0);
  const total = cart.reduce((s, l) => s + l.qty * l.dish.priceRwf, 0);

  function addToCart(dish: PublicDish, qty: number, special?: string) {
    setCart((prev) => {
      const i = prev.findIndex((l) => l.dish.id === dish.id && l.specialInstructions === special);
      if (i >= 0) {
        const next = [...prev];
        next[i] = { ...next[i], qty: next[i].qty + qty };
        return next;
      }
      return [...prev, { dish, qty, specialInstructions: special }];
    });
    setSelected(null);
  }
  function setQty(idx: number, qty: number) {
    setCart((prev) => (qty <= 0 ? prev.filter((_, i) => i !== idx) : prev.map((l, i) => (i === idx ? { ...l, qty } : l))));
  }

  if (isLoading) return <Splash>Loading menu…</Splash>;
  if (isError || !menu) return <Splash>Menu not found.</Splash>;

  if (view === "tracker" && orderId)
    return <OrderTracker menu={menu} orderId={orderId} color={color} tableNumber={n} />;

  const filtered = activeCat === "all" ? menu.dishes : menu.dishes.filter((d) => d.categoryId === activeCat);

  return (
    <div className="min-h-full bg-white text-tablu-black flex flex-col" style={{ ["--brand" as string]: color }}>
      {/* Header */}
      <header className="sticky top-0 z-20 bg-white border-b border-tablu-light">
        <div className="px-4 py-3 flex items-center gap-3">
          {menu.logoUrl
            ? <img src={menu.logoUrl} alt={menu.name} className="h-10 w-10 rounded-med object-contain border border-tablu-light p-0.5" />
            : <div className="h-10 w-10 rounded-med grid place-items-center font-extrabold text-white" style={{ background: color }}>{menu.name[0]}</div>}
          <div className="flex-1 min-w-0">
            <h1 className="font-extrabold text-lg leading-tight truncate">{menu.name}</h1>
            {n && <p className="text-tablu-gray font-bold text-xs">Table {n}</p>}
          </div>
        </div>
        {/* Category tabs */}
        <div className="flex gap-2 px-4 pb-3 overflow-x-auto no-scrollbar">
          <Tab active={activeCat === "all"} onClick={() => setActiveCat("all")} color={color}>All</Tab>
          {menu.categories.map((c) => (
            <Tab key={c.id} active={activeCat === c.id} onClick={() => setActiveCat(c.id)} color={color}>{c.name}</Tab>
          ))}
        </div>
      </header>

      {/* Dish list */}
      <main className="flex-1 p-4 grid grid-cols-1 sm:grid-cols-2 gap-4 pb-28">
        {filtered.length === 0 && <p className="text-tablu-gray font-semibold col-span-full text-center py-12">No dishes here yet.</p>}
        {filtered.map((d) => <DishCard key={d.id} dish={d} color={color} onOpen={() => setSelected(d)} onAdd={() => addToCart(d, 1)} />)}
      </main>

      <PoweredByTablu />

      {/* Floating cart bar */}
      {count > 0 && view === "menu" && (
        <button onClick={() => setView("cart")}
          className="fixed bottom-4 left-4 right-4 z-30 text-white font-extrabold py-4 rounded-xl shadow-xl flex items-center justify-between px-5"
          style={{ background: color }}>
          <span className="bg-white/25 rounded-full px-3 py-0.5">{count}</span>
          <span>View order</span>
          <span>{total.toLocaleString()} RWF</span>
        </button>
      )}

      {/* Dish detail */}
      {selected && <DishDetail dish={selected} color={color} onClose={() => setSelected(null)} onAdd={addToCart} />}

      {/* Cart */}
      {view === "cart" && (
        <CartSheet cart={cart} color={color} total={total} onQty={setQty}
          onClose={() => setView("menu")} onCheckout={() => setView("checkout")} />
      )}

      {/* Checkout */}
      {view === "checkout" && (
        <CheckoutSheet menu={menu} cart={cart} total={total} color={color} tableNumber={n}
          onClose={() => setView("cart")}
          onPlaced={(id) => { setOrderId(id); setView("tracker"); setCart([]); }} />
      )}
    </div>
  );
}

function Tab({ active, onClick, color, children }: { active: boolean; onClick: () => void; color: string; children: React.ReactNode }) {
  return (
    <button onClick={onClick}
      className={`shrink-0 px-4 py-1.5 rounded-full font-bold text-sm border-2 transition ${active ? "text-white border-transparent" : "border-tablu-light text-tablu-gray"}`}
      style={active ? { background: color } : undefined}>
      {children}
    </button>
  );
}

function DishCard({ dish, color, onOpen, onAdd }: { dish: PublicDish; color: string; onOpen: () => void; onAdd: () => void }) {
  const hasMedia = dish.hlsUrl || dish.imageUrl || dish.thumbnailUrl;
  return (
    <div className="bg-white border border-tablu-light rounded-large overflow-hidden shadow-sm flex flex-col">
      <button onClick={onOpen} className="relative block aspect-[4/3] bg-tablu-light/40">
        {dish.hlsUrl
          ? <MuxVideo src={dish.hlsUrl} poster={dish.thumbnailUrl} className="w-full h-full object-cover" inline />
          : (dish.imageUrl || dish.thumbnailUrl)
            ? <img src={dish.imageUrl || dish.thumbnailUrl!} alt={dish.name} className="w-full h-full object-cover" />
            : <div className="w-full h-full grid place-items-center text-tablu-gray font-bold">{dish.name}</div>}
        {dish.hlsUrl && <span className="absolute top-2 right-2 bg-black/60 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full">▶</span>}
      </button>
      <div className="p-3 flex flex-col flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-extrabold leading-tight">{dish.name}</h3>
        </div>
        {dish.description && <p className="text-tablu-gray font-medium text-xs mt-1 line-clamp-2">{dish.description}</p>}
        {dish.dietaryTags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {dish.dietaryTags.map((t) => <span key={t} className="bg-tablu-light/60 rounded-full px-2 py-0.5 text-[10px] font-bold">{t}</span>)}
          </div>
        )}
        <div className="flex items-center justify-between mt-3 pt-1">
          <span className="font-extrabold" style={{ color }}>{dish.priceRwf.toLocaleString()} RWF</span>
          <button onClick={onAdd} className="text-white font-extrabold text-sm px-4 py-1.5 rounded-full" style={{ background: color }}>+ Add</button>
        </div>
        {!hasMedia && null}
      </div>
    </div>
  );
}

function DishDetail({ dish, color, onClose, onAdd }: { dish: PublicDish; color: string; onClose: () => void; onAdd: (d: PublicDish, q: number, s?: string) => void }) {
  const [qty, setQty] = useState(1);
  const [special, setSpecial] = useState("");
  return (
    <Sheet onClose={onClose}>
      <div className="aspect-[4/3] bg-tablu-light/40 rounded-large overflow-hidden mb-4">
        {dish.hlsUrl
          ? <MuxVideo src={dish.hlsUrl} poster={dish.thumbnailUrl} className="w-full h-full object-cover" inline={false} controls />
          : (dish.imageUrl || dish.thumbnailUrl)
            ? <img src={dish.imageUrl || dish.thumbnailUrl!} alt={dish.name} className="w-full h-full object-cover" />
            : <div className="w-full h-full grid place-items-center text-tablu-gray font-bold text-xl">{dish.name}</div>}
      </div>
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-2xl font-extrabold">{dish.name}</h2>
        <span className="text-xl font-extrabold whitespace-nowrap" style={{ color }}>{dish.priceRwf.toLocaleString()} RWF</span>
      </div>
      {dish.description && <p className="text-tablu-gray font-medium mt-2">{dish.description}</p>}
      {dish.allergens && <p className="text-tablu-gray font-semibold text-sm mt-2">Allergens: {dish.allergens}</p>}

      <label className="block text-[11px] font-extrabold uppercase tracking-wide text-tablu-gray mt-5 mb-1.5">Special instructions</label>
      <textarea value={special} onChange={(e) => setSpecial(e.target.value)} rows={2} placeholder="No onions, extra spicy…"
        className="w-full bg-white rounded-small px-3 py-2.5 border border-tablu-light outline-none font-semibold text-sm focus:border-tablu-orange resize-none" />

      <div className="flex items-center gap-4 mt-5">
        <div className="flex items-center gap-4 border-2 border-tablu-light rounded-full px-3 py-1.5">
          <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="font-extrabold text-xl w-6">−</button>
          <span className="font-extrabold w-5 text-center">{qty}</span>
          <button onClick={() => setQty((q) => q + 1)} className="font-extrabold text-xl w-6">+</button>
        </div>
        <button onClick={() => onAdd(dish, qty, special || undefined)}
          className="flex-1 text-white font-extrabold py-3.5 rounded-xl" style={{ background: color }}>
          Add · {(dish.priceRwf * qty).toLocaleString()} RWF
        </button>
      </div>
    </Sheet>
  );
}

function CartSheet({ cart, color, total, onQty, onClose, onCheckout }:
  { cart: CartLine[]; color: string; total: number; onQty: (i: number, q: number) => void; onClose: () => void; onCheckout: () => void }) {
  return (
    <Sheet onClose={onClose} title="Your order">
      <div className="space-y-3">
        {cart.map((l, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="flex-1">
              <p className="font-extrabold">{l.dish.name}</p>
              {l.specialInstructions && <p className="text-tablu-gray text-xs font-semibold">{l.specialInstructions}</p>}
              <p className="font-bold text-sm" style={{ color }}>{(l.dish.priceRwf * l.qty).toLocaleString()} RWF</p>
            </div>
            <div className="flex items-center gap-3 border-2 border-tablu-light rounded-full px-3 py-1">
              <button onClick={() => onQty(i, l.qty - 1)} className="font-extrabold text-lg">−</button>
              <span className="font-extrabold w-4 text-center">{l.qty}</span>
              <button onClick={() => onQty(i, l.qty + 1)} className="font-extrabold text-lg">+</button>
            </div>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between mt-6 pt-4 border-t border-tablu-light">
        <span className="font-extrabold text-lg">Total</span>
        <span className="font-extrabold text-lg">{total.toLocaleString()} RWF</span>
      </div>
      <button onClick={onCheckout} disabled={cart.length === 0}
        className="w-full text-white font-extrabold py-4 rounded-xl mt-4 disabled:opacity-40" style={{ background: color }}>
        Checkout
      </button>
    </Sheet>
  );
}

function CheckoutSheet({ menu, cart, total, color, tableNumber, onClose, onPlaced }:
  { menu: PublicMenu; cart: CartLine[]; total: number; color: string; tableNumber?: string; onClose: () => void; onPlaced: (id: string) => void }) {
  const [name, setName] = useState("");
  const [table, setTable] = useState(tableNumber || "");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [mkRest, setMkRest] = useState(false);
  const [mkTablu, setMkTablu] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function place() {
    setBusy(true); setErr(null);
    try {
      const order = await api<{ id: string }>(`/api/r/${menu.slug}/orders`, {
        method: "POST",
        body: JSON.stringify({
          tableNumber: table || undefined, name, phone: phone || undefined, email: email || undefined,
          marketingRestaurant: mkRest, marketingTablu: mkTablu,
          items: cart.map((l) => ({ dishId: l.dish.id, qty: l.qty, specialInstructions: l.specialInstructions })),
        }),
      });
      onPlaced(order.id);
    } catch (e) {
      setErr((e as Error).message); setBusy(false);
    }
  }

  return (
    <Sheet onClose={onClose} title="Almost there">
      <label className="block text-[11px] font-extrabold uppercase tracking-wide text-tablu-gray mb-1.5">Table number <span style={{ color }}>*</span></label>
      <CInput value={table} onChange={(e) => setTable(e.target.value)} placeholder="e.g. 12" inputMode="numeric" autoFocus={!tableNumber} />
      <label className="block text-[11px] font-extrabold uppercase tracking-wide text-tablu-gray mb-1.5">Name <span style={{ color }}>*</span></label>
      <CInput value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" autoFocus={!!tableNumber} />
      <label className="block text-[11px] font-extrabold uppercase tracking-wide text-tablu-gray mb-1.5">Phone <span className="text-tablu-gray">(for receipt & updates)</span></label>
      <CInput value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+250 788 000 000" inputMode="tel" />
      <label className="block text-[11px] font-extrabold uppercase tracking-wide text-tablu-gray mb-1.5">Email <span className="text-tablu-gray">(optional)</span></label>
      <CInput value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" inputMode="email" />

      <div className="space-y-2 mt-2 mb-4">
        <Consent checked={mkRest} onChange={setMkRest}>Receive offers from {menu.name}</Consent>
        <Consent checked={mkTablu} onChange={setMkTablu}>Receive offers from Tablu &amp; partner restaurants</Consent>
      </div>

      {err && <p className="text-red-600 font-semibold text-sm mb-2">{err}</p>}
      <button onClick={place} disabled={!name || !table || busy}
        className="w-full text-white font-extrabold py-4 rounded-xl disabled:opacity-40" style={{ background: color }}>
        {busy ? "Placing…" : `Place order · ${total.toLocaleString()} RWF`}
      </button>
      <p className="text-center text-tablu-gray text-xs font-semibold mt-2">
        {menu.paymentMode === "UPFRONT" ? "You'll pay with MoMo next." : "Pay with MoMo after your meal."}
      </p>
    </Sheet>
  );
}

function OrderTracker({ menu, orderId, color, tableNumber }:
  { menu: PublicMenu; orderId: string; color: string; tableNumber?: string }) {
  const STEPS = ["PLACED", "CONFIRMED", "PREPARING", "READY", "DELIVERED"] as const;
  const [status, setStatus] = useState<string>("PLACED");
  const [showPay, setShowPay] = useState(false);
  const [receiptId, setReceiptId] = useState<string | null>(null);

  useEffect(() => {
    const socket = getSocket();
    socket.emit("join:order", orderId);
    const onUpdate = (o: { id: string; status: string }) => { if (o.id === orderId) setStatus(o.status); };
    const onPaid = (p: { id: string; receiptId: string }) => { if (p.id === orderId) setReceiptId(p.receiptId); };
    socket.on("order:status", onUpdate);
    socket.on("payment:success", onPaid);
    return () => { socket.off("order:status", onUpdate); socket.off("payment:success", onPaid); };
  }, [orderId]);

  const idx = STEPS.indexOf(status as typeof STEPS[number]);
  const labels: Record<string, string> = {
    PLACED: "Order placed", CONFIRMED: "Kitchen confirmed", PREPARING: "Preparing your food", READY: "Ready — on its way", DELIVERED: "Delivered. Enjoy!",
  };

  return (
    <div className="min-h-full bg-white text-tablu-black flex flex-col items-center justify-center p-6 text-center">
      {menu.logoUrl && <img src={menu.logoUrl} alt="" className="h-14 w-14 rounded-large object-contain border border-tablu-light p-1 mb-4" />}
      <div className="w-20 h-20 rounded-full grid place-items-center text-white text-3xl font-extrabold mb-4" style={{ background: color }}>✓</div>
      <h1 className="text-2xl font-extrabold">{labels[status]}</h1>
      {tableNumber && <p className="text-tablu-gray font-bold mt-1">Table {tableNumber}</p>}
      <p className="text-tablu-gray font-semibold text-sm mt-1">Order #{orderId.slice(-6).toUpperCase()}</p>

      <div className="w-full max-w-xs mt-8 space-y-3">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-full grid place-items-center text-white text-xs font-extrabold shrink-0"
              style={{ background: i <= idx ? color : "#DEDEDE" }}>{i <= idx ? "✓" : ""}</div>
            <span className={`font-bold text-sm ${i <= idx ? "text-tablu-black" : "text-tablu-gray"}`}>{labels[s]}</span>
          </div>
        ))}
      </div>

      <div className="w-full max-w-xs mt-8">
        {receiptId ? (
          <>
            <div className="flex items-center justify-center gap-2 text-green-600 font-extrabold mb-3">✓ Payment received</div>
            <a href={`/r/receipt/${receiptId}`} className="block w-full text-white font-extrabold py-3.5 rounded-xl" style={{ background: color }}>
              View receipt
            </a>
          </>
        ) : (
          <button onClick={() => setShowPay(true)} className="w-full text-white font-extrabold py-3.5 rounded-xl" style={{ background: color }}>
            Pay with MoMo
          </button>
        )}
      </div>

      <div className="mt-10"><PoweredByTablu /></div>

      {showPay && (
        <PaymentSheet orderId={orderId} color={color}
          onClose={() => setShowPay(false)} onPaid={(rid) => { setReceiptId(rid); setShowPay(false); }} />
      )}
    </div>
  );
}

function PaymentSheet({ orderId, color, onClose, onPaid }:
  { orderId: string; color: string; onClose: () => void; onPaid: (receiptId: string) => void }) {
  const [phone, setPhone] = useState("");
  const [phase, setPhase] = useState<"enter" | "awaiting" | "failed">("enter");
  const [err, setErr] = useState<string | null>(null);

  async function pay() {
    setPhase("awaiting"); setErr(null);
    try {
      const init = await api<{ simulated: boolean }>(`/api/r/orders/${orderId}/pay`, {
        method: "POST", body: JSON.stringify({ phone }),
      });
      // give the MoMo prompt a realistic beat, then poll
      const delay = init.simulated ? 3500 : 2000;
      await new Promise((r) => setTimeout(r, delay));
      for (let i = 0; i < 30; i++) {
        const s = await api<{ status: string; receiptId?: string }>(`/api/r/orders/${orderId}/payment-status`);
        if (s.status === "SUCCESSFUL" && s.receiptId) return onPaid(s.receiptId);
        if (s.status === "FAILED") { setPhase("failed"); setErr("Payment was declined or timed out."); return; }
        await new Promise((r) => setTimeout(r, 2500));
      }
      setPhase("failed"); setErr("Timed out waiting for confirmation.");
    } catch (e) {
      setPhase("failed"); setErr((e as Error).message);
    }
  }

  return (
    <Sheet onClose={onClose} title="Pay with MoMo">
      {phase === "awaiting" ? (
        <div className="py-8 text-center">
          <div className="w-16 h-16 mx-auto rounded-full border-4 border-tablu-light border-t-transparent animate-spin mb-5" style={{ borderTopColor: color }} />
          <p className="font-extrabold text-lg">Check your phone</p>
          <p className="text-tablu-gray font-semibold text-sm mt-1">Approve the MTN MoMo prompt to complete payment.</p>
        </div>
      ) : (
        <>
          <p className="text-tablu-gray font-semibold text-sm mb-4">Enter your MTN MoMo number. You'll get a prompt on your phone to approve.</p>
          <label className="block text-[11px] font-extrabold uppercase tracking-wide text-tablu-gray mb-1.5">MoMo phone number</label>
          <CInput value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+250 788 000 000" inputMode="tel" autoFocus />
          {err && <p className="text-red-600 font-semibold text-sm mb-2">{err}</p>}
          <button onClick={pay} disabled={!phone}
            className="w-full text-white font-extrabold py-4 rounded-xl disabled:opacity-40" style={{ background: color }}>
            Confirm &amp; Pay
          </button>
        </>
      )}
    </Sheet>
  );
}

// ─── shared primitives ───
function Sheet({ children, onClose, title }: { children: React.ReactNode; onClose: () => void; title?: string }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="bg-white w-full sm:max-w-md sm:rounded-large rounded-t-2xl max-h-[92vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
        {title && (
          <div className="sticky top-0 bg-white px-5 py-4 border-b border-tablu-light flex items-center justify-between">
            <h2 className="text-xl font-extrabold">{title}</h2>
            <button onClick={onClose} className="text-tablu-gray font-bold text-2xl leading-none">×</button>
          </div>
        )}
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
function CInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className="w-full bg-white rounded-small px-3 py-2.5 mb-4 border border-tablu-light outline-none font-semibold text-sm focus:border-tablu-orange placeholder:text-tablu-gray/60" />;
}
function Consent({ checked, onChange, children }: { checked: boolean; onChange: (v: boolean) => void; children: React.ReactNode }) {
  return (
    <label className="flex items-start gap-2 cursor-pointer">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="mt-0.5 w-4 h-4 accent-tablu-orange" />
      <span className="font-semibold text-sm text-tablu-gray">{children}</span>
    </label>
  );
}
function Splash({ children }: { children: React.ReactNode }) {
  return <div className="min-h-full bg-white grid place-items-center text-tablu-gray font-bold">{children}</div>;
}
