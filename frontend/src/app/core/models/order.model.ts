import { User } from '../models/user.model';
import { Food } from '../models/food.model';
import { Restaurant } from './restaurant.model';

export interface Order {
  id: number;
  user: User;
  restaurant?: Restaurant;
  courier?: User;
  totalPrice: number;
  status: OrderStatus;
  deliveryAddress: string;
  latitude?: number;
  longitude?: number;
  deliveryFee?: number;
  distance?: number;
  assignedAt?: string | null;
  attemptedCourierIds?: string;
  note?: string;
  cancelReason?: string;
  yandexDelivery?: boolean;
  courierActiveOnShift?: boolean;
  createdAt: string;
  items: OrderItem[];
}

export interface OrderItem {
  id: number;
  food: Food;
  quantity: number;
  price: number;
}

export type OrderStatus =
  | 'PENDING'
  | 'PREPARING'
  | 'COURIER_ACCEPTED'
  | 'COURIER_AT_RESTAURANT'
  | 'DELIVERING'
  | 'COURIER_AT_CLIENT'
  | 'DELIVERED'
  | 'CANCELED';

export interface OrderRequest {
  deliveryAddress: string;
  latitude?: number;
  longitude?: number;
  distance?: number;
  deliveryFee?: number;
  note?: string;
  restaurantId?: number;
  items: { foodId: number; quantity: number }[];
}

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING:               "⏳ Kutilmoqda",
  PREPARING:             "🍳 Tayyorlanmoqda",
  COURIER_ACCEPTED:      "🏍️ Kuryer yo'lda",
  COURIER_AT_RESTAURANT: "🏪 Kuryer restoranda",
  DELIVERING:            "🚗 Yetkazilmoqda",
  COURIER_AT_CLIENT:     "📍 Kuryer manzilida",
  DELIVERED:             "🎉 Yetkazildi",
  CANCELED:              "❌ Bekor qilindi",
};

export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  PENDING:               "#f59e0b",
  PREPARING:             "#8b5cf6",
  COURIER_ACCEPTED:      "#3b82f6",
  COURIER_AT_RESTAURANT: "#06b6d4",
  DELIVERING:            "#f97316",
  COURIER_AT_CLIENT:     "#14b8a6",
  DELIVERED:             "#10b981",
  CANCELED:              "#ef4444",
};
