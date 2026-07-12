import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Order, OrderRequest } from '../models/order.model';
import { User, CourierStats, ClientStats, ManagerStats, RegisterRequest } from '../models/user.model';
import { Food } from '../models/food.model';
import { Restaurant, RestaurantAdminRequest } from '../models/restaurant.model';
import { Slot, SlotRequest, ActiveSlotResponse, CancelResult } from '../models/slot.model';
import { API_BASE } from '../config';

const BASE = `${API_BASE}/api`;

@Injectable({ providedIn: 'root' })
export class OrderService {
  constructor(private http: HttpClient) {}

  // ===== MIJOZ =====
  createOrder(request: OrderRequest): Observable<Order> {
    return this.http.post<Order>(`${BASE}/orders`, request);
  }

  getMyOrders(): Observable<Order[]> {
    return this.http.get<Order[]>(`${BASE}/orders/my`);
  }

  // ===== KURYER =====
  getAvailableOrders(): Observable<Order[]> {
    return this.http.get<Order[]>(`${BASE}/courier/available`);
  }

  getMyCourierOrders(): Observable<Order[]> {
    return this.http.get<Order[]>(`${BASE}/courier/my-orders`);
  }

  acceptOrder(orderId: number): Observable<Order> {
    return this.http.put<Order>(`${BASE}/courier/${orderId}/accept`, {});
  }

  arriveRestaurant(orderId: number): Observable<Order> {
    return this.http.put<Order>(`${BASE}/courier/${orderId}/arrive-restaurant`, {});
  }

  pickupOrder(orderId: number): Observable<Order> {
    return this.http.put<Order>(`${BASE}/courier/${orderId}/pickup`, {});
  }

  arriveClient(orderId: number): Observable<Order> {
    return this.http.put<Order>(`${BASE}/courier/${orderId}/arrive-client`, {});
  }

  deliverOrder(orderId: number): Observable<Order> {
    return this.http.put<Order>(`${BASE}/courier/${orderId}/deliver`, {});
  }

  // ===== ADMIN =====
  getAllOrders(): Observable<Order[]> {
    return this.http.get<Order[]>(`${BASE}/admin/orders`);
  }

  updateOrderStatus(orderId: number, status: string): Observable<Order> {
    return this.http.put<Order>(`${BASE}/admin/orders/${orderId}/status?status=${status}`, {});
  }

  assignCourier(orderId: number, courierId: number): Observable<Order> {
    return this.http.put<Order>(`${BASE}/admin/orders/${orderId}/assign?courierId=${courierId}`, {});
  }

  getStats(): Observable<Record<string, number>> {
    return this.http.get<Record<string, number>>(`${BASE}/admin/orders/stats`);
  }

  cancelOrderWithReason(orderId: number, reason: string): Observable<Order> {
    return this.http.put<Order>(`${BASE}/admin/orders/${orderId}/cancel?reason=${encodeURIComponent(reason)}`, {});
  }

  cancelManagerOrderWithReason(orderId: number, reason: string): Observable<Order> {
    return this.http.put<Order>(`${BASE}/manager/orders/${orderId}/cancel?reason=${encodeURIComponent(reason)}`, {});
  }

  getCouriers(): Observable<User[]> {
    return this.http.get<User[]>(`${BASE}/admin/couriers`);
  }

  getCourierStats(): Observable<CourierStats[]> {
    return this.http.get<CourierStats[]>(`${BASE}/admin/couriers/stats`);
  }

  addCourierOrUser(request: RegisterRequest): Observable<User> {
    return this.http.post<User>(`${BASE}/admin/users`, request);
  }

  // ===== PUBLIC / CLIENT RESTAURANTS =====
  getRestaurants(): Observable<Restaurant[]> {
    return this.http.get<Restaurant[]>(`${BASE}/restaurants`);
  }

  getRestaurantById(id: number): Observable<Restaurant> {
    return this.http.get<Restaurant>(`${BASE}/restaurants/${id}`);
  }

  getRestaurantFoods(id: number, categoryId?: number): Observable<Food[]> {
    const url = categoryId ? `${BASE}/restaurants/${id}/foods?categoryId=${categoryId}` : `${BASE}/restaurants/${id}/foods`;
    return this.http.get<Food[]>(url);
  }

  // ===== RESTAURANT MANAGER (ROLE_MANAGER) =====
  getManagerRestaurant(): Observable<Restaurant> {
    return this.http.get<Restaurant>(`${BASE}/manager/my-restaurant`);
  }

  updateManagerRestaurant(req: RestaurantAdminRequest): Observable<Restaurant> {
    return this.http.put<Restaurant>(`${BASE}/manager/my-restaurant`, req);
  }

  getManagerFoods(): Observable<Food[]> {
    return this.http.get<Food[]>(`${BASE}/manager/foods`);
  }

  createManagerFood(req: any): Observable<Food> {
    return this.http.post<Food>(`${BASE}/manager/foods`, req);
  }

  updateManagerFood(id: number, req: any): Observable<Food> {
    return this.http.put<Food>(`${BASE}/manager/foods/${id}`, req);
  }

  deleteManagerFood(id: number): Observable<any> {
    return this.http.delete<any>(`${BASE}/manager/foods/${id}`);
  }

  toggleManagerFood(id: number): Observable<Food> {
    return this.http.put<Food>(`${BASE}/manager/foods/${id}/toggle`, {});
  }

