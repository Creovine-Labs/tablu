import { Router } from "express";
import { OrderStatus } from "@prisma/client";
import { prisma } from "../lib/prisma.js";

const router = Router();
const ACTIVE: OrderStatus[] = ["PLACED", "CONFIRMED", "PREPARING", "READY"];

function startOfToday() {
  const n = new Date();
  return new Date(n.getFullYear(), n.getMonth(), n.getDate());
}

// Overview: today's revenue, orders, active tables, top dish + all-time totals
router.get("/:restaurantId/overview", async (req, res) => {
  const restaurantId = String(req.params.restaurantId);
  const today = startOfToday();

  const [ordersToday, paidToday, activeOrders, allTimeRevenue, totalGuests, topToday] = await Promise.all([
    prisma.order.count({ where: { restaurantId, createdAt: { gte: today } } }),
    prisma.order.aggregate({
      _sum: { totalRwf: true },
      where: { restaurantId, paymentStatus: "SUCCESSFUL", createdAt: { gte: today } },
    }),
    prisma.order.findMany({
      where: { restaurantId, status: { in: ACTIVE } },
      select: { tableId: true },
    }),
    prisma.order.aggregate({ _sum: { totalRwf: true }, where: { restaurantId, paymentStatus: "SUCCESSFUL" } }),
    prisma.restaurantGuest.count({ where: { restaurantId } }),
    prisma.orderItem.groupBy({
      by: ["nameSnapshot"],
      where: { order: { restaurantId, createdAt: { gte: today } } },
      _sum: { qty: true },
      orderBy: { _sum: { qty: "desc" } },
      take: 1,
    }),
  ]);

  const activeTables = new Set(activeOrders.map((o) => o.tableId).filter(Boolean)).size;

  res.json({
    revenueToday: paidToday._sum.totalRwf ?? 0,
    ordersToday,
    activeTables,
    activeOrders: activeOrders.length,
    topDishToday: topToday[0] ? { name: topToday[0].nameSnapshot, qty: topToday[0]._sum.qty ?? 0 } : null,
    allTimeRevenue: allTimeRevenue._sum.totalRwf ?? 0,
    totalGuests,
  });
});

// CRM: guest profiles with visit count, spend, favorite dish, last visit
router.get("/:restaurantId/guests", async (req, res) => {
  const restaurantId = String(req.params.restaurantId);
  const rgs = await prisma.restaurantGuest.findMany({
    where: { restaurantId },
    include: { guest: true },
    orderBy: { lastVisit: "desc" },
    take: 200,
  });

  const guests = await Promise.all(
    rgs.map(async (rg) => {
      const fav = await prisma.orderItem.groupBy({
        by: ["nameSnapshot"],
        where: { order: { restaurantId, guestId: rg.guestId } },
        _sum: { qty: true },
        orderBy: { _sum: { qty: "desc" } },
        take: 1,
      });
      return {
        id: rg.id,
        name: rg.guest.name,
        phone: rg.guest.phone,
        email: rg.guest.email,
        visitCount: rg.visitCount,
        totalSpentRwf: rg.totalSpentRwf,
        loyaltyPoints: rg.loyaltyPoints,
        lastVisit: rg.lastVisit,
        firstVisit: rg.firstVisit,
        favoriteDish: fav[0]?.nameSnapshot ?? null,
        marketingRestaurant: rg.marketingRestaurant,
      };
    })
  );

  res.json(guests);
});

// Recent order history
router.get("/:restaurantId/orders", async (req, res) => {
  const restaurantId = String(req.params.restaurantId);
  const orders = await prisma.order.findMany({
    where: { restaurantId },
    include: { items: true, table: true, guest: true },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  res.json(orders);
});

export default router;
