import { useEffect, useState } from "react";
import { Routes, Route, Link } from "react-router-dom";
import { API_URL } from "./lib/api";
import { TabluLogo, PoweredByTablu } from "./components/TabluMark";
import AdminPage from "./admin/AdminPage";
import MenuPage from "./admin/MenuPage";
import MenuApp from "./customer/MenuApp";
import KitchenDisplay from "./kitchen/KitchenDisplay";
import ReceiptPage from "./customer/ReceiptPage";

function Landing() {
  const [health, setHealth] = useState<string>("checking…");
  useEffect(() => {
    fetch(`${API_URL}/health`)
      .then((r) => r.json())
      .then((d) => setHealth(d.ok ? "connected" : "error"))
      .catch(() => setHealth("backend offline"));
  }, []);

  return (
    <div className="min-h-full bg-white text-tablu-black flex flex-col items-center justify-center gap-6 p-8 text-center">
      <TabluLogo className="h-32" />
      <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
        Scan. <span className="text-tablu-orange">Order.</span> Pay.
      </h1>
      <p className="text-tablu-gray font-semibold max-w-md">
        Backend <span className="font-extrabold text-tablu-orange">{health}</span>. Onboarding is live.
      </p>
      <Link to="/admin" className="bg-tablu-orange text-white font-extrabold px-7 py-3.5 rounded-med shadow-sm hover:brightness-95 transition">
        Open Admin →
      </Link>
      <PoweredByTablu />
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/admin" element={<AdminPage />} />
      <Route path="/admin/restaurants/:id/menu" element={<MenuPage />} />
      <Route path="/r/:slug" element={<MenuApp />} />
      <Route path="/r/:slug/table/:n" element={<MenuApp />} />
      <Route path="/kitchen/:id" element={<KitchenDisplay />} />
      <Route path="/r/receipt/:publicId" element={<ReceiptPage />} />
    </Routes>
  );
}
