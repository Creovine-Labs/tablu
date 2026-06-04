export interface Category {
  id: string;
  restaurantId: string;
  name: string;
  sortOrder: number;
}

export type DishFormat = "TEXT" | "IMAGE" | "VIDEO" | "IMAGE_VIDEO";

export interface Dish {
  id: string;
  restaurantId: string;
  categoryId: string | null;
  category?: Category | null;
  name: string;
  description: string | null;
  priceRwf: number;
  format: DishFormat;
  muxUploadId: string | null;
  muxPlaybackId: string | null;
  muxStatus: string | null;
  thumbnailUrl: string | null;
  imageUrl: string | null;
  dietaryTags: string[];
  allergens: string | null;
  available: boolean;
  sortOrder: number;
}

export interface Table {
  id: string;
  restaurantId: string;
  number: string;
  qrUrl: string | null;
}

export type OrderStatus = "PLACED" | "CONFIRMED" | "PREPARING" | "READY" | "DELIVERED" | "CANCELLED";

export interface OrderItemRow {
  id: string;
  nameSnapshot: string;
  qty: number;
  unitPriceRwf: number;
  specialInstructions: string | null;
}

export interface KitchenOrder {
  id: string;
  status: OrderStatus;
  totalRwf: number;
  createdAt: string;
  table: { number: string } | null;
  guest: { name: string } | null;
  items: OrderItemRow[];
}

// Customer-facing public menu
export interface PublicDish {
  id: string;
  categoryId: string | null;
  name: string;
  description: string | null;
  priceRwf: number;
  format: DishFormat;
  imageUrl: string | null;
  thumbnailUrl: string | null;
  hlsUrl: string | null;
  dietaryTags: string[];
  allergens: string | null;
}

export interface PublicMenu {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  primaryColor: string;
  address: string | null;
  paymentMode: "UPFRONT" | "AFTER";
  categories: { id: string; name: string }[];
  dishes: PublicDish[];
}

export interface CartLine {
  dish: PublicDish;
  qty: number;
  specialInstructions?: string;
}

export interface Restaurant {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  primaryColor: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  paymentMode: "UPFRONT" | "AFTER";
  active: boolean;
  createdAt: string;
  _count?: { dishes: number; tables: number; orders: number };
}
