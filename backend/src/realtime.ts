import { Server } from "socket.io";
import type { Server as HttpServer } from "http";

let io: Server;

/** Room helpers — events are scoped per restaurant so tenants never cross. */
export const rooms = {
  restaurant: (restaurantId: string) => `restaurant:${restaurantId}`,
  order: (orderId: string) => `order:${orderId}`,
};

export function initRealtime(server: HttpServer, origin: string | string[]) {
  io = new Server(server, {
    cors: { origin, methods: ["GET", "POST"] },
  });

  io.on("connection", (socket) => {
    // Kitchen display / dashboard joins its restaurant room
    socket.on("join:restaurant", (restaurantId: string) => {
      socket.join(rooms.restaurant(restaurantId));
    });
    // Customer phone joins its order room to receive status updates
    socket.on("join:order", (orderId: string) => {
      socket.join(rooms.order(orderId));
    });
  });

  return io;
}

export function emitToRestaurant(restaurantId: string, event: string, payload: unknown) {
  io?.to(rooms.restaurant(restaurantId)).emit(event, payload);
}

export function emitToOrder(orderId: string, event: string, payload: unknown) {
  io?.to(rooms.order(orderId)).emit(event, payload);
}
