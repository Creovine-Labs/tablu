# Tablu Build Specification v1.1

## Overview
Tablu is a restaurant operating system that helps hospitality businesses manage menus, orders, payments, guest relationships and discovery through a unified digital experience.

Supported menu formats:
- Text
- Images
- Videos
- Images + Videos

---

# Guest & CRM Architecture

## Global Guest Database

Each guest exists once within Tablu.

### Guest
- id
- name
- phone
- email
- created_at

## RestaurantGuest Relationship

Each restaurant maintains its own relationship with a guest.

### RestaurantGuest
- restaurant_id
- guest_id
- first_visit
- last_visit
- visit_count
- total_spent
- loyalty_points
- notes

This allows:
- Global guest identity
- Restaurant-specific customer history
- CRM and loyalty
- Repeat customer tracking

---

# Customer Data Collection Flow

## QR Scan

Customer scans QR.

Customer immediately sees menu.

No registration required.

## Ordering

When customer proceeds to order:

Required:
- Name

Purpose:
- Order identification
- Staff communication
- Kitchen workflow

## Checkout

Recommended:
- Phone Number

Purpose:
- Order updates
- Digital receipts
- Loyalty tracking

Optional:
- Email Address

Purpose:
- Email receipts

---

# Marketing Consent

Customer data must not automatically be used for marketing.

Recommended consent options:

[ ] Receive offers from this restaurant

[ ] Receive offers from Tablu and partner restaurants

The second option should be separate and optional.

---

# Digital Receipt System

After successful payment:

Generate:
- Receipt ID
- Order ID
- Date/time
- Restaurant logo
- Restaurant name
- Table number
- Ordered items
- Tax
- Total amount
- Payment method

Customer options:

- Download PDF receipt
- Open receipt URL
- Email receipt
- View receipt later

Example:

tablu.app/r/receipt/ABC123

Receipts should be branded with the restaurant logo and identity.

Powered by Tablu appears discreetly in the footer.

---

# Hybrid Service Model

Tablu should never depend entirely on customers owning smartphones.

Supported order channels:

1. Customer QR Ordering
2. Waiter Order Creation
3. Cashier Order Creation
4. Future Kiosk Ordering

All channels create orders inside the same order system.

### Example Scenarios

#### Customer has smartphone
Uses QR ordering.

#### Customer has low battery
Waiter creates order.

#### Customer has feature phone
Waiter creates order.

#### Customer prefers human service
Waiter creates order.

---

# QR System

Each table receives a unique QR.

Example:

Restaurant:
Heaven Restaurant

Table 12:

tablu.app/r/heaven/table-12

Benefits:
- Automatic table identification
- Faster ordering
- Table analytics
- Order routing

## Physical Formats

### MVP
Laminated table cards

### Premium
Acrylic table stands

### Enterprise
Metal plaques

### Budget
QR stickers

---

# Branding Strategy

## In Restaurant

Primary brand:
Restaurant

Secondary brand:
Powered by Tablu

Examples:
- Restaurant logo
- Restaurant colors
- Restaurant menu
- Restaurant receipt

Small footer:

Powered by Tablu

## Discovery Network

Primary brand:
Tablu

Restaurant brand appears within Tablu marketplace.

---

# POS Strategy

## Phase 1: No POS Integration

Tablu operates independently.

Flow:

Customer Order
→ Tablu
→ Kitchen Display System
→ Receipt Generation

Benefits:
- Fastest launch
- Lowest complexity

## Phase 2: Printer Integration

Customer Order
→ Tablu
→ Kitchen Printer

Benefits:
- Familiar restaurant workflow
- Minimal integration effort

## Phase 3: Full POS Integration

Customer Order
→ Tablu
→ POS
→ Kitchen
→ Receipt
→ Analytics

Requirements:
- POS APIs
- Enterprise integrations
- Vendor partnerships

---

# MVP Scope

## Customer App

- QR scan
- Menu browsing
- Text/image/video menus
- Cart
- Checkout
- MoMo payment
- Digital receipt

## Kitchen Display System

- Incoming orders
- Order acceptance
- Order preparation
- Ready status

## Restaurant Dashboard

- Menu management
- Order management
- Customer profiles
- Basic analytics

## Admin Panel

- Restaurant management
- Subscription management
- User management
- Platform analytics

---

# CRM MVP

Must be included in MVP.

Customer profile should show:

- Name
- Phone
- Email
- Visit count
- Total spend
- Favorite dishes
- Last visit date

Future CRM additions:

- Loyalty points
- Automated campaigns
- Segmentation
- Promotions
- Customer journeys

---

# Long-Term Vision

Tablu evolves into:

1. Restaurant Operating System
2. Customer Relationship Platform
3. Restaurant Discovery Network

The long-term objective is to help restaurants:

- Increase revenue
- Improve customer experience
- Build direct customer relationships
- Manage operations from one platform