  getManagerOrders(): Observable<Order[]> {
    return this.http.get<Order[]>(`${BASE}/manager/orders`);
  }

  updateManagerOrderStatus(id: number, status: string): Observable<Order> {
    return this.http.put<Order>(`${BASE}/manager/orders/${id}/status?status=${status}`, {});
  }

  cancelManagerOrder(id: number, reason: string): Observable<Order> {
    return this.http.put<Order>(`${BASE}/manager/orders/${id}/cancel?reason=${encodeURIComponent(reason)}`, {});
  }

  // ===== SUPER ADMIN RESTAURANT CRUD =====
  adminGetRestaurants(): Observable<Restaurant[]> {
    return this.http.get<Restaurant[]>(`${BASE}/admin/restaurants`);
  }

  adminCreateRestaurant(req: RestaurantAdminRequest): Observable<Restaurant> {
    return this.http.post<Restaurant>(`${BASE}/admin/restaurants`, req);
  }

  adminUpdateRestaurant(id: number, req: RestaurantAdminRequest): Observable<Restaurant> {
    return this.http.put<Restaurant>(`${BASE}/admin/restaurants/${id}`, req);
  }

  adminDeleteRestaurant(id: number): Observable<any> {
    return this.http.delete<any>(`${BASE}/admin/restaurants/${id}`);
  }

  adminGetManagers(): Observable<ManagerStats[]> {
    return this.http.get<ManagerStats[]>(`${BASE}/admin/managers`);
  }

  adminUpdateManager(id: number, req: any): Observable<User> {
    return this.http.put<User>(`${BASE}/admin/managers/${id}`, req);
  }

  adminDeleteManager(id: number): Observable<any> {
    return this.http.delete<any>(`${BASE}/admin/managers/${id}`);
  }

  // ===== SUPER ADMIN CLIENTS CRUD =====
  adminGetClients(): Observable<ClientStats[]> {
    return this.http.get<ClientStats[]>(`${BASE}/admin/clients`);
  }

  adminUpdateClient(id: number, req: any): Observable<User> {
    return this.http.put<User>(`${BASE}/admin/clients/${id}`, req);
  }

  adminDeleteClient(id: number): Observable<any> {
    return this.http.delete<any>(`${BASE}/admin/clients/${id}`);
  }

  // ===== SMENALAR (SLOTS) =====

  // Admin smenalar
  adminGetSlots(): Observable<Slot[]> {
    return this.http.get<Slot[]>(`${BASE}/admin/slots`);
  }

  adminGetTodaySlots(): Observable<Slot[]> {
    return this.http.get<Slot[]>(`${BASE}/admin/slots/today`);
  }

  adminCreateSlot(req: SlotRequest): Observable<Slot> {
    return this.http.post<Slot>(`${BASE}/admin/slots`, req);
  }

  adminUpdateSlot(id: number, req: SlotRequest): Observable<Slot> {
    return this.http.put<Slot>(`${BASE}/admin/slots/${id}`, req);
  }

  adminDeleteSlot(id: number): Observable<any> {
    return this.http.delete<any>(`${BASE}/admin/slots/${id}`);
  }

  /** Admin: Jarimani bekor qilish — kuryer balansiga qaytarish */
  adminReversePenalty(slotId: number): Observable<Slot> {
    return this.http.post<Slot>(`${BASE}/admin/slots/${slotId}/reverse-penalty`, {});
  }

  /** Admin: Kuryerning smenasini majburiy tugatish */
  adminForceEndSlot(slotId: number): Observable<Slot> {
    return this.http.post<Slot>(`${BASE}/admin/slots/${slotId}/force-end`, {});
  }

  // Kuryer smenalar
  getCourierAvailableSlots(): Observable<Slot[]> {
    return this.http.get<Slot[]>(`${BASE}/courier/slots/available`);
  }

  getCourierActiveSlot(): Observable<ActiveSlotResponse> {
    return this.http.get<ActiveSlotResponse>(`${BASE}/courier/slots/active`);
  }

  startSlot(slotId: number): Observable<Slot> {
    return this.http.post<Slot>(`${BASE}/courier/slots/${slotId}/start`, {});
  }

  endSlot(slotId: number): Observable<Slot> {
    return this.http.post<Slot>(`${BASE}/courier/slots/${slotId}/end`, {});
  }

  bookSlot(slotId: number): Observable<Slot> {
    return this.http.post<Slot>(`${BASE}/courier/slots/${slotId}/book`, {});
  }

  cancelSlot(slotId: number): Observable<CancelResult> {
    return this.http.post<CancelResult>(`${BASE}/courier/slots/${slotId}/cancel`, {});
  }

  getCourierBookedSlots(): Observable<Slot[]> {
    return this.http.get<Slot[]>(`${BASE}/courier/slots/my-booked`);
  }

  getCourierAllSlots(): Observable<Slot[]> {
    return this.http.get<Slot[]>(`${BASE}/courier/slots/all`);
  }

  /** Smenada faol kuryer bor-yo'qligini tekshiradi */
  isCourierActive(): Observable<{ active: boolean }> {
    return this.http.get<{ active: boolean }>(`${BASE}/orders/courier-active`);
  }

  /** Rasm yuklash (MultipartFile) */
  uploadImage(file: File): Observable<{ url: string }> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<{ url: string }>(`${BASE}/upload`, formData);
  }
}
