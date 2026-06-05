import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { getSocket } from "../lib/socket";
import type { OrderView, OrderStatus } from "../lib/types";
import { PoweredByTablu } from "../components/TabluMark";
import { PaymentSheet } from "./ui";
import { clearActiveOrder } from "./activeOrder";

const STEPS: OrderStatus[] = ["PLACED", "CONFIRMED", "PREPARING", "READY", "DELIVERED"];

const LABELS: Record<"DINE_IN" | "PICKUP", Record<string, string>> = {
  DINE_IN: { PLACED: "Order placed", CONFIRMED: "Kitchen confirmed", PREPARING: "Preparing your food", READY: "Ready — on its way", DELIVERED: "Delivered. Enjoy!" },
  PICKUP: { PLACED: "Order placed", CONFIRMED: "Kitchen confirmed", PREPARING: "Preparing your order", READY: "Ready for pickup!", DELIVERED: "Picked up. Enjoy!" },
};

export default function OrderPage() {
  const { id = "" } = useParams();
  const { data: order, isLoading, isError, refetch } = useQuery({
    queryKey: ["order", id],
    queryFn: () => api<OrderView>(`/api/r/orders/${id}`),
    retry: false,
  });

  const [status, setStatus] = useState<string | null>(null);
  const [receiptId, setReceiptId] = useState<string | null>(null);
  const [showPay, setShowPay] = useState(false);

  useEffect(() => {
    const socket = getSocket();
    socket.emit("join:order", id);
    const onStatus = (o: { id: string; status: string }) => { if (o.id === id) { setStatus(o.status); refetch(); } };
    const onPaid = (p: { id: string; receiptId: string }) => { if (p.id === id) { setReceiptId(p.receiptId); refetch(); } };
    socket.on("order:status", onStatus);
    socket.on("payment:success", onPaid);
    return () => { socket.off("order:status", onStatus); socket.off("payment:success", onPaid); };
  }, [id, refetch]);

  const curStatus = status || order?.status;
  const restaurant = order?.restaurant;

  // clear the "active order" memory once it's complete (side-effect, not during render)
  useEffect(() => {
    if (curStatus === "DELIVERED" && restaurant?.slug) clearActiveOrder(restaurant.slug);
  }, [curStatus, restaurant?.slug]);

  if (isLoading) return <Splash>Loading your order…</Splash>;
  if (isError || !order) return <Splash>Order not found.</Splash>;

  // defensive fallbacks so a missing field can never blank the page
  const color = restaurant?.primaryColor || "#F25623";
  const rName = restaurant?.name || "Your order";
  const rSlug = restaurant?.slug || "";
  const isPickup = order.type === "PICKUP";
  const cur = (curStatus || "PLACED") as OrderStatus;
  const idx = STEPS.indexOf(cur);
  const labels = LABELS[isPickup ? "PICKUP" : "DINE_IN"];
  const paid = order.paymentStatus === "SUCCESSFUL" || !!receiptId;
  const rid = receiptId || order.receiptId;

  return (
    <div className="min-h-full bg-white text-tablu-black flex flex-col items-center p-6">
      <div className="w-full max-w-sm flex flex-col items-center text-center pt-6">
        {restaurant?.logoUrl
          ? <img src={restaurant.logoUrl} alt="" className="h-14 w-14 rounded-large object-contain border border-tablu-light p-1 mb-3" />
          : <div className="h-14 w-14 rounded-large grid place-items-center text-white text-2xl font-extrabold mb-3" style={{ background: color }}>{rName[0]}</div>}
        <p className="font-bold text-tablu-gray text-sm">{rName}</p>

        {/* Pickup pass OR table */}
        {isPickup ? (
          <div className="mt-4 w-full rounded-large p-5 text-white" style={{ background: color }}>
            <p className="text-[11px] font-extrabold uppercase tracking-widest opacity-80">Pickup code</p>
            <p className="text-5xl font-extrabold tracking-widest mt-1">{order.pickupCode}</p>
            <p className="text-sm font-semibold opacity-90 mt-1">Show this at the counter{order.pickupTime && order.pickupTime !== "ASAP" ? ` · ${order.pickupTime}` : ""}</p>
          </div>
        ) : (
          order.table && <p className="font-extrabold mt-1">Table {order.table.number}</p>
        )}

        <h1 className="text-2xl font-extrabold mt-5">{labels[cur] || cur}</h1>
        <p className="text-tablu-gray font-semibold text-sm">Order #{order.id.slice(-6).toUpperCase()}</p>

        {/* Tracker */}
        <div className="w-full mt-6 space-y-3">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full grid place-items-center text-white text-xs font-extrabold shrink-0"
                style={{ background: i <= idx ? color : "#DEDEDE" }}>{i <= idx ? "✓" : ""}</div>
              <span className={`font-bold text-sm ${i <= idx ? "text-tablu-black" : "text-tablu-gray"}`}>{labels[s]}</span>
            </div>
          ))}
        </div>

        {/* Items */}
        <div className="w-full mt-6 bg-tablu-light/30 rounded-large p-4 text-left">
          {order.items.map((it, i) => (
            <div key={i} className="flex justify-between text-sm py-0.5">
              <span className="font-bold"><span style={{ color }}>{it.qty}×</span> {it.name}</span>
              <span className="font-bold">{(it.qty * it.unitPriceRwf).toLocaleString()}</span>
            </div>
          ))}
          <div className="flex justify-between mt-2 pt-2 border-t border-tablu-light font-extrabold">
            <span>Total</span><span>{order.totalRwf.toLocaleString()} RWF</span>
          </div>
        </div>

        {/* Pay / receipt */}
        <div className="w-full mt-5">
          {paid ? (
            <>
              <div className="flex items-center justify-center gap-2 text-green-600 font-extrabold mb-3">✓ Payment received</div>
              {rid && <a href={`/r/receipt/${rid}`} className="block w-full text-white font-extrabold py-3.5 rounded-xl" style={{ background: color }}>View receipt</a>}
            </>
          ) : (
            <>
              {isPickup && <p className="text-tablu-gray font-semibold text-sm mb-2">Pay now to confirm your pickup order.</p>}
              <button onClick={() => setShowPay(true)} className="w-full text-white font-extrabold py-3.5 rounded-xl" style={{ background: color }}>
                Pay with MoMo
              </button>
            </>
          )}
        </div>

        <a href={`/r/${rSlug}`} className="mt-4 text-tablu-gray font-bold text-sm">← Back to menu</a>
        <div className="mt-8"><PoweredByTablu /></div>
      </div>

      {showPay && (
        <PaymentSheet orderId={order.id} color={color}
          onClose={() => setShowPay(false)} onPaid={(r) => { setReceiptId(r); setShowPay(false); }} />
      )}
    </div>
  );
}

function Splash({ children }: { children: React.ReactNode }) {
  return <div className="min-h-full bg-white grid place-items-center text-tablu-gray font-bold">{children}</div>;
}
