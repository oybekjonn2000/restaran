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

  getCategories(): Observable<Category[]> {
    return this.http.get<Category[]>(`${BASE}/categories`);
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

  // Admin operations
  getAllFoodsAdmin(): Observable<Food[]> {
    return this.http.get<Food[]>(`${BASE}/admin/foods`);
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

  createCategory(data: any): Observable<Category> {
    return this.http.post<Category>(`${BASE}/admin/categories`, data);
  }
}
