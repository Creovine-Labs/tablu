import { Routes, Route } from "react-router-dom";
import LandingPage from "./marketing/LandingPage";
import AdminPage from "./admin/AdminPage";
import MenuPage from "./admin/MenuPage";
import MenuApp from "./customer/MenuApp";
import KitchenDisplay from "./kitchen/KitchenDisplay";
import ReceiptPage from "./customer/ReceiptPage";
import OrderPage from "./customer/OrderPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/admin" element={<AdminPage />} />
      <Route path="/admin/restaurants/:id/menu" element={<MenuPage />} />
      <Route path="/r/:slug" element={<MenuApp />} />
      <Route path="/r/:slug/table/:n" element={<MenuApp />} />
      <Route path="/r/:slug/order/:id" element={<OrderPage />} />
      <Route path="/kitchen/:id" element={<KitchenDisplay />} />
      <Route path="/r/receipt/:publicId" element={<ReceiptPage />} />
    </Routes>
  );
}
