# Tablu — Complete Product Specification

**Version 1.0 · Kigali, Rwanda · 2025**
*Video menus. In-seat ordering. MoMo payments. Built for East Africa.*

-----

## Table of Contents

1. [Product Overview](#1-product-overview)
1. [Brand Identity](#2-brand-identity)
1. [Business Model & Pricing](#3-business-model--pricing)
1. [Infrastructure & Tech Stack](#4-infrastructure--tech-stack)
1. [User Roles](#5-user-roles)
1. [Customer-Facing App](#6-customer-facing-app)
1. [Kitchen Display System](#7-kitchen-display-system)
1. [Restaurant Dashboard](#8-restaurant-dashboard)
1. [Platform Admin Panel](#9-platform-admin-panel)
1. [MTN MoMo Payment Integration](#10-mtn-momo-payment-integration)
1. [Video Infrastructure](#11-video-infrastructure)
1. [QR Code System](#12-qr-code-system)
1. [Real-Time Order System](#13-real-time-order-system)
1. [Order State Machine](#14-order-state-machine)
1. [Notifications](#15-notifications)
1. [Receipt System](#16-receipt-system)
1. [Analytics & Reporting](#17-analytics--reporting)
1. [Multi-Location & Enterprise](#18-multi-location--enterprise)
1. [Onboarding & Shoot Service](#19-onboarding--shoot-service)
1. [Subscription & Billing System](#20-subscription--billing-system)
1. [Discovery Network](#21-discovery-network)
1. [Non-Functional Requirements](#22-non-functional-requirements)

-----

## 1. Product Overview

### What Tablu Is

Tablu is a full-stack restaurant technology platform built for the Rwandan and East African market. It combines three core capabilities into one product:

- **Video Menu** — Restaurants upload short videos per dish. Customers browse a TikTok-style scrollable video feed by scanning a QR code on their table. No app download required.
- **In-Seat Ordering** — Customers select dishes and place orders directly from the video menu. Orders go to the kitchen in real time.
- **MoMo Payments** — Customers pay from the table using MTN Mobile Money. A digital receipt is generated automatically.

### The Problem It Solves

At a typical Kigali restaurant today, a customer must:

1. Wait to catch a waiter’s attention to receive a menu
1. Wait for the waiter to return and take their order
1. Wait for the kitchen to prepare the food
1. Wait again to catch the waiter to request the bill
1. Wait for the bill to arrive and for payment to be processed

Tablu eliminates every waiting step except the cooking. The customer scans, browses video, orders, eats, pays, and leaves — without needing to interact with staff for any transactional step.

### Target Market

- **Primary:** Restaurants, cafes, and food establishments in Kigali, Rwanda
- **Secondary:** East African markets (Nairobi, Dar es Salaam, Kampala)
- **Enterprise targets:** Multi-branch operations (e.g. Simba Cafe, hotel restaurants, fast-growing chains)

### Distribution

- Customer-facing: Progressive Web App (PWA) — no download required, accessed via QR code scan
- Restaurant dashboard: Web application
- Kitchen display: Web application (tablet or mounted screen)
- Admin panel: Web application

-----

## 2. Brand Identity

### Name

**Tablu**

### Tagline

*Scan. Order. Pay.*

### Brand Colors

|Name        |HEX      |RGB          |Usage                                 |
|------------|---------|-------------|--------------------------------------|
|Tablu Orange|`#F25623`|242, 86, 43  |Primary brand, CTAs, icon, key UI     |
|Tablu Black |`#171717`|23, 23, 23   |Headlines, body text, dark backgrounds|
|Dark Gray   |`#4D4D4D`|77, 77, 77   |Secondary text, subtitles, metadata   |
|Light Gray  |`#DEDEDE`|222, 222, 222|Backgrounds, dividers, borders        |
|White       |`#FFFFFF`|255, 255, 255|Cards, text on dark/orange            |

### Logo

- **Icon mark:** Tilted oval halo above a D-shaped stem — represents a table viewed from perspective, combined with a location/pin motif
- **Full logo:** Icon mark + “Tablu” wordmark in rounded bold type
- **Usage:** Full logo for all primary placements. Icon mark standalone only for app icons, favicons, and sub-40px placements
- **Never:** Stretch, recolor outside brand palette, rotate, add shadows, or separate icon from wordmark in horizontal lockup

### Typography

- **Display:** Playfair Display — hero headlines, campaign copy, editorial moments
- **UI / Body:** Nunito — all interface text, labels, buttons, body copy
- **Type scale:**
  - H1: 32pt Bold
  - H2: 24pt Bold
  - H3: 18pt Bold
  - Body: 13pt Regular
  - Caption: 10pt Regular
  - Label: 8pt Bold Caps

-----

## 3. Business Model & Pricing

### Model

Subscription-based SaaS (Software as a Service). Restaurants pay a monthly flat fee based on the tier that matches their size and usage. The platform also offers an optional video shoot service as a one-time add-on.

### Subscription Tiers

#### Starter — 15,000 RWF/month (~$13)

- Video menu only
- Up to 20 dishes
- 1 branch
- QR code + shareable menu link
- Self-managed dashboard
- Up to 5,000 customer menu views/month
- No in-seat ordering
- No MoMo payment integration

#### Growth — 50,000 RWF/month (~$45)

- Everything in Starter
- In-seat ordering enabled
- MoMo payment integration
- Order management dashboard for staff
- Kitchen display system
- Digital receipt generation
- Up to 50 dishes
- Up to 2 branches
- Up to 20,000 customer menu views/month

#### Pro — 100,000 RWF/month (~$90)

- Everything in Growth
- Up to 100 dishes
- Up to 5 branches
- Up to 60,000 customer menu views/month
- Full analytics dashboard (popular dishes, peak hours, order volume, revenue)
- Multi-location order management
- Priority customer support
- Staff account management (multiple staff logins)

#### Enterprise — Custom Quote

- Everything in Pro
- Unlimited dishes
- Unlimited branches
- Unlimited menu views
- Dedicated account manager
- Custom onboarding and training
- SLA-backed uptime guarantee
- Custom integrations on request
- Invoiced billing (not card/MoMo)

### View Cap Enforcement

When a restaurant exceeds their monthly view cap, they receive:

1. An in-dashboard notification at 80% usage
1. An email alert at 100% usage
1. A prompt to upgrade — menu continues to function for 48 hours grace period before downgrade to read-only

### Video Shoot Service (Add-On)

- **Launch offer:** Free for the first 5–10 founding restaurants, framed as a limited onboarding benefit
- **Standard pricing:** 50,000–80,000 RWF one-time setup fee (post-launch)
- **What’s included:** Tablu team visits the restaurant, films short videos of each dish on the menu, edits and uploads to the restaurant’s dashboard
- **Annual plan incentive:** Video shoot included free for restaurants that sign an annual subscription upfront

### Pricing Philosophy

- Flat fee per tier — no surprise bills for the restaurant
- Usage caps protect Tablu margins on video delivery (AWS costs scale with views)
- Enterprise accounts priced based on actual AWS cost estimate × 3–4× margin minimum
- Restaurants are billed monthly; annual billing available at a discount

-----

## 4. Infrastructure & Tech Stack

### Frontend

- **Framework:** React (PWA for customer-facing app, web app for dashboard and kitchen display)
- **Styling:** Tailwind CSS
- **No native app** — all experiences run in the browser

### Backend

- **Runtime:** Node.js
- **Framework:** Express or Fastify
- **Real-time:** Socket.io (WebSockets) for kitchen order notifications and order status updates

### Database

- **Primary:** PostgreSQL — menus, orders, restaurants, users, payments
- **Cache / Real-time state:** Redis — live order queue, session management, rate limiting

### Auth

- Supabase Auth or Firebase Auth — handles restaurant owner login, staff login, admin login
- JWT tokens for session management
- Role-based access control (RBAC): Admin, Restaurant Owner, Staff, Customer (anonymous)

### Video Infrastructure

- **Storage & Delivery:** AWS S3 (storage) + AWS CloudFront (CDN delivery)
- **Encoding:** FFmpeg — runs server-side on upload to compress and optimize video
- **Why AWS over Mux:** 5–6× cheaper per GB delivered; full margin control; no third-party pricing dependency
- **Cold storage:** Dishes not updated in 30+ days automatically moved to S3 Infrequent Access (cost saving)
- **Video specs:** MP4, H.264, 1080×1920px (9:16 vertical), max 60 seconds per dish, compressed to <15MB per video

### Hosting

- **Backend API:** Railway or Render (early stage); migrate to AWS EC2/ECS at scale
- **Frontend:** Vercel
- **Database:** Supabase (managed PostgreSQL) or AWS RDS

### QR System

- Each table has a unique URL: `tablu.app/{restaurant-slug}/table/{table-number}`
- QR code is simply an encoded version of that URL — generated server-side using a QR library
- No special QR hardware required — printed QR codes work

-----

## 5. User Roles

### 5.1 Customer (Anonymous)

- Accesses menu via QR scan — no login required
- Table number auto-captured from URL
- Can browse menu, place order, pay via MoMo, view receipt
- Session tied to table + order ID

### 5.2 Restaurant Staff

- Login required
- Can view live order queue on kitchen display
- Can update order status (confirmed, preparing, ready, delivered)
- Cannot access analytics, billing, or menu management

### 5.3 Restaurant Owner / Manager

- Full dashboard access
- Menu management (add/edit/delete dishes, upload videos)
- Category management
- Table and QR code management
- Staff account management
- Order history
- Analytics
- Billing and subscription management
- MoMo payout settings

### 5.4 Platform Admin (Tablu)

- Onboard new restaurants
- Manage all restaurant accounts
- View platform-wide analytics
- Manage subscriptions and billing
- Override or suspend accounts
- Access all restaurant dashboards in read-only mode

-----

## 6. Customer-Facing App

The customer app is a Progressive Web App (PWA) — accessed via QR code scan in a mobile browser. No download required.

### 6.1 Entry Point

- Customer scans QR code on table
- App loads with restaurant branding
- Table number is automatically detected from URL parameter
- No login, no signup — fully anonymous

### 6.2 Video Menu Feed

- TikTok/Reels-style vertical scroll
- Each card shows:
  - Autoplaying looped dish video (muted by default, tap to unmute)
  - Dish name
  - Short description
  - Price in RWF
  - Availability status (Available / Sold Out)
  - Dietary tags (Vegetarian, Spicy, Vegan, Gluten-Free, etc.)
  - “Add to Cart” button
- Videos lazy-load as the user scrolls (performance optimization for 4G)
- Video plays automatically when card is 60%+ visible on screen
- Video pauses when scrolled out of view

### 6.3 Category Navigation

- Horizontal scrollable tab bar at top: All, Starters, Mains, Drinks, Desserts, Sides (restaurant-configurable)
- Tapping a category filters the feed to that category only
- “All” shows the full menu

### 6.4 Dish Detail Screen

- Tap any dish card to open full detail view
- Shows:
  - Full-screen video player with play/pause control
  - Dish name and full description
  - Price
  - All dietary tags
  - Allergen information (if provided by restaurant)
  - Quantity selector (− 1 +)
  - Special instructions text field (free text, optional)
  - “Add to Cart” button showing running total

### 6.5 Cart

- Persistent cart accessible via floating cart button showing item count
- Cart screen shows:
  - All selected items with name, quantity, and price
  - Quantity adjustment per item
  - Remove item option
  - Special instructions per item
  - Subtotal
  - Table number confirmation
  - “Place Order” button

### 6.6 Order Placement

- Customer taps “Place Order”
- Order is sent to kitchen in real time via WebSocket
- Customer sees order confirmation screen:
  - Order ID / reference number
  - Items ordered with quantities
  - Total amount
  - Table number
  - Real-time status tracker (Placed → Confirmed → Preparing → Ready)

### 6.7 Real-Time Order Tracker

- Live status updates pushed to customer’s screen via WebSocket
- Statuses:
  - **Placed** — order received by system
  - **Confirmed** — kitchen acknowledged the order
  - **Preparing** — food is being made
  - **Ready** — food is on its way to the table
  - **Delivered** — order marked complete

### 6.8 Payment via MoMo

- After order is placed (or when customer is ready to pay):
  - Customer enters their MTN MoMo phone number
  - System initiates payment request via MTN MoMo API
  - Customer receives MoMo prompt on their phone
  - Customer approves payment on their phone
  - System receives payment confirmation via webhook
  - Customer sees payment success screen
- Payment can be triggered:
  - When placing the order (pay upfront)
  - Or after eating (pay on completion — triggered when staff marks order as Delivered)
- Both flows are supported; restaurant configures which they prefer

### 6.9 Digital Receipt

- Generated automatically after successful payment
- Shown on screen and accessible via unique URL
- Receipt includes:
  - Tablu logo + restaurant name
  - Date and time
  - Table number
  - Order ID
  - Itemized list of all dishes with quantities and individual prices
  - Subtotal
  - Total paid
  - Payment method (MTN MoMo)
  - MoMo transaction reference number
- Customer can screenshot or share the receipt URL
- Receipt URL is permanent and accessible without login

### 6.10 Language Support

- English (primary)
- French (secondary — Rwanda is bilingual)
- Kinyarwanda (tertiary — for local market depth)
- Language auto-detected from browser; manually switchable in app

### 6.11 WhatsApp Sharing

- Every menu has a shareable link that works in WhatsApp
- Restaurant can share their menu link via WhatsApp to customers even before they arrive
- QR code and menu link are interchangeable — same destination

-----

## 7. Kitchen Display System

The Kitchen Display System (KDS) is a web app used by kitchen staff on a tablet or mounted screen. It shows incoming orders in real time.

### 7.1 Live Order Queue

- All active orders displayed as cards
- Each card shows:
  - Table number (large, prominent)
  - Order ID
  - Time order was placed
  - Time elapsed since order was placed (live counter)
  - All items with quantities
  - Special instructions per item
  - Current status

### 7.2 Order Status Controls

Staff can tap to update each order:

- **Confirm** — marks order as Confirmed (kitchen has seen it)
- **Start Preparing** — marks order as Preparing
- **Mark Ready** — marks order as Ready (food going to table)
- **Mark Delivered** — marks order as Delivered (complete)

Status updates push immediately to the customer’s screen and the restaurant dashboard.

### 7.3 Alerts

- Audible alert (chime) when a new order arrives
- Visual flash / highlight on new order card
- Badge count in browser tab showing number of pending orders
- Push notification to staff mobile if browser is in background (via Web Push API)

### 7.4 Order Sorting

- Default sort: oldest first (FIFO — first in, first out)
- Visual urgency indicator: orders waiting more than 15 minutes turn orange; more than 25 minutes turn red
- Staff can filter by status: All / Pending / Preparing / Ready

### 7.5 Sold Out Toggle

- Staff can mark any dish as Sold Out directly from the KDS
- Sold Out dishes immediately become unavailable on the customer menu
- Restores automatically at start of next business day (or manually by manager)

-----

## 8. Restaurant Dashboard

The restaurant dashboard is a web application for restaurant owners and managers.

### 8.1 Overview / Home

- Today’s order count
- Today’s revenue (total MoMo payments received)
- Active tables (tables with open orders)
- Most ordered dish today
- Quick links to key actions

### 8.2 Menu Management

- Add new dish:
  - Dish name
  - Category (existing or new)
  - Description
  - Price (RWF)
  - Video upload (drag and drop or file picker)
  - Dietary tags (multi-select)
  - Allergen information
  - Availability toggle
- Edit existing dish (all fields)
- Delete dish (with confirmation)
- Reorder dishes within a category (drag to reorder)
- Duplicate a dish

### 8.3 Category Management

- Create, rename, delete, and reorder menu categories
- Categories appear in the same order on the customer app

### 8.4 Video Upload Flow

1. Owner selects video file
1. Video uploads to server
1. Server runs FFmpeg compression (background job)
1. Compressed video pushed to AWS S3
1. CloudFront CDN URL stored in database
1. Dish goes live with video — owner sees preview in dashboard

### 8.5 Table & QR Code Management

- View all tables with their QR codes
- Add new tables
- Generate and download QR code for each table (PNG or PDF)
- QR codes are permanently linked to table numbers — never expire
- Bulk download all QR codes as a ZIP file

### 8.6 Order History

- Full searchable order history
- Filter by: date range, table number, status, payment status
- Each order shows: time, table, items, total, payment status, MoMo reference
- Export order history as CSV

### 8.7 Staff Management

- Create staff accounts (email + password)
- Assign role: Staff (kitchen access only)
- Deactivate staff accounts
- Staff accounts can only access the Kitchen Display — not the full dashboard

### 8.8 MoMo Payout Settings

- Connect restaurant’s MTN MoMo Business account
- View incoming payment history
- Payouts handled directly via MTN MoMo (Tablu facilitates, does not hold funds)

### 8.9 Settings

- Restaurant name
- Restaurant logo and cover photo
- Address and contact details
- Operating hours
- Menu link / shareable URL (customizable slug)
- Payment preference: Pay upfront or Pay after eating
- Language preference
- Notification preferences

### 8.10 Subscription & Billing

- Current plan and renewal date
- Usage stats (dish count, branch count, monthly view count vs cap)
- Upgrade / downgrade plan
- Payment history
- Cancel subscription

-----

## 9. Platform Admin Panel

Used exclusively by Tablu team.

### 9.1 Restaurant Management

- View all onboarded restaurants
- See restaurant status: Active, Trial, Suspended, Churned
- View any restaurant’s dashboard in read-only mode
- Manually activate or suspend a restaurant account
- Reset restaurant owner password
- Override subscription tier

### 9.2 Onboarding

- Create new restaurant account manually
- Assign trial period (default: 14 days free)
- Log shoot service delivery (date, team member, dishes filmed)
- Mark restaurant as fully onboarded

### 9.3 Platform Analytics

- Total active restaurants
- Total orders processed (all time and monthly)
- Total MoMo payment volume
- Top performing restaurants by order volume
- Churn rate
- Monthly Recurring Revenue (MRR)
- AWS cost per restaurant (to monitor margin health)

### 9.4 Subscription & Billing Management

- View all active subscriptions
- Process manual upgrades or downgrades
- Apply discount codes or custom pricing for enterprise accounts
- View payment failures and retry

-----

## 10. MTN MoMo Payment Integration

### 10.1 API

- MTN Rwanda MoMo API (Collections API)
- Sandbox environment for development and testing
- Production environment requires registered MTN Rwanda Business account

### 10.2 Payment Flow (Customer Side)

1. Customer enters MTN MoMo phone number in the app
1. Tablu backend calls MTN MoMo Collections API: `POST /collection/v1_0/requesttopay`
1. MTN sends a payment prompt to the customer’s phone
1. Customer approves payment on their phone
1. MTN sends a callback (webhook) to Tablu backend confirming payment
1. Tablu marks order as paid in database
1. Customer sees payment success screen
1. Digital receipt generated

### 10.3 Payment States

- `PENDING` — payment request sent, awaiting customer approval
- `SUCCESSFUL` — customer approved, funds transferred
- `FAILED` — customer rejected, timeout, or insufficient funds
- `CANCELLED` — customer cancelled the prompt

### 10.4 Failure Handling

- If payment fails: customer shown clear error message with reason
- Customer can retry with same or different phone number
- Order remains open (not cancelled) during payment retry
- If MoMo API is down: fallback message shown, staff notified to collect payment manually

### 10.5 Refunds

- Refunds initiated manually by restaurant owner from dashboard
- Tablu backend calls MTN MoMo Disbursements API to reverse payment
- Refund confirmation sent to customer via on-screen message

### 10.6 Security

- All MoMo API calls made server-side only — API keys never exposed to client
- Webhook endpoints secured with MTN callback signature verification
- All payment data stored encrypted at rest
- PCI-DSS principles followed (no raw card data — MoMo handles all sensitive auth)

-----

## 11. Video Infrastructure

### 11.1 Upload Pipeline

1. Restaurant owner selects video file in dashboard
1. File uploaded to Tablu backend via multipart form upload
1. Backend validates: file type (MP4, MOV), max raw size (500MB)
1. FFmpeg job queued (background processing):
- Transcode to H.264, AAC audio
- Resize to 1080×1920 (9:16) — crop/letterbox as needed
- Compress to target bitrate (~2Mbps) — output file max 15MB
- Generate thumbnail image (frame at 2 seconds)
1. Compressed video and thumbnail uploaded to AWS S3
1. CloudFront CDN URL saved to dish record in database
1. Owner sees live preview in dashboard

### 11.2 Delivery Optimization

- All videos served via AWS CloudFront CDN — global edge locations for fast delivery
- Adaptive streaming: multiple quality levels (360p, 720p, 1080p) generated per video
- Mobile browsers automatically select quality based on connection speed
- Videos preload the next 2 cards in the feed while the current card plays
- Videos pause immediately when scrolled out of view (bandwidth saving)

### 11.3 Storage Management

- Dishes inactive for 30+ days: video moved to S3 Infrequent Access (60% cost saving)
- Deleted dishes: video and thumbnail deleted from S3 within 24 hours
- Each restaurant’s storage usage tracked and shown in dashboard

### 11.4 Video Specs for Restaurant Owners

- **Format:** MP4 or MOV
- **Orientation:** Vertical (9:16) preferred — horizontal accepted but will be cropped
- **Length:** 10–60 seconds recommended
- **Resolution:** 1080×1920px minimum
- **Raw file size:** Up to 500MB (compressed by Tablu automatically)
- **Content:** Food only — no faces, no music with copyright issues

-----

## 12. QR Code System

### 12.1 URL Structure

Every QR code encodes a URL in this format:

```
https://tablu.app/{restaurant-slug}/table/{table-number}
```

Example: `https://tablu.app/simba-cafe/table/4`

### 12.2 QR Code Generation

- Generated server-side using a QR code library (e.g. `qrcode` npm package)
- Output formats: PNG (for digital use), PDF (print-ready, 300dpi)
- Includes Tablu icon in center of QR pattern (branded QR)
- Each QR code is unique to a table — scanning Table 4’s QR always loads Table 4’s session

### 12.3 Physical Formats

- **Table tent card:** Double-sided printed card. Front: QR + “Scan to Order & Pay” + table number. Back: Tablu icon + brand.
- **Circular table sticker:** Laminated sticker applied directly to table surface. Orange background, white QR.
- **A5 menu insert:** Inserted into existing physical menus. Includes restaurant branding, QR, and short explanation.

### 12.4 QR Code Management

- Restaurant owner can view and download all QR codes from dashboard
- QR codes never expire
- If a restaurant changes their slug, old URLs redirect to new slug (301 redirect)
- Damaged or lost QR codes: owner reprints from dashboard — same URL, same QR

-----

## 13. Real-Time Order System

### 13.1 Technology

- **WebSockets via Socket.io** — persistent real-time connection between:
  - Customer app ↔ Tablu backend (order status updates)
  - Kitchen display ↔ Tablu backend (new order alerts, status updates)
  - Restaurant dashboard ↔ Tablu backend (live order feed)

### 13.2 Connection Management

- Customer app opens WebSocket connection when order is placed
- Connection maintained until order reaches Delivered status
- Kitchen display maintains persistent connection during operating hours
- Auto-reconnect logic if connection drops (exponential backoff)
- Fallback to polling (every 10 seconds) if WebSocket unavailable

### 13.3 Real-Time Events

|Event            |Triggered By              |Received By                                     |
|-----------------|--------------------------|------------------------------------------------|
|`order:new`      |Customer places order     |Kitchen display, Restaurant dashboard           |
|`order:confirmed`|Staff taps Confirm        |Customer app                                    |
|`order:preparing`|Staff taps Start Preparing|Customer app                                    |
|`order:ready`    |Staff taps Mark Ready     |Customer app                                    |
|`order:delivered`|Staff taps Mark Delivered |Customer app, Restaurant dashboard              |
|`payment:success`|MoMo webhook received     |Customer app, Kitchen display                   |
|`dish:sold_out`  |Staff marks sold out      |All active customer sessions for that restaurant|

-----

## 14. Order State Machine

Every order passes through these states in sequence. No state can be skipped.

```
PLACED → CONFIRMED → PREPARING → READY → DELIVERED
```

### State Definitions

|State      |Description                                    |Who Triggers                      |
|-----------|-----------------------------------------------|----------------------------------|
|`PLACED`   |Order submitted by customer, received by system|System (automatic on order submit)|
|`CONFIRMED`|Kitchen has acknowledged the order             |Kitchen staff                     |
|`PREPARING`|Food is actively being prepared                |Kitchen staff                     |
|`READY`    |Food is ready and being brought to table       |Kitchen staff                     |
|`DELIVERED`|Food delivered to table, order complete        |Kitchen staff                     |
|`CANCELLED`|Order cancelled before PREPARING               |Restaurant owner/manager only     |
|`REFUNDED` |Payment reversed after DELIVERED               |Restaurant owner via dashboard    |

### Timing Rules

- Orders not confirmed within 5 minutes: auto-escalation alert sent to manager
- Orders in PREPARING for more than 25 minutes: visual urgency alert on KDS
- CANCELLED state only available before PREPARING — once cooking starts, must go to DELIVERED then REFUNDED if needed

### Payment Relation to Order State

- Payment can happen at PLACED (pay upfront) or at DELIVERED (pay after)
- Restaurant configures which mode in settings
- In pay-after mode: order proceeds through all states, payment triggered when staff marks DELIVERED
- A DELIVERED order with unpaid status shows a “Request Payment” button on the KDS

-----

## 15. Notifications

### 15.1 Kitchen Staff Notifications

- Audible chime on new order (Web Audio API)
- Visual flash on new order card
- Browser tab badge count (unconfirmed orders)
- Web Push notification if browser is backgrounded (requires staff to grant permission)

### 15.2 Restaurant Owner Notifications

- Email: daily order summary (sent at midnight)
- Email: payment received confirmation
- Email: view cap warning at 80% and 100%
- In-dashboard: real-time order alerts (if owner has dashboard open)
- In-dashboard: low dish count warning (if fewer than 5 dishes are active)

### 15.3 Customer Notifications

- In-app only (no email or SMS required)
- Real-time order status updates via WebSocket on their screen
- Payment confirmation shown immediately on screen

-----

## 16. Receipt System

### 16.1 Receipt Generation

- Auto-generated when MoMo payment is confirmed
- Stored as a record in database — accessible permanently via unique URL
- URL format: `tablu.app/receipt/{order-id}`

### 16.2 Receipt Contents

- Tablu logo
- Restaurant name and address
- Date and time of order
- Table number
- Order ID / reference
- Itemized list:
  - Dish name
  - Quantity
  - Unit price
  - Line total
- Subtotal
- Total paid
- Payment method: MTN Mobile Money
- MTN MoMo transaction reference number
- “Powered by Tablu” footer

### 16.3 Receipt Access

- Customer sees receipt immediately on payment success screen
- Receipt URL is shareable — customer can send to anyone
- No login required to view a receipt
- Receipts cannot be modified after generation

-----

## 17. Analytics & Reporting

Available on Pro and Enterprise plans.

### 17.1 Menu Analytics

- Views per dish (how many customers viewed each dish video)
- Orders per dish (how many times each dish was ordered)
- Conversion rate per dish (views ÷ orders)
- Most viewed dishes
- Most ordered dishes
- Least ordered dishes (flag for potential removal)

### 17.2 Order Analytics

- Total orders per day / week / month
- Average order value
- Average order completion time (PLACED to DELIVERED)
- Peak order hours (heatmap by hour of day)
- Peak order days (heatmap by day of week)
- Orders by table number

### 17.3 Revenue Analytics

- Total revenue per day / week / month
- Revenue by dish category
- MoMo payment success rate
- Payment failure rate and failure reasons

### 17.4 Customer Analytics

- Total unique table sessions (proxy for unique customers)
- Average dishes per order
- Average session duration (time from QR scan to order completion)

### 17.5 Export

- All analytics exportable as CSV
- Date range filtering on all reports

-----

## 18. Multi-Location & Enterprise

### 18.1 Branch Structure

- One restaurant account can contain multiple branches
- Each branch has:
  - Its own menu (or shared menu from parent — configurable)
  - Its own tables and QR codes
  - Its own kitchen display
  - Its own staff accounts
- Restaurant owner can switch between branches in the dashboard

### 18.2 Consolidated View

- Enterprise dashboard shows aggregated analytics across all branches
- Order volume, revenue, and top dishes viewable per-branch or combined
- Manager can monitor all branches from a single login

### 18.3 Menu Inheritance

- Option to push menu updates from parent account to all branches simultaneously
- Or manage each branch menu independently
- Branch-specific overrides (e.g. different price at a specific branch) supported

-----

## 19. Onboarding & Shoot Service

### 19.1 Standard Onboarding Flow

1. Restaurant signs up online or via Tablu sales visit
1. 14-day free trial activated automatically
1. Onboarding email sent with setup guide
1. Restaurant owner completes dashboard setup:
- Restaurant name, logo, address
- Add menu categories
- Add dishes (name, description, price, dietary tags)
- Upload dish videos (self-serve)
- Set table count and generate QR codes
- Connect MoMo account
1. Print QR codes and place on tables
1. Go live

### 19.2 Managed Onboarding (With Shoot Service)

1. Tablu team visits restaurant
1. Films short video for each dish on the menu (on-site shoot)
1. Tablu team edits and uploads all videos to restaurant’s dashboard
1. Tablu team sets up all menu categories and dish details
1. QR codes printed and placed on tables by Tablu team
1. Staff training session (30–45 minutes):
- How to use the Kitchen Display
- How to update order status
- How to mark dishes as sold out
- How to add new dishes / update prices
1. Restaurant is fully live — owner can self-manage from this point

### 19.3 Launch Offer Terms

- First 5–10 restaurants onboarded receive the shoot service at no charge
- Restaurants are informed this is a launch benefit valued at 50,000–80,000 RWF
- They agree to be featured as a case study / reference customer
- Post-launch: shoot service is a paid add-on

-----

## 20. Subscription & Billing System

### 20.1 Billing Cycle

- Monthly billing on the same date each month (signup date)
- Annual billing available at a discount (2 months free = ~17% discount)

### 20.2 Payment Method

- Restaurant owners pay their Tablu subscription via:
  - MTN MoMo (primary for Rwanda)
  - Bank transfer (for Enterprise invoiced accounts)
  - Card (Stripe integration — secondary option)

### 20.3 Trial Period

- 14 days free on signup — no payment required
- Full access to the selected tier during trial
- Reminder email at day 10 and day 13
- Auto-converts to paid subscription on day 15 if payment method added
- If no payment method: account moves to read-only mode (menu viewable, ordering disabled)

### 20.4 Upgrades & Downgrades

- Upgrade: effective immediately, prorated billing for remainder of month
- Downgrade: effective at end of current billing period
- If downgrading causes a limit to be exceeded (e.g. more dishes than new tier allows): owner prompted to reduce before downgrade completes

### 20.5 Failed Payments

- Day 1: payment retry + email notification
- Day 3: second retry + warning email
- Day 5: account moved to read-only (menu visible, ordering disabled)
- Day 10: account suspended (menu offline)
- Day 30: account scheduled for deletion (data retained 60 days then purged)

-----

## 21. Discovery Network

### 21.1 Public Directory

- Tablu hosts a public-facing restaurant directory at `tablu.app/explore`
- Any restaurant on the platform is listed (unless they opt out)
- Customers can browse restaurants by:
  - Location (Kigali neighborhood)
  - Cuisine type
  - Price range

### 21.2 Restaurant Profile Page

- Each restaurant has a public page: `tablu.app/{restaurant-slug}`
- Shows:
  - Restaurant name and cover photo
  - Address and opening hours
  - Sample dish videos (3–5 featured dishes)
  - Link to full video menu
  - QR code to scan on mobile

### 21.3 Shareable Menu Link

- Every restaurant menu is accessible via a direct URL — no QR required
- Link can be shared via WhatsApp, Instagram bio, SMS, or any channel
- URL: `tablu.app/{restaurant-slug}/menu`
- Table number is not required for browsing — only required for ordering

-----

## 22. Non-Functional Requirements

### 22.1 Performance

- Customer app initial load: under 3 seconds on 4G connection (critical for Rwanda market)
- Video first frame visible: under 2 seconds after card enters viewport
- Order submission to kitchen display: under 1 second (WebSocket)
- Dashboard page load: under 2 seconds

### 22.2 Availability

- Target uptime: 99.5% (Growth/Pro), 99.9% SLA for Enterprise
- Graceful degradation: if WebSocket fails, polling fallback activates automatically
- If MoMo API is unavailable: app displays clear message; ordering still works; payment deferred

### 22.3 Scalability

- Architecture supports horizontal scaling of backend via load balancer
- Redis handles shared state across multiple backend instances
- AWS CloudFront handles video delivery at any scale without backend involvement

### 22.4 Security

- All traffic over HTTPS (TLS 1.3)
- MoMo API keys stored in environment variables — never in codebase
- Customer sessions are anonymous — no PII collected without consent
- Restaurant owner passwords hashed (bcrypt)
- Rate limiting on all API endpoints
- Input validation and SQL injection protection on all database queries
- CORS configured to allow only known origins

### 22.5 Accessibility

- Minimum contrast ratio 4.5:1 on all text (WCAG AA)
- All interactive elements keyboard navigable
- Videos have muted autoplay with unmute option (browser compatibility)
- Large tap targets (minimum 44×44px) for mobile use

### 22.6 Offline Behaviour

- Customer app: if connection lost mid-session, shows “You’re offline” banner
- Orders cannot be placed offline — requires live connection for MoMo
- Kitchen display: shows last known order state and reconnects automatically

### 22.7 Data Residency

- All data stored on AWS servers
- Primary region: Africa (Cape Town) — `af-south-1`
- Backups: daily automated PostgreSQL snapshots retained for 30 days

### 22.8 Compliance

- GDPR-aware data handling (relevant for future EU expansion)
- MTN MoMo API compliance with Rwanda National Bank payment regulations
- No customer financial data stored on Tablu servers — all payment auth handled by MTN

-----

*Document prepared for: Tablu development team*
*Last updated: 2025*
*Status: Complete product specification — all features required, no features deferred*