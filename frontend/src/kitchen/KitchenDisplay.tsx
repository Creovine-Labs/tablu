import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { API_URL, api } from "../lib/api";
import { getSocket } from "../lib/socket";
import type { KitchenOrder, OrderStatus, Restaurant } from "../lib/types";
import { TabluLogo } from "../components/TabluMark";

const NEXT: Record<string, { to: OrderStatus; label: string } | null> = {
  PLACED: { to: "CONFIRMED", label: "Confirm" },
  CONFIRMED: { to: "PREPARING", label: "Start preparing" },
  PREPARING: { to: "READY", label: "Mark ready" },
  READY: { to: "DELIVERED", label: "Mark delivered" },
  DELIVERED: null,
};

const STATUS_COLOR: Record<string, string> = {
  PLACED: "bg-tablu-orange text-white",
  CONFIRMED: "bg-blue-600 text-white",
  PREPARING: "bg-amber-500 text-white",
  READY: "bg-green-600 text-white",
  DELIVERED: "bg-tablu-gray text-white",
};

type Filter = "ALL" | "PLACED" | "PREPARING" | "READY";

export default function KitchenDisplay() {
  const { id = "" } = useParams();
  const [orders, setOrders] = useState<KitchenOrder[]>([]);
  const [filter, setFilter] = useState<Filter>("ALL");
  const [, forceTick] = useState(0);
  const audioCtx = useRef<AudioContext | null>(null);
  const flashId = useRef<string | null>(null);

  const { data: restaurant } = useQuery({
    queryKey: ["restaurant", id],
    queryFn: () => api<Restaurant>(`/api/admin/restaurants/${id}`),
  });

  // live elapsed-time counter
  useEffect(() => {
    const t = setInterval(() => forceTick((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, []);

  // initial load + socket wiring
  useEffect(() => {
    if (!id) return;
    api<KitchenOrder[]>(`/api/orders/${id}`).then(setOrders).catch(() => {});

    const socket = getSocket();
    socket.emit("join:restaurant", id);

    const onNew = (o: KitchenOrder) => {
      setOrders((prev) => (prev.some((p) => p.id === o.id) ? prev : [...prev, o]));
      chime();
      flashId.current = o.id;
      setTimeout(() => { if (flashId.current === o.id) flashId.current = null; forceTick((n) => n + 1); }, 4000);
    };
    const onUpdated = (o: KitchenOrder) => {
      setOrders((prev) => {
        // drop delivered/cancelled out of the active queue
        if (o.status === "DELIVERED" || o.status === "CANCELLED") return prev.filter((p) => p.id !== o.id);
        return prev.map((p) => (p.id === o.id ? o : p));
      });
    };
    socket.on("order:new", onNew);
    socket.on("order:updated", onUpdated);
    return () => { socket.off("order:new", onNew); socket.off("order:updated", onUpdated); };
  }, [id]);

  function chime() {
    try {
      audioCtx.current ||= new AudioContext();
      const ctx = audioCtx.current;
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.frequency.value = 880; o.type = "sine";
      g.gain.setValueAtTime(0.001, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.3, ctx.currentTime + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
      o.start(); o.stop(ctx.currentTime + 0.5);
    } catch { /* user gesture may be needed first */ }
  }

  async function advance(o: KitchenOrder) {
    const next = NEXT[o.status];
    if (!next) return;
    setOrders((prev) => prev.map((p) => (p.id === o.id ? { ...p, status: next.to } : p))); // optimistic
    await fetch(`${API_URL}/api/orders/${o.id}/status`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next.to }),
    }).catch(() => {});
  }

  const visible = orders.filter((o) =>
    filter === "ALL" ? true : filter === "PREPARING" ? o.status === "PREPARING" : filter === "READY" ? o.status === "READY" : o.status === "PLACED" || o.status === "CONFIRMED"
  );
  const newCount = orders.filter((o) => o.status === "PLACED").length;

  return (
    <div className="min-h-full bg-white text-tablu-black">
      <header className="sticky top-0 z-20 bg-white border-b border-tablu-light">
        <div className="px-5 sm:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-extrabold">Live Orders</h1>
            {newCount > 0 && <span className="bg-tablu-orange text-white font-extrabold text-sm px-3 py-1 rounded-full animate-pulse">{newCount} NEW</span>}
            <span className="text-tablu-gray font-bold text-sm hidden sm:inline">{restaurant?.name} · Kitchen</span>
          </div>
          <TabluLogo className="h-8 hidden sm:block" />
        </div>
        <div className="px-5 sm:px-8 flex gap-1 pb-2">
          {(["ALL", "PLACED", "PREPARING", "READY"] as Filter[]).map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-full font-bold text-xs capitalize ${filter === f ? "bg-tablu-black text-white" : "bg-tablu-light/50 text-tablu-gray"}`}>
              {f === "PLACED" ? "Pending" : f.toLowerCase()}
            </button>
          ))}
        </div>
      </header>

      <main className="p-5 sm:p-8">
        {visible.length === 0 && (
          <div className="border-2 border-dashed border-tablu-light rounded-xl py-24 text-center">
            <p className="text-lg font-bold text-tablu-gray">Waiting for orders…</p>
            <p className="text-tablu-gray font-semibold text-sm mt-1">New orders appear here instantly with a chime.</p>
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {visible.map((o) => <OrderCard key={o.id} o={o} flash={flashId.current === o.id} onAdvance={() => advance(o)} />)}
        </div>
      </main>
    </div>
  );
}

function OrderCard({ o, flash, onAdvance }: { o: KitchenOrder; flash: boolean; onAdvance: () => void }) {
  const mins = Math.floor((Date.now() - new Date(o.createdAt).getTime()) / 60000);
  const urgency = mins >= 25 ? "border-red-500 ring-2 ring-red-200" : mins >= 15 ? "border-amber-500 ring-2 ring-amber-100" : "border-tablu-light";
  const next = NEXT[o.status];

  return (
    <div className={`bg-white border-2 rounded-large overflow-hidden shadow-sm ${flash ? "ring-4 ring-tablu-orange/40 animate-pulse" : urgency}`}>
      <div className="flex items-center justify-between px-4 py-3 border-b border-tablu-light">
        {o.type === "PICKUP" ? (
          <span className="text-xl font-extrabold flex items-center gap-2">🛍️ Pickup <span className="text-tablu-orange tracking-widest">{o.pickupCode}</span></span>
        ) : (
          <span className="text-2xl font-extrabold">Table {o.table?.number ?? "—"}</span>
        )}
        <span className={`text-[11px] font-extrabold px-2.5 py-1 rounded-full ${STATUS_COLOR[o.status]}`}>{o.status}</span>
      </div>
      <div className="px-4 py-2 flex items-center justify-between text-tablu-gray">
        <span className="font-bold text-sm">{o.guest?.name ?? "Guest"}{o.type === "PICKUP" && o.pickupTime ? ` · ${o.pickupTime}` : ""}</span>
        <span className={`font-extrabold text-sm ${mins >= 25 ? "text-red-600" : mins >= 15 ? "text-amber-600" : ""}`}>{mins}m</span>
      </div>
      <div className="px-4 py-2 space-y-2">
        {o.items.map((it) => (
          <div key={it.id} className="flex gap-2">
            <span className="font-extrabold w-7 text-tablu-orange">{it.qty}×</span>
            <div className="flex-1">
              <span className="font-bold">{it.nameSnapshot}</span>
              {it.specialInstructions && <p className="text-tablu-gray font-semibold text-xs">↳ {it.specialInstructions}</p>}
            </div>
          </div>
        ))}
      </div>
      <div className="px-4 py-3 border-t border-tablu-light flex items-center justify-between gap-2">
        <span className="font-extrabold text-sm">{o.totalRwf.toLocaleString()} RWF</span>
        {next && (
          <button onClick={onAdvance} className="bg-tablu-black text-white font-extrabold text-sm px-4 py-2 rounded-med hover:bg-black">
            {next.label}
          </button>
        )}
      </div>
    </div>
  );
}
