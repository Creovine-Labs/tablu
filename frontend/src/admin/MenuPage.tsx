import { useState, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { API_URL, api } from "../lib/api";
import type { Restaurant, Category, Dish } from "../lib/types";
import { TabluLogo } from "../components/TabluMark";

type ConsoleTab = "dashboard" | "menu" | "qr" | "guests";
const TAB_LABEL: Record<ConsoleTab, string> = { dashboard: "Dashboard", menu: "Menu", qr: "QR Code", guests: "Guests" };

export default function MenuPage() {
  const { id = "" } = useParams();
  const [tab, setTab] = useState<ConsoleTab>("dashboard");

  const { data: restaurant } = useQuery({
    queryKey: ["restaurant", id],
    queryFn: () => api<Restaurant>(`/api/admin/restaurants/${id}`),
  });

  return (
    <div className="min-h-full bg-white text-tablu-black">
      <header className="sticky top-0 z-20 bg-white border-b border-tablu-light">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 h-20 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <Link to="/admin" className="text-tablu-gray hover:text-tablu-black font-bold shrink-0">← </Link>
            {restaurant?.logoUrl && (
              <img src={restaurant.logoUrl} alt="" className="h-10 w-10 object-contain rounded-med border border-tablu-light p-1" />
            )}
            <div className="min-w-0">
              <h1 className="text-xl font-extrabold truncate">{restaurant?.name || "Menu"}</h1>
              <p className="text-tablu-gray font-semibold text-sm truncate">tablu.app/r/{restaurant?.slug}</p>
            </div>
          </div>
          <TabluLogo className="h-9 hidden sm:block" />
        </div>
        <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 flex gap-1 overflow-x-auto no-scrollbar">
          {(["dashboard", "menu", "qr", "guests"] as ConsoleTab[]).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-3 font-bold text-sm border-b-2 -mb-px whitespace-nowrap transition ${
                tab === t ? "border-tablu-orange text-tablu-orange" : "border-transparent text-tablu-gray hover:text-tablu-black"}`}>
              {TAB_LABEL[t]}
            </button>
          ))}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 py-8">
        {tab === "dashboard" && <DashboardSection restaurantId={id} />}
        {tab === "menu" && <MenuSection restaurantId={id} />}
        {tab === "qr" && <QrCodeSection restaurantId={id} restaurant={restaurant} />}
        {tab === "guests" && <GuestsSection restaurantId={id} />}
      </main>
    </div>
  );
}

// ─────────── Menu section ───────────

function MenuSection({ restaurantId }: { restaurantId: string }) {
  const qc = useQueryClient();
  const [showAddDish, setShowAddDish] = useState(false);

  const { data: categories } = useQuery({
    queryKey: ["categories", restaurantId],
    queryFn: () => api<Category[]>(`/api/menu/${restaurantId}/categories`),
  });
  const { data: dishes } = useQuery({
    queryKey: ["dishes", restaurantId],
    queryFn: () => api<Dish[]>(`/api/menu/${restaurantId}/dishes`),
  });

  const addCategory = useMutation({
    mutationFn: (name: string) =>
      api(`/api/menu/${restaurantId}/categories`, { method: "POST", body: JSON.stringify({ name }) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["categories", restaurantId] }),
  });

  function promptCategory() {
    const name = prompt("New category name (e.g. Mains, Drinks)");
    if (name?.trim()) addCategory.mutate(name.trim());
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-extrabold uppercase tracking-wide text-tablu-gray mr-1">Categories:</span>
          {categories?.map((c) => (
            <span key={c.id} className="bg-tablu-light/50 rounded-full px-3 py-1.5 font-bold text-sm">{c.name}</span>
          ))}
          <button onClick={promptCategory} className="border-2 border-dashed border-tablu-light rounded-full px-3 py-1.5 font-bold text-sm text-tablu-gray hover:border-tablu-orange hover:text-tablu-orange">
            + Category
          </button>
        </div>
        <button onClick={() => setShowAddDish(true)}
          className="bg-tablu-orange text-white font-extrabold px-5 py-2.5 rounded-med shadow-sm hover:brightness-95">
          + Add Dish
        </button>
      </div>

      {dishes?.length === 0 && (
        <div className="border-2 border-dashed border-tablu-light rounded-xl py-16 text-center">
          <p className="text-lg font-bold">No dishes yet</p>
          <p className="text-tablu-gray font-semibold mt-1">Add your first dish, then upload its video.</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {dishes?.map((d) => <DishCard key={d.id} dish={d} restaurantId={restaurantId} />)}
      </div>

      {showAddDish && (
        <AddDishModal restaurantId={restaurantId} categories={categories || []} onClose={() => setShowAddDish(false)} />
      )}
    </>
  );
}

function DishCard({ dish, restaurantId }: { dish: Dish; restaurantId: string }) {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [status, setStatus] = useState<string | null>(dish.muxStatus);
  const [error, setError] = useState<string | null>(null);

  const refresh = () => qc.invalidateQueries({ queryKey: ["dishes", restaurantId] });

  const toggleAvail = useMutation({
    mutationFn: () => {
      const fd = new FormData();
      fd.append("available", String(!dish.available));
      return fetch(`${API_URL}/api/menu/dishes/${dish.id}`, { method: "PATCH", body: fd });
    },
    onSuccess: refresh,
  });

  const remove = useMutation({
    mutationFn: () => fetch(`${API_URL}/api/menu/dishes/${dish.id}`, { method: "DELETE" }),
    onSuccess: refresh,
  });

  async function uploadVideo(file: File) {
    setError(null);
    setStatus("starting");
    // 1. get a Mux direct upload URL
    const res = await fetch(`${API_URL}/api/menu/dishes/${dish.id}/video-upload`, { method: "POST" });
    if (!res.ok) {
      const e = await res.json().catch(() => ({}));
      setError(e.error || "Could not start upload");
      setStatus(null);
      return;
    }
    const { url } = await res.json();
    // 2. PUT the file straight to Mux with progress
    setProgress(0);
    await new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("PUT", url);
      xhr.upload.onprogress = (ev) => ev.lengthComputable && setProgress(Math.round((ev.loaded / ev.total) * 100));
      xhr.onload = () => (xhr.status < 300 ? resolve() : reject(new Error("Upload failed")));
      xhr.onerror = () => reject(new Error("Upload failed"));
      xhr.send(file);
    }).catch((e) => { setError(e.message); setStatus(null); });
    setProgress(null);
    // 3. poll Mux encoding status
    setStatus("preparing");
    const poll = setInterval(async () => {
      const s = await api<{ status: string }>(`/api/menu/dishes/${dish.id}/video-status`);
      setStatus(s.status);
      if (s.status === "ready" || s.status === "errored") {
        clearInterval(poll);
        refresh();
      }
    }, 2500);
  }

  const thumb = dish.thumbnailUrl || dish.imageUrl;
  const busy = progress !== null || (status && !["ready", "errored", null].includes(status));

  return (
    <div className="bg-white border border-tablu-light rounded-large overflow-hidden shadow-sm">
      <div className="relative aspect-[4/3] bg-tablu-light/40 grid place-items-center">
        {thumb ? (
          <img src={thumb} alt="" className="w-full h-full object-cover" />
        ) : (
          <span className="text-tablu-gray font-bold text-sm">No media</span>
        )}
        {dish.muxStatus === "ready" && (
          <span className="absolute top-2 left-2 bg-black/70 text-white text-[10px] font-extrabold px-2 py-1 rounded-full">▶ VIDEO</span>
        )}
        {!dish.available && (
          <span className="absolute inset-0 bg-white/70 grid place-items-center font-extrabold text-tablu-gray">SOLD OUT</span>
        )}
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-extrabold text-base leading-tight">{dish.name}</h3>
          <span className="font-extrabold text-tablu-orange whitespace-nowrap">{dish.priceRwf.toLocaleString()} RWF</span>
        </div>
        {dish.category && <p className="text-tablu-gray font-semibold text-xs mt-0.5">{dish.category.name}</p>}
        {dish.dietaryTags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {dish.dietaryTags.map((t) => (
              <span key={t} className="bg-tablu-light/60 rounded-full px-2 py-0.5 text-[10px] font-bold">{t}</span>
            ))}
          </div>
        )}

        {/* Video upload control */}
        <div className="mt-3">
          {busy ? (
            <div className="bg-tablu-light/50 rounded-small p-2 text-center">
              {progress !== null ? (
                <>
                  <div className="h-1.5 bg-tablu-light rounded-full overflow-hidden mb-1">
                    <div className="h-full bg-tablu-orange transition-all" style={{ width: `${progress}%` }} />
                  </div>
                  <span className="text-[11px] font-bold text-tablu-gray">Uploading {progress}%</span>
                </>
              ) : (
                <span className="text-[11px] font-bold text-tablu-gray">Encoding video… ({status})</span>
              )}
            </div>
          ) : (
            <button onClick={() => fileRef.current?.click()}
              className="w-full border-2 border-tablu-light rounded-small py-2 font-bold text-sm text-tablu-gray hover:border-tablu-orange hover:text-tablu-orange transition">
              {dish.muxStatus === "ready" ? "Replace video" : "Upload video"}
            </button>
          )}
          <input ref={fileRef} type="file" accept="video/*" className="hidden"
            onChange={(e) => e.target.files?.[0] && uploadVideo(e.target.files[0])} />
          {error && <p className="text-red-600 text-[11px] font-semibold mt-1">{error}</p>}
        </div>

        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-tablu-light">
          <button onClick={() => toggleAvail.mutate()}
            className="flex-1 font-bold text-xs py-2 rounded-small bg-tablu-light/50 hover:bg-tablu-light">
            {dish.available ? "Mark sold out" : "Mark available"}
          </button>
          <button onClick={() => confirm(`Delete ${dish.name}?`) && remove.mutate()}
            className="px-3 py-2 rounded-small font-bold text-xs text-tablu-gray hover:text-red-600 hover:bg-red-50">
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

function AddDishModal({ restaurantId, categories, onClose }:
  { restaurantId: string; categories: Category[]; onClose: () => void }) {
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [tags, setTags] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const create = useMutation({
    mutationFn: async () => {
      const fd = new FormData();
      fd.append("name", name);
      fd.append("priceRwf", price || "0");
      if (description) fd.append("description", description);
      if (categoryId) fd.append("categoryId", categoryId);
      if (tags) fd.append("dietaryTags", tags);
      fd.append("format", image ? "IMAGE" : "TEXT");
      if (image) fd.append("image", image);
      const res = await fetch(`${API_URL}/api/menu/${restaurantId}/dishes`, { method: "POST", body: fd });
      if (!res.ok) throw new Error("Failed to create dish");
      return res.json();
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["dishes", restaurantId] }); onClose(); },
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-0 sm:p-6" onClick={onClose}>
      <div className="bg-white w-full sm:max-w-lg sm:rounded-large rounded-t-xl max-h-[92vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-white px-6 py-4 border-b border-tablu-light flex items-center justify-between">
          <h2 className="text-xl font-extrabold">Add dish</h2>
          <button onClick={onClose} className="text-tablu-gray hover:text-tablu-black font-bold text-2xl leading-none">×</button>
        </div>
        <div className="p-6">
          <L>Dish name</L>
          <I value={name} onChange={(e) => setName(e.target.value)} placeholder="Grilled Tilapia" autoFocus />
          <div className="grid grid-cols-2 gap-3">
            <div><L>Price (RWF)</L><I value={price} onChange={(e) => setPrice(e.target.value.replace(/\D/g, ""))} placeholder="6500" inputMode="numeric" /></div>
            <div>
              <L>Category</L>
              <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}
                className="w-full bg-white rounded-small px-3 py-2.5 border border-tablu-light outline-none font-semibold text-sm focus:border-tablu-orange">
                <option value="">(none)</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>
          <L>Description</L>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Fresh tilapia from Lake Kivu, grilled with herbs."
            className="w-full bg-white rounded-small px-3 py-2.5 mb-4 border border-tablu-light outline-none font-semibold text-sm focus:border-tablu-orange resize-none" rows={2} />
          <L>Dietary tags (comma-separated)</L>
          <I value={tags} onChange={(e) => setTags(e.target.value)} placeholder="Spicy, Popular" />
          <L>Photo (optional, video added after)</L>
          <div className="flex items-center gap-4 mb-5">
            <div className="w-20 h-20 rounded-med bg-tablu-light/40 border border-tablu-light grid place-items-center overflow-hidden shrink-0">
              {preview ? <img src={preview} alt="" className="w-full h-full object-cover" /> : <span className="text-tablu-gray text-[9px] font-bold uppercase">Photo</span>}
            </div>
            <input type="file" accept="image/*" onChange={(e) => { const f = e.target.files?.[0] || null; setImage(f); setPreview(f ? URL.createObjectURL(f) : null); }}
              className="text-sm font-semibold text-tablu-gray file:mr-3 file:rounded-small file:border-0 file:bg-tablu-orange file:text-white file:px-4 file:py-2 file:font-bold file:cursor-pointer" />
          </div>
          {create.isError && <p className="text-red-600 font-semibold text-sm mb-3">{(create.error as Error).message}</p>}
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 border-2 border-tablu-light font-bold py-3 rounded-med text-tablu-gray hover:border-tablu-gray">Cancel</button>
            <button disabled={!name || create.isPending} onClick={() => create.mutate()}
              className="flex-1 bg-tablu-orange text-white font-extrabold py-3 rounded-med disabled:opacity-40 hover:brightness-95">
              {create.isPending ? "Adding…" : "Add dish"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────── QR Code section (one general QR per restaurant) ───────────

function QrCodeSection({ restaurantId, restaurant }: { restaurantId: string; restaurant?: Restaurant }) {
  const qrSrc = `${API_URL}/api/menu/${restaurantId}/qr.png`;
  const menuUrl = restaurant ? `${window.location.origin}/r/${restaurant.slug}` : "";

  return (
    <div className="max-w-xl">
      <h2 className="text-2xl font-extrabold mb-1">Your QR code</h2>
      <p className="text-tablu-gray font-semibold mb-6">
        One QR for the whole restaurant. Print it on table cards, stickers, or your menu.
        Guests scan it, browse your menu, and enter their table number when they order.
      </p>

      <div className="bg-white border border-tablu-light rounded-large p-6 shadow-sm flex flex-col sm:flex-row items-center gap-6">
        <div className="shrink-0 text-center">
          <div className="rounded-large overflow-hidden border-4 p-2" style={{ borderColor: restaurant?.primaryColor || "#F25623" }}>
            <img src={qrSrc} alt="Restaurant QR" className="w-48 h-48" />
          </div>
        </div>
        <div className="flex-1 w-full">
          {restaurant?.logoUrl && <img src={restaurant.logoUrl} alt="" className="h-9 object-contain mb-2" />}
          <p className="font-extrabold text-lg">{restaurant?.name}</p>
          <p className="text-tablu-gray font-semibold text-sm break-all mb-4">{menuUrl}</p>
          <div className="flex gap-2">
            <a href={qrSrc} download={`${restaurant?.slug || "restaurant"}-qr.png`}
              className="flex-1 text-center bg-tablu-black text-white font-extrabold py-2.5 rounded-med hover:bg-black">Download PNG</a>
            <a href={menuUrl} target="_blank" rel="noreferrer"
              className="flex-1 text-center border-2 border-tablu-light font-bold py-2.5 rounded-med text-tablu-gray hover:border-tablu-gray">Preview menu</a>
          </div>
        </div>
      </div>

      <div className="mt-5 bg-tablu-orange/5 border border-tablu-orange/20 rounded-large p-4">
        <p className="font-bold text-sm">💡 How it works</p>
        <p className="text-tablu-gray font-semibold text-sm mt-1">
          Same QR on every table. The customer enters their table number at checkout, so the kitchen always
          knows where to deliver, no need to print a different code per table.
        </p>
      </div>
    </div>
  );
}

// ─────────── Dashboard (overview) ───────────

interface Overview {
  revenueToday: number; ordersToday: number; activeTables: number; activeOrders: number;
  topDishToday: { name: string; qty: number } | null; allTimeRevenue: number; totalGuests: number;
}

function DashboardSection({ restaurantId }: { restaurantId: string }) {
  const qc = useQueryClient();
  const { data, refetch, isFetching } = useQuery({
    queryKey: ["overview", restaurantId],
    queryFn: () => api<Overview>(`/api/dashboard/${restaurantId}/overview`),
    refetchInterval: 10000,
  });

  const reset = useMutation({
    mutationFn: () => fetch(`${API_URL}/api/admin/restaurants/${restaurantId}/reset`, { method: "POST" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["overview", restaurantId] });
      qc.invalidateQueries({ queryKey: ["guests", restaurantId] });
    },
  });

  return (
    <>
      <div className="flex items-center justify-between mb-6 gap-3">
        <h2 className="text-2xl font-extrabold">Today</h2>
        <div className="flex items-center gap-3">
          <button onClick={() => refetch()} className="text-tablu-gray font-bold text-sm hover:text-tablu-black">
            {isFetching ? "Refreshing…" : "↻ Refresh"}
          </button>
          <button
            onClick={() => confirm("Clear ALL orders and guests for this restaurant? The menu is kept. This gives you a fresh, empty dashboard. Cannot be undone.") && reset.mutate()}
            className="font-bold text-sm border-2 border-tablu-light text-tablu-gray px-3 py-1.5 rounded-med hover:border-red-400 hover:text-red-600 transition">
            {reset.isPending ? "Clearing…" : "Reset demo data"}
          </button>
        </div>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <BigStat label="Revenue today" value={`${(data?.revenueToday ?? 0).toLocaleString()} RWF`} accent />
        <BigStat label="Orders today" value={String(data?.ordersToday ?? 0)} />
        <BigStat label="Active tables" value={String(data?.activeTables ?? 0)} />
        <BigStat label="Live orders" value={String(data?.activeOrders ?? 0)} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Panel label="Most ordered today">
          {data?.topDishToday
            ? <p className="text-xl font-extrabold">{data.topDishToday.name} <span className="text-tablu-gray text-sm">×{data.topDishToday.qty}</span></p>
            : <p className="text-tablu-gray font-semibold">No orders yet today</p>}
        </Panel>
        <Panel label="All-time revenue"><p className="text-xl font-extrabold">{(data?.allTimeRevenue ?? 0).toLocaleString()} RWF</p></Panel>
        <Panel label="Total guests"><p className="text-xl font-extrabold">{data?.totalGuests ?? 0}</p></Panel>
      </div>
    </>
  );
}

function BigStat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={`rounded-large p-5 border ${accent ? "bg-tablu-orange text-white border-tablu-orange" : "bg-white border-tablu-light"}`}>
      <div className={`text-[11px] font-extrabold uppercase tracking-wide ${accent ? "text-white/80" : "text-tablu-gray"}`}>{label}</div>
      <div className="text-2xl font-extrabold mt-1">{value}</div>
    </div>
  );
}
function Panel({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-tablu-light rounded-large p-5">
      <div className="text-[11px] font-extrabold uppercase tracking-wide text-tablu-gray mb-2">{label}</div>
      {children}
    </div>
  );
}

// ─────────── Guests (CRM) ───────────

interface GuestRow {
  id: string; name: string; phone: string | null; email: string | null;
  visitCount: number; totalSpentRwf: number; loyaltyPoints: number;
  lastVisit: string; favoriteDish: string | null; marketingRestaurant: boolean;
}

function GuestsSection({ restaurantId }: { restaurantId: string }) {
  const { data: guests, isLoading } = useQuery({
    queryKey: ["guests", restaurantId],
    queryFn: () => api<GuestRow[]>(`/api/dashboard/${restaurantId}/guests`),
  });

  return (
    <>
      <h2 className="text-2xl font-extrabold mb-1">Guests</h2>
      <p className="text-tablu-gray font-semibold mb-6">{guests?.length ?? 0} customers · your direct relationship, not a delivery app's</p>

      {isLoading && <p className="text-tablu-gray font-semibold">Loading…</p>}
      {guests?.length === 0 && (
        <div className="border-2 border-dashed border-tablu-light rounded-xl py-16 text-center">
          <p className="text-lg font-bold">No guests yet</p>
          <p className="text-tablu-gray font-semibold mt-1">They appear here automatically when customers order.</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {guests?.map((g) => (
          <div key={g.id} className="bg-white border border-tablu-light rounded-large p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-11 h-11 rounded-full bg-tablu-orange/10 text-tablu-orange grid place-items-center font-extrabold text-lg">
                {g.name[0]?.toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="font-extrabold truncate">{g.name}</p>
                {g.phone && <p className="text-tablu-gray font-semibold text-xs">{g.phone}</p>}
              </div>
              {g.marketingRestaurant && <span className="ml-auto text-[9px] font-extrabold uppercase bg-green-100 text-green-700 px-2 py-1 rounded-full">Opt-in</span>}
            </div>
            <div className="grid grid-cols-3 gap-2 mb-3">
              <MiniStat label="Visits" value={String(g.visitCount)} />
              <MiniStat label="Spent" value={`${(g.totalSpentRwf / 1000).toFixed(0)}k`} />
              <MiniStat label="Points" value={String(g.loyaltyPoints)} />
            </div>
            <div className="text-sm font-semibold">
              {g.favoriteDish && <p>❤️ Loves <span className="font-extrabold">{g.favoriteDish}</span></p>}
              <p className="text-tablu-gray text-xs mt-1">Last visit {new Date(g.lastVisit).toLocaleDateString()}</p>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-tablu-light/40 rounded-small py-2 text-center">
      <div className="font-extrabold">{value}</div>
      <div className="text-[9px] font-bold uppercase tracking-wide text-tablu-gray">{label}</div>
    </div>
  );
}

function L({ children }: { children: React.ReactNode }) {
  return <label className="block text-[11px] font-extrabold uppercase tracking-[0.1em] text-tablu-gray mb-1.5">{children}</label>;
}
function I(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`w-full bg-white rounded-small px-3 py-2.5 mb-4 border border-tablu-light outline-none font-semibold text-sm focus:border-tablu-orange placeholder:text-tablu-gray/60 ${props.className || ""}`} />;
}
