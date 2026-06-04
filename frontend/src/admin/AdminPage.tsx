import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { API_URL, api } from "../lib/api";
import type { Restaurant } from "../lib/types";
import { TabluLogo } from "../components/TabluMark";

function useRestaurants() {
  return useQuery({
    queryKey: ["restaurants"],
    queryFn: () => api<Restaurant[]>("/api/admin/restaurants"),
  });
}

export default function AdminPage() {
  const { data: restaurants, isLoading } = useRestaurants();
  const [showCreate, setShowCreate] = useState(false);
  const qc = useQueryClient();

  const remove = useMutation({
    mutationFn: (id: string) =>
      fetch(`${API_URL}/api/admin/restaurants/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["restaurants"] }),
  });

  return (
    <div className="min-h-full bg-white text-tablu-black">
      <TopNav />

      <main className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 py-8 lg:py-10">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight">Restaurants</h1>
            <p className="text-tablu-gray font-semibold mt-1">
              {restaurants?.length ?? 0} onboarded · add as many cafes and restaurants as you like
            </p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="bg-tablu-orange text-white font-extrabold px-6 py-3 rounded-med shadow-sm hover:brightness-95 transition self-start sm:self-auto">
            + New Restaurant
          </button>
        </div>

        {isLoading && <p className="text-tablu-gray font-semibold">Loading…</p>}

        {restaurants?.length === 0 && (
          <div className="border-2 border-dashed border-tablu-light rounded-xl py-20 text-center">
            <p className="text-lg font-bold text-tablu-black">No restaurants yet</p>
            <p className="text-tablu-gray font-semibold mt-1">Click “New Restaurant” to onboard your first one.</p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {restaurants?.map((r) => (
            <RestaurantCard key={r.id} r={r} onDelete={() => remove.mutate(r.id)} />
          ))}
        </div>
      </main>

      {showCreate && <CreateRestaurantModal onClose={() => setShowCreate(false)} />}
    </div>
  );
}

function TopNav() {
  return (
    <header className="sticky top-0 z-20 bg-white border-b border-tablu-light">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 h-24 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <TabluLogo className="h-16" />
          <nav className="hidden md:flex items-center gap-1">
            <span className="px-3 py-2 rounded-small font-bold text-tablu-black bg-tablu-light/50">
              Restaurants
            </span>
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-tablu-gray">
            Platform Admin
          </span>
          <div className="w-9 h-9 rounded-full bg-tablu-orange text-white grid place-items-center font-extrabold">
            A
          </div>
        </div>
      </div>
    </header>
  );
}

function RestaurantCard({ r, onDelete }: { r: Restaurant; onDelete: () => void }) {
  return (
    <div className="bg-white border border-tablu-light rounded-large p-5 shadow-sm hover:shadow-md transition">
      <div className="flex items-start gap-4">
        <div
          className="w-16 h-16 rounded-med grid place-items-center overflow-hidden shrink-0 border border-tablu-light"
          style={{ background: "#fff" }}>
          {r.logoUrl ? (
            <img src={r.logoUrl} alt="" className="max-w-full max-h-full object-contain" />
          ) : (
            <span className="text-tablu-gray text-[9px] font-bold uppercase">No logo</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-extrabold text-lg truncate">{r.name}</h3>
            <span className="w-3.5 h-3.5 rounded-full shrink-0 border border-black/10"
                  style={{ background: r.primaryColor }} title={r.primaryColor} />
          </div>
          <p className="text-tablu-gray font-semibold text-sm truncate">tablu.app/r/{r.slug}</p>
          <span className="inline-block mt-1 text-[11px] font-bold uppercase tracking-wide text-tablu-gray">
            {r.paymentMode === "AFTER" ? "Pay after" : "Pay upfront"}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 mt-4 mb-4">
        <Stat label="Dishes" value={r._count?.dishes ?? 0} />
        <Stat label="Tables" value={r._count?.tables ?? 0} />
        <Stat label="Orders" value={r._count?.orders ?? 0} />
      </div>

      <div className="flex items-center gap-2">
        <Link to={`/admin/restaurants/${r.id}/menu`}
          className="flex-1 text-center bg-tablu-black text-white font-bold py-2.5 rounded-small hover:bg-black transition">
          Manage menu
        </Link>
        <Link to={`/kitchen/${r.id}`} target="_blank"
          className="px-3 py-2.5 rounded-small font-bold text-tablu-gray hover:text-tablu-orange hover:bg-tablu-orange/10 transition">
          Kitchen
        </Link>
        <button
          onClick={() => confirm(`Delete ${r.name}? This removes all its data.`) && onDelete()}
          className="px-3 py-2.5 rounded-small font-bold text-tablu-gray hover:text-red-600 hover:bg-red-50 transition">
          Delete
        </button>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-tablu-light/40 rounded-small py-2 text-center">
      <div className="font-extrabold text-lg leading-none">{value}</div>
      <div className="text-[10px] font-bold uppercase tracking-wide text-tablu-gray mt-1">{label}</div>
    </div>
  );
}

function CreateRestaurantModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [color, setColor] = useState("#F25623");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [paymentMode, setPaymentMode] = useState<"UPFRONT" | "AFTER">("AFTER");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const autoSlug = (slug || name)
    .toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

  const create = useMutation({
    mutationFn: async () => {
      const fd = new FormData();
      fd.append("name", name);
      if (slug) fd.append("slug", slug);
      fd.append("primaryColor", color);
      if (address) fd.append("address", address);
      if (phone) fd.append("phone", phone);
      fd.append("paymentMode", paymentMode);
      if (logoFile) fd.append("logo", logoFile);
      const res = await fetch(`${API_URL}/api/admin/restaurants`, { method: "POST", body: fd });
      if (!res.ok) throw new Error((await res.json()).error?.toString() || "Failed");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["restaurants"] });
      onClose();
    },
  });

  function onLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] || null;
    setLogoFile(f);
    setLogoPreview(f ? URL.createObjectURL(f) : null);
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-0 sm:p-6"
         onClick={onClose}>
      <div
        className="bg-white w-full sm:max-w-lg sm:rounded-large rounded-t-xl max-h-[92vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-white px-6 py-4 border-b border-tablu-light flex items-center justify-between">
          <h2 className="text-xl font-extrabold">New restaurant</h2>
          <button onClick={onClose} className="text-tablu-gray hover:text-tablu-black font-bold text-2xl leading-none">×</button>
        </div>

        <div className="p-6">
          <Field label="Restaurant name">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Simba Cafe" autoFocus />
          </Field>

          <Field label="Menu URL slug">
            <div className="flex items-center bg-white rounded-small border border-tablu-light focus-within:border-tablu-orange overflow-hidden">
              <span className="text-tablu-gray font-semibold text-sm pl-3">tablu.app/r/</span>
              <input
                className="flex-1 py-2.5 px-1 outline-none font-semibold text-sm"
                value={slug} onChange={(e) => setSlug(e.target.value)} placeholder={autoSlug || "simbacafe"} />
            </div>
          </Field>

          <Field label="Brand color (used across the customer menu)">
            <div className="flex items-center gap-3">
              <input type="color" value={color} onChange={(e) => setColor(e.target.value)}
                className="w-12 h-11 rounded-small border border-tablu-light cursor-pointer p-0.5" />
              <Input value={color} onChange={(e) => setColor(e.target.value)} className="!mb-0 uppercase" />
            </div>
          </Field>

          <Field label="Logo">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-med bg-white border border-tablu-light grid place-items-center overflow-hidden shrink-0">
                {logoPreview
                  ? <img src={logoPreview} alt="" className="max-w-full max-h-full object-contain" />
                  : <span className="text-tablu-gray text-[9px] font-bold uppercase">Logo</span>}
              </div>
              <input ref={fileRef} type="file" accept="image/*" onChange={onLogo}
                className="text-sm font-semibold text-tablu-gray file:mr-3 file:rounded-small file:border-0 file:bg-tablu-orange file:text-white file:px-4 file:py-2 file:font-bold file:cursor-pointer" />
            </div>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Address">
              <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="KN 4 Ave, Kigali" />
            </Field>
            <Field label="Phone">
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+250 788 000 000" />
            </Field>
          </div>

          <Field label="Payment mode">
            <div className="grid grid-cols-2 gap-2">
              {(["AFTER", "UPFRONT"] as const).map((m) => (
                <button key={m} onClick={() => setPaymentMode(m)}
                  className={`py-2.5 rounded-small font-bold text-sm border-2 transition ${
                    paymentMode === m
                      ? "bg-tablu-orange/10 border-tablu-orange text-tablu-orange"
                      : "border-tablu-light text-tablu-gray hover:border-tablu-gray"}`}>
                  {m === "AFTER" ? "Pay after eating" : "Pay upfront"}
                </button>
              ))}
            </div>
          </Field>

          {create.isError && (
            <p className="text-red-600 font-semibold text-sm mb-3">{(create.error as Error).message}</p>
          )}

          <div className="flex gap-3 mt-2">
            <button onClick={onClose}
              className="flex-1 border-2 border-tablu-light font-bold py-3 rounded-med text-tablu-gray hover:border-tablu-gray transition">
              Cancel
            </button>
            <button disabled={!name || create.isPending} onClick={() => create.mutate()}
              className="flex-1 bg-tablu-orange text-white font-extrabold py-3 rounded-med disabled:opacity-40 hover:brightness-95 transition">
              {create.isPending ? "Creating…" : "Create restaurant"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <label className="block text-[11px] font-extrabold uppercase tracking-[0.1em] text-tablu-gray mb-1.5">
        {label}
      </label>
      {children}
    </div>
  );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input {...props}
      className={`w-full bg-white rounded-small px-3 py-2.5 border border-tablu-light outline-none font-semibold text-sm text-tablu-black focus:border-tablu-orange placeholder:text-tablu-gray/60 ${props.className || ""}`} />
  );
}
