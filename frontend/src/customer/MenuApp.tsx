import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import type { PublicMenu, PublicDish, CartLine, OrderType } from "../lib/types";
import { MuxVideo } from "./MuxVideo";
import { PoweredByTablu } from "../components/TabluMark";
import { Sheet, CInput, Consent } from "./ui";
import { setActiveOrder, getActiveOrder } from "./activeOrder";

type View = "menu" | "cart" | "checkout";

export default function MenuApp() {
  const { slug = "", n } = useParams();
  const navigate = useNavigate();
  const { data: menu, isLoading, isError } = useQuery({
    queryKey: ["menu", slug],
    queryFn: () => api<PublicMenu>(`/api/r/${slug}`),
    retry: false,
  });

  const [cart, setCart] = useState<CartLine[]>([]);
  const [selected, setSelected] = useState<PublicDish | null>(null);
  const [view, setView] = useState<View>("menu");
  const [activeCat, setActiveCat] = useState<string>("all");
  const activeOrderId = getActiveOrder(slug);

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

      {/* Active-order banner — get back to live tracking */}
      {activeOrderId && (
        <Link to={`/r/${slug}/order/${activeOrderId}`}
          className="flex items-center justify-between gap-3 px-4 py-2.5 text-white font-bold text-sm" style={{ background: color }}>
          <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-white animate-pulse" /> You have an active order</span>
          <span className="underline">Track it →</span>
        </Link>
      )}

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
          onPlaced={(id) => { setActiveOrder(slug, id); navigate(`/r/${slug}/order/${id}`); }} />
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
  // If scanned at a table, lock to dine-in; otherwise let the guest choose.
  const [mode, setMode] = useState<OrderType>(tableNumber ? "DINE_IN" : "DINE_IN");
  const [name, setName] = useState("");
  const [table, setTable] = useState(tableNumber || "");
  const [pickupTime, setPickupTime] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [mkRest, setMkRest] = useState(false);
  const [mkTablu, setMkTablu] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const isPickup = mode === "PICKUP";

  async function place() {
    setBusy(true); setErr(null);
    try {
      const order = await api<{ id: string }>(`/api/r/${menu.slug}/orders`, {
        method: "POST",
        body: JSON.stringify({
          type: mode,
          tableNumber: isPickup ? undefined : table || undefined,
          pickupTime: isPickup ? (pickupTime || "ASAP") : undefined,
          name, phone: phone || undefined, email: email || undefined,
          marketingRestaurant: mkRest, marketingTablu: mkTablu,
          items: cart.map((l) => ({ dishId: l.dish.id, qty: l.qty, specialInstructions: l.specialInstructions })),
        }),
      });
      onPlaced(order.id);
    } catch (e) {
      setErr((e as Error).message); setBusy(false);
    }
  }

  const canPlace = name && (isPickup ? !!phone : !!table) && !busy;

  return (
    <Sheet onClose={onClose} title="Almost there">
      {/* Dine-in / Pickup toggle (hidden if scanned at a table) */}
      {!tableNumber && (
        <div className="grid grid-cols-2 gap-2 mb-4">
          {(["DINE_IN", "PICKUP"] as OrderType[]).map((m) => (
            <button key={m} onClick={() => setMode(m)}
              className={`py-2.5 rounded-med font-extrabold text-sm border-2 transition ${mode === m ? "text-white border-transparent" : "border-tablu-light text-tablu-gray"}`}
              style={mode === m ? { background: color } : undefined}>
              {m === "DINE_IN" ? "🍽️ Dine in" : "🛍️ Pickup"}
            </button>
          ))}
        </div>
      )}

      {isPickup ? (
        <>
          <label className="block text-[11px] font-extrabold uppercase tracking-wide text-tablu-gray mb-1.5">Pickup time</label>
          <CInput value={pickupTime} onChange={(e) => setPickupTime(e.target.value)} placeholder="ASAP — or e.g. 1:30 PM" />
        </>
      ) : (
        <>
          <label className="block text-[11px] font-extrabold uppercase tracking-wide text-tablu-gray mb-1.5">Table number <span style={{ color }}>*</span></label>
          <CInput value={table} onChange={(e) => setTable(e.target.value)} placeholder="e.g. 12" inputMode="numeric" autoFocus={!tableNumber} />
        </>
      )}

      <label className="block text-[11px] font-extrabold uppercase tracking-wide text-tablu-gray mb-1.5">Name <span style={{ color }}>*</span></label>
      <CInput value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
      <label className="block text-[11px] font-extrabold uppercase tracking-wide text-tablu-gray mb-1.5">
        Phone {isPickup ? <span style={{ color }}>*</span> : <span className="text-tablu-gray">(for receipt & updates)</span>}
      </label>
      <CInput value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+250 788 000 000" inputMode="tel" />
      <label className="block text-[11px] font-extrabold uppercase tracking-wide text-tablu-gray mb-1.5">Email <span className="text-tablu-gray">(optional)</span></label>
      <CInput value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" inputMode="email" />

      <div className="space-y-2 mt-2 mb-4">
        <Consent checked={mkRest} onChange={setMkRest}>Receive offers from {menu.name}</Consent>
        <Consent checked={mkTablu} onChange={setMkTablu}>Receive offers from Tablu &amp; partner restaurants</Consent>
      </div>

      {err && <p className="text-red-600 font-semibold text-sm mb-2">{err}</p>}
      <button onClick={place} disabled={!canPlace}
        className="w-full text-white font-extrabold py-4 rounded-xl disabled:opacity-40" style={{ background: color }}>
        {busy ? "Placing…" : `Place order · ${total.toLocaleString()} RWF`}
      </button>
      <p className="text-center text-tablu-gray text-xs font-semibold mt-2">
        {isPickup ? "Pay with MoMo next — collect when it's ready." : "Track your order live after placing."}
      </p>
    </Sheet>
  );
}

function Splash({ children }: { children: React.ReactNode }) {
  return <div className="min-h-full bg-white grid place-items-center text-tablu-gray font-bold">{children}</div>;
}
