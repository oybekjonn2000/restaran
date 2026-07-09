import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Order, OrderRequest } from '../models/order.model';
import { User, CourierStats, ClientStats, RegisterRequest } from '../models/user.model';
import { Food } from '../models/food.model';
import { Restaurant, RestaurantAdminRequest } from '../models/restaurant.model';

const BASE = 'http://localhost:8080/api';

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

  adminGetManagers(): Observable<User[]> {
    return this.http.get<User[]>(`${BASE}/admin/managers`);
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
}
