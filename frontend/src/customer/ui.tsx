import { useState } from "react";
import { api } from "../lib/api";

/** Bottom-sheet on mobile, centered dialog on larger screens. */
export function Sheet({ children, onClose, title }: { children: React.ReactNode; onClose: () => void; title?: string }) {
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

export function CInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`w-full bg-white rounded-small px-3 py-2.5 mb-4 border border-tablu-light outline-none font-semibold text-sm focus:border-tablu-orange placeholder:text-tablu-gray/60 ${props.className || ""}`} />;
}

export function Consent({ checked, onChange, children }: { checked: boolean; onChange: (v: boolean) => void; children: React.ReactNode }) {
  return (
    <label className="flex items-start gap-2 cursor-pointer">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="mt-0.5 w-4 h-4 accent-tablu-orange" />
      <span className="font-semibold text-sm text-tablu-gray">{children}</span>
    </label>
  );
}

/** MoMo payment sheet: initiate, "check your phone", poll to success. */
export function PaymentSheet({ orderId, color, onClose, onPaid }:
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
      await new Promise((r) => setTimeout(r, init.simulated ? 3500 : 2000));
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
