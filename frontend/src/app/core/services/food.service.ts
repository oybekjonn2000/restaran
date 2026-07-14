import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Category } from '../models/category.model';
import { Food } from '../models/food.model';
import { API_BASE } from '../config';

const BASE = `${API_BASE}/api`;

@Injectable({ providedIn: 'root' })
export class FoodService {
  constructor(private http: HttpClient) {}

  getCategories(restaurantId?: number): Observable<Category[]> {
    const url = restaurantId ? `${BASE}/categories?restaurantId=${restaurantId}` : `${BASE}/categories`;
    return this.http.get<Category[]>(url);
  }

  getAllFoods(): Observable<Food[]> {
    return this.http.get<Food[]>(`${BASE}/foods`);
  }

  getFoodsByCategory(categoryId: number): Observable<Food[]> {
    return this.http.get<Food[]>(`${BASE}/foods/category/${categoryId}`);
  }

  getFoodById(id: number): Observable<Food> {
    return this.http.get<Food>(`${BASE}/foods/${id}`);
  }

  searchFoods(query: string): Observable<Food[]> {
    return this.http.get<Food[]>(`${BASE}/foods/search?q=${query}`);
  }

  // Admin Food operations
  getAllFoodsAdmin(): Observable<Food[]> {
    return this.http.get<Food[]>(`${BASE}/admin/foods`);
  }

  getFoodsAdminPaginated(params: { restaurantId?: number; categoryId?: number; search?: string; page: number; size: number; sortBy?: string; sortDir?: string }): Observable<any> {
    let query = `page=${params.page}&size=${params.size}`;
    if (params.restaurantId) query += `&restaurantId=${params.restaurantId}`;
    if (params.categoryId) query += `&categoryId=${params.categoryId}`;
    if (params.search) query += `&search=${encodeURIComponent(params.search)}`;
    if (params.sortBy) query += `&sortBy=${params.sortBy}`;
    if (params.sortDir) query += `&sortDir=${params.sortDir}`;
    return this.http.get<any>(`${BASE}/admin/foods?${query}`);
  }

  createFood(data: any): Observable<Food> {
    return this.http.post<Food>(`${BASE}/admin/foods`, data);
  }

  updateFood(id: number, data: any): Observable<Food> {
    return this.http.put<Food>(`${BASE}/admin/foods/${id}`, data);
  }

  deleteFood(id: number): Observable<any> {
    return this.http.delete(`${BASE}/admin/foods/${id}`);
  }

  toggleFoodAvailability(id: number): Observable<Food> {
    return this.http.put<Food>(`${BASE}/admin/foods/${id}/toggle`, {});
  }

  // Admin Category operations
  getCategoriesAdminPaginated(params: { restaurantId?: number; search?: string; page: number; size: number; sortBy?: string; sortDir?: string }): Observable<any> {
    let query = `page=${params.page}&size=${params.size}`;
    if (params.restaurantId) query += `&restaurantId=${params.restaurantId}`;
    if (params.search) query += `&search=${encodeURIComponent(params.search)}`;
    if (params.sortBy) query += `&sortBy=${params.sortBy}`;
    if (params.sortDir) query += `&sortDir=${params.sortDir}`;
    return this.http.get<any>(`${BASE}/admin/categories?${query}`);
  }

  createCategory(data: any): Observable<Category> {
    return this.http.post<Category>(`${BASE}/admin/categories`, data);
  }

  updateCategory(id: number, data: any): Observable<Category> {
    return this.http.put<Category>(`${BASE}/admin/categories/${id}`, data);
  }

  deleteCategory(id: number): Observable<any> {
    return this.http.delete<any>(`${BASE}/admin/categories/${id}`);
  }

  // Manager Food operations (paginated)
  getFoodsManagerPaginated(params: { categoryId?: number; search?: string; page: number; size: number; sortBy?: string; sortDir?: string }): Observable<any> {
    let query = `page=${params.page}&size=${params.size}`;
    if (params.categoryId) query += `&categoryId=${params.categoryId}`;
    if (params.search) query += `&search=${encodeURIComponent(params.search)}`;
    if (params.sortBy) query += `&sortBy=${params.sortBy}`;
    if (params.sortDir) query += `&sortDir=${params.sortDir}`;
    return this.http.get<any>(`${BASE}/manager/foods?${query}`);
  }

  // Manager Category operations
  getCategoriesManagerPaginated(params: { search?: string; page: number; size: number; sortBy?: string; sortDir?: string }): Observable<any> {
    let query = `page=${params.page}&size=${params.size}`;
    if (params.search) query += `&search=${encodeURIComponent(params.search)}`;
    if (params.sortBy) query += `&sortBy=${params.sortBy}`;
    if (params.sortDir) query += `&sortDir=${params.sortDir}`;
    return this.http.get<any>(`${BASE}/manager/categories?${query}`);
  }

  createCategoryManager(data: any): Observable<Category> {
    return this.http.post<Category>(`${BASE}/manager/categories`, data);
  }

  updateCategoryManager(id: number, data: any): Observable<Category> {
    return this.http.put<Category>(`${BASE}/manager/categories/${id}`, data);
  }

  deleteCategoryManager(id: number): Observable<any> {
    return this.http.delete<any>(`${BASE}/manager/categories/${id}`);
  }
}
