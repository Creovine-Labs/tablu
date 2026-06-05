import "dotenv/config";
import express from "express";
import cors from "cors";
import { createServer } from "http";
import { initRealtime } from "./realtime.js";
import { ensureBrandingBucket } from "./lib/supabase.js";
import adminRouter from "./routes/admin.js";
import menuRouter from "./routes/menu.js";
import customerRouter from "./routes/customer.js";
import ordersRouter from "./routes/orders.js";
import dashboardRouter from "./routes/dashboard.js";

const app = express();
const PORT = Number(process.env.PORT) || 4000;
// Comma-separated list of allowed origins (prod Vercel URL(s) + localhost).
// Trailing slashes are stripped so "https://app.vercel.app/" still matches.
const stripSlash = (s: string) => s.trim().replace(/\/+$/, "");
const ORIGINS = (process.env.CLIENT_ORIGIN || "http://localhost:5173")
  .split(",").map(stripSlash).filter(Boolean);

const corsOrigin = (origin: string | undefined, cb: (e: Error | null, ok?: boolean) => void) => {
  // allow non-browser clients (no Origin) and any matching origin
  if (!origin || ORIGINS.includes(stripSlash(origin))) return cb(null, true);
  cb(null, false);
};

app.use(cors({ origin: corsOrigin }));
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "tablu-backend", time: new Date().toISOString() });
});

// Route modules — mounted as each phase lands:
app.use("/api/admin", adminRouter); // Phase 1 — onboarding
app.use("/api/menu", menuRouter); // Phase 2 — menu + video
app.use("/api/r", customerRouter); // Phase 3 — customer menu + orders
app.use("/api/orders", ordersRouter); // Phase 4 — kitchen display
app.use("/api/dashboard", dashboardRouter); // Phase 6 — owner dashboard + CRM
// app.use("/api/momo", momoRouter);          // Phase 5

const server = createServer(app);
initRealtime(server, ORIGINS);

ensureBrandingBucket()
  .then(() => console.log("Branding storage bucket ready"))
  .catch((e) => console.error("Bucket init failed:", e.message));

server.listen(PORT, () => {
  console.log(`Tablu backend running on http://localhost:${PORT}`);
});
