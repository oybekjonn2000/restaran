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
  isReady?: boolean;
  customerLatitude?: number;
  customerLongitude?: number;
  customerAddress?: string;
  courierActiveOnShift?: boolean;
  courierAcceptedAt?: string;
  courierStartLatitude?: number;
  courierStartLongitude?: number;
  restaurantLatitude?: number;
  restaurantLongitude?: number;
  courierArrivedAtRestaurantAt?: string;
  distanceToRestaurant?: number;
  etaToRestaurant?: string;
  courierLatitude?: number;
  courierLongitude?: number;
  gpsSignalLost?: boolean;
  baseFee?: number;
  pickupDistanceKm?: number;
  deliveryDistanceKm?: number;
  pickupFee?: number;
  courierDeliveryFee?: number;
  totalDistanceKm?: number;
  totalEarning?: number;
  createdAt: string;
  items: OrderItem[];
  dispatchAttempt?: number;
  previousStatus?: string;
  paymentMethod?: 'CARD' | 'CASH';
  deliveryProvider?: 'INTERNAL' | 'YANDEX';
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
  | 'CANCELED'
  | 'CANCELLATION_REQUESTED'
  | 'TRANSFERRED_TO_YANDEX'
  | 'YANDEX_COURIER_CALLED'
  | 'READY'
  | 'YANDEX_COURIER_PICKED_UP';

export interface OrderRequest {
  deliveryAddress: string;
  latitude?: number;
  longitude?: number;
  distance?: number;
  deliveryFee?: number;
  note?: string;
  restaurantId?: number;
  items: { foodId: number; quantity: number }[];
  paymentMethod?: string;
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
  CANCELLATION_REQUESTED: "⚠️ Bekor qilish so'raldi",
  TRANSFERRED_TO_YANDEX: "🟨 Yandex Delivery kutmoqda",
  YANDEX_COURIER_CALLED: "🚕 Yandex kuryer chaqirildi",
  READY:                 "🍳 Ovqat tayyor",
  YANDEX_COURIER_PICKED_UP: "🚴 Yandex kuryer olib ketdi",
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
  CANCELLATION_REQUESTED: "#eab308",
  TRANSFERRED_TO_YANDEX: "#eab308",
  YANDEX_COURIER_CALLED: "#3b82f6",
  READY:                 "#10b981",
  YANDEX_COURIER_PICKED_UP: "#06b6d4",
};
