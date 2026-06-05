// Remembers the guest's most recent order per restaurant, so reopening the menu
// surfaces a "Track your order" banner. Cleared when the order is delivered/picked up.
const key = (slug: string) => `tablu:activeOrder:${slug}`;

export function setActiveOrder(slug: string, orderId: string) {
  try { localStorage.setItem(key(slug), orderId); } catch { /* ignore */ }
}

export function getActiveOrder(slug: string): string | null {
  try { return localStorage.getItem(key(slug)); } catch { return null; }
}

export function clearActiveOrder(slug: string) {
  try { localStorage.removeItem(key(slug)); } catch { /* ignore */ }
}
