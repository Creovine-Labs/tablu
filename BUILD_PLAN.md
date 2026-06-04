# Tablu — Build Plan

**Status:** In progress
**Goal:** Real multi-tenant Tablu platform. Onboard real restaurants (Simba + others), each with their own logo, branding, and uploaded dish videos. Full live loop: scan → video menu → order → kitchen → MoMo → receipt → CRM.

---

## Architecture (locked)

| Layer | Choice | Host |
|---|---|---|
| Frontend (customer PWA · kitchen · dashboard · admin) | React + Vite + Tailwind | **Vercel** |
| Backend (REST + real-time) | Node + Express + Socket.io | **Railway** |
| Database + Auth | Supabase (Postgres) + Prisma | Supabase |
| Video | Mux (upload, encode, HLS, thumbnails) | Mux |
| Payments | MTN MoMo Collections API (sandbox) | MoMo |
| QR | `qrcode` npm lib | — |

### Branding model (important)
- **Customer-facing menu = the restaurant's brand** (their logo + primary color, stored on the restaurant record). "Powered by Tablu" discreet footer.
- **Platform surfaces (admin, dashboard chrome, login) = Tablu brand** — Orange `#F25623`, Black `#171717`, Helvetica, dark appetite-first UI.

---

## Data models (multi-tenant)

- **Restaurant** — id, name, slug, logo_url, primary_color, address, contact, payment_mode (upfront/after), created_at
- **Category** — id, restaurant_id, name, sort_order
- **Dish** — id, restaurant_id, category_id, name, description, price_rwf, format (text/image/video/image+video), mux_asset_id, mux_playback_id, thumbnail_url, image_url, dietary_tags[], allergens, available, sort_order
- **Table** — id, restaurant_id, number, qr_url
- **Guest** — id, name, phone, email, created_at  *(global identity)*
- **RestaurantGuest** — restaurant_id, guest_id, first_visit, last_visit, visit_count, total_spent, loyalty_points, notes
- **Order** — id, restaurant_id, table_id, guest_id, status, payment_status, momo_reference, total_rwf, created_at
- **OrderItem** — id, order_id, dish_id, qty, unit_price_rwf, special_instructions
- **Receipt** — id, order_id, public_url
- **User** (Supabase Auth) — role: admin / owner / staff, restaurant_id

---

## Phases

Each phase is independently demoable.

### Phase 0 — Foundation
- Repo structure (`/frontend`, `/backend`), tooling, Tailwind brand tokens
- Prisma schema (all models above) + Supabase connection
- Express + Socket.io skeleton, health check
- **Env needed:** Supabase → `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`

### Phase 1 — Onboarding + Auth
- Admin: create restaurant (name, slug, logo upload, primary color, address)
- Auth: admin / owner / staff roles (Supabase Auth)
- Owner login → their dashboard shell
- **Deliverable:** You can create "Simba Cafe" with its logo + color.

### Phase 2 — Menu management + Mux video upload
- Categories CRUD, Dishes CRUD (text/image/video formats)
- Direct-to-Mux video upload from dashboard + thumbnail + status
- Table management + QR generation/download
- **Env needed:** Mux → `MUX_TOKEN_ID`, `MUX_TOKEN_SECRET`, `MUX_WEBHOOK_SECRET`
- **Deliverable:** You upload Simba's real dishes + videos.

### Phase 3 — Customer app (branded)
- QR route `/{slug}/table/{n}` → restaurant-branded menu
- Vertical autoplay video feed (Mux HLS), category tabs, dish detail
- Cart → checkout (Name required, Phone optional, marketing consent)
- **Deliverable:** Scan → browse Simba's video menu → place order.

### Phase 4 — Kitchen display + real-time loop
- Live order queue, chime on new order, status flow (Placed→…→Delivered)
- WebSocket: order to kitchen, status back to customer phone
- Sold-out toggle
- **Deliverable:** The live scan→order→kitchen→status loop.

### Phase 5 — MoMo + receipt
- MoMo Collections request-to-pay, prompt, success webhook
- Branded digital receipt at public URL
- **Env needed:** MoMo → `MOMO_SUBSCRIPTION_KEY`, `MOMO_API_USER`, `MOMO_API_KEY`, `MOMO_TARGET_ENVIRONMENT=sandbox`, `MOMO_CALLBACK_URL`
- **Deliverable:** Pay with MoMo → branded receipt.

### Phase 6 — Dashboard home + CRM
- Today: revenue, orders, top dish
- Guest profiles: visit count, total spent, favorite dish, last visit
- **Deliverable:** The full "reason to pay monthly" view.

### Phase 7 — Deploy
- Backend → Railway, Frontend → Vercel, env wired
- **Deliverable:** Live URL restaurants can scan from their own phones.

---

## Credentials / .env — how this works
I will build each phase to read from `.env`. **When a phase needs live keys, I'll stop at that junction and tell you exactly which keys to paste** (and where to get them). Until then, layers run against local/stub values so nothing blocks.

- Phase 0 → Supabase keys
- Phase 2 → Mux keys
- Phase 5 → MoMo sandbox keys
- Phase 7 → Railway + Vercel

`.env` files are gitignored and never committed.
