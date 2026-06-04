import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { PoweredByTablu } from "../components/TabluMark";

interface Receipt {
  receiptId: string;
  orderId: string;
  date: string;
  restaurant: { name: string; logoUrl: string | null; primaryColor: string; address: string | null };
  table: string | null;
  guest: string | null;
  items: { name: string; qty: number; unitPriceRwf: number }[];
  totalRwf: number;
  paymentMethod: string;
  momoReference: string | null;
}

export default function ReceiptPage() {
  const { publicId = "" } = useParams();
  const { data: r, isLoading, isError } = useQuery({
    queryKey: ["receipt", publicId],
    queryFn: () => api<Receipt>(`/api/r/receipt/${publicId}`),
    retry: false,
  });

  if (isLoading) return <div className="min-h-full bg-white grid place-items-center text-tablu-gray font-bold">Loading receipt…</div>;
  if (isError || !r) return <div className="min-h-full bg-white grid place-items-center text-tablu-gray font-bold">Receipt not found.</div>;

  const color = r.restaurant.primaryColor;
  const date = new Date(r.date);

  return (
    <div className="min-h-full bg-tablu-light/30 py-8 px-4 flex flex-col items-center">
      <div className="bg-white w-full max-w-sm rounded-large shadow-sm border border-tablu-light overflow-hidden">
        <div className="h-2" style={{ background: color }} />
        <div className="p-6">
          <div className="flex flex-col items-center text-center mb-5">
            {r.restaurant.logoUrl
              ? <img src={r.restaurant.logoUrl} alt="" className="h-14 w-14 object-contain rounded-med border border-tablu-light p-1 mb-2" />
              : <div className="h-14 w-14 rounded-med grid place-items-center text-white text-2xl font-extrabold mb-2" style={{ background: color }}>{r.restaurant.name[0]}</div>}
            <h1 className="text-xl font-extrabold">{r.restaurant.name}</h1>
            {r.restaurant.address && <p className="text-tablu-gray font-semibold text-xs">{r.restaurant.address}</p>}
          </div>

          <div className="flex justify-between text-xs font-semibold text-tablu-gray mb-1">
            <span>{date.toLocaleDateString()} {date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
            {r.table && <span>Table {r.table}</span>}
          </div>
          <div className="flex justify-between text-xs font-semibold text-tablu-gray mb-4">
            <span>Receipt #{r.receiptId.slice(-8).toUpperCase()}</span>
            {r.guest && <span>{r.guest}</span>}
          </div>

          <div className="border-t border-dashed border-tablu-light pt-4 space-y-2">
            {r.items.map((it, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="font-bold"><span style={{ color }}>{it.qty}×</span> {it.name}</span>
                <span className="font-bold">{(it.qty * it.unitPriceRwf).toLocaleString()}</span>
              </div>
            ))}
          </div>

          <div className="border-t border-dashed border-tablu-light mt-4 pt-4 flex justify-between items-center">
            <span className="font-extrabold text-lg">Total</span>
            <span className="font-extrabold text-lg">{r.totalRwf.toLocaleString()} RWF</span>
          </div>

          <div className="mt-4 bg-tablu-light/40 rounded-med p-3 text-xs font-semibold text-tablu-gray">
            <div className="flex justify-between"><span>Paid with</span><span className="font-extrabold text-tablu-black">{r.paymentMethod}</span></div>
            {r.momoReference && <div className="flex justify-between mt-1"><span>Reference</span><span>{r.momoReference}</span></div>}
          </div>

          <button onClick={() => window.print()}
            className="w-full mt-5 text-white font-extrabold py-3 rounded-med print:hidden" style={{ background: color }}>
            Download / Print
          </button>
        </div>
        <PoweredByTablu />
      </div>
    </div>
  );
}
