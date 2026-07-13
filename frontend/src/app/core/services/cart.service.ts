import { Injectable, signal, computed, effect, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Food, CartItem } from '../models/food.model';
import { AuthService } from './auth.service';
import { API_BASE } from '../config';

@Injectable({ providedIn: 'root' })
export class CartService {

  private authService = inject(AuthService);
  private http = inject(HttpClient);
  private _items = signal<CartItem[]>([]);

  readonly items = this._items.asReadonly();

  readonly totalItems = computed(() =>
    this._items().reduce((sum, i) => sum + i.quantity, 0)
  );

  readonly totalPrice = computed(() =>
    this._items().reduce((sum, i) => sum + i.food.price * i.quantity, 0)
  );

  readonly isEmpty = computed(() => this._items().length === 0);

  constructor() {
    // Initial load from storage (local and async backend)
    this.loadFromStorage();

    // Dynamically react to login/logout user changes
    effect(() => {
      const user = this.authService.user();
      if (user) {
        // If there were items in guest cart, sync/merge them to user cart first!
        const guestStored = localStorage.getItem('cart_items_guest');
        if (guestStored) {
          try {
            const guestItems: CartItem[] = JSON.parse(guestStored);
            if (guestItems.length > 0) {
              const dtoList = guestItems.map(i => ({ foodId: i.food.id, quantity: i.quantity }));
              this.http.post<any[]>(`${API_BASE}/api/cart/sync`, dtoList).subscribe({
                next: (backendItems) => {
                  this._items.set(backendItems);
                  localStorage.removeItem('cart_items_guest');
                  this.saveToStorage(false); // save locally, no need to resync backend
                },
                error: (e) => {
                  console.error('Error syncing guest cart to backend', e);
                  this.loadFromStorage();
                }
              });
              return;
            }
          } catch (e) {
            console.error('Error parsing guest cart', e);
          }
        }
      }
      this.loadFromStorage();
    }, { allowSignalWrites: true });
  }

  private getStorageKey(): string {
    const user = this.authService.user();
    return user ? `cart_items_${user.id}` : 'cart_items_guest';
  }

  private loadFromStorage(): void {
    // 1. Load locally for instant display
    try {
      const key = this.getStorageKey();
      const stored = localStorage.getItem(key);
      if (stored) {
        this._items.set(JSON.parse(stored));
      } else {
        this._items.set([]);
      }
    } catch (e) {
      console.error('Error loading cart from localStorage', e);
      this._items.set([]);
    }

    // 2. Fetch from backend if logged in to sync from database
    if (this.authService.isLoggedIn()) {
      this.http.get<any[]>(`${API_BASE}/api/cart`).subscribe({
        next: (backendItems) => {
          this._items.set(backendItems);
          try {
            const key = this.getStorageKey();
            localStorage.setItem(key, JSON.stringify(backendItems));
          } catch (e) {
            console.error(e);
          }
        },
        error: (err) => {
          console.warn('Could not sync cart from backend', err);
        }
      });
    }
  }

  private saveToStorage(syncBackend: boolean = true): void {
    // 1. Save locally
    try {
      const key = this.getStorageKey();
      localStorage.setItem(key, JSON.stringify(this._items()));
    } catch (e) {
      console.error('Error saving cart to localStorage', e);
    }

    // 2. Sync to backend if logged in and syncBackend flag is true
    if (syncBackend && this.authService.isLoggedIn()) {
      const dtoList = this.getOrderItems();
      this.http.post<any[]>(`${API_BASE}/api/cart/sync`, dtoList).subscribe({
        next: (backendItems) => {
          this._items.set(backendItems);
          try {
            const key = this.getStorageKey();
            localStorage.setItem(key, JSON.stringify(backendItems));
          } catch (e) {
            console.error(e);
          }
        },
        error: (err) => {
          console.warn('Could not sync cart to backend', err);
        }
      });
    }
  }

  getRestaurantId(): number | null {
    const items = this._items();
    if (items.length === 0) return null;
    return items[0].food.restaurant?.id || null;
  }

  canAdd(food: Food): boolean {
    const currentRestId = this.getRestaurantId();
    if (currentRestId === null) return true;
    return currentRestId === (food.restaurant?.id || null);
  }

  addItem(food: Food, quantity: number = 1): void {
    const items = this._items();
    const idx = items.findIndex(i => i.food.id === food.id);
    if (idx > -1) {
      const updated = [...items];
      updated[idx] = { ...updated[idx], quantity: updated[idx].quantity + quantity };
      this._items.set(updated);
    } else {
      this._items.set([...items, { food, quantity }]);
    }
    this.saveToStorage();
  }

  removeItem(foodId: number): void {
    this._items.set(this._items().filter(i => i.food.id !== foodId));
    this.saveToStorage();
  }

  updateQuantity(foodId: number, quantity: number): void {
    if (quantity <= 0) {
      this.removeItem(foodId);
      return;
    }
    this._items.set(
      this._items().map(i => i.food.id === foodId ? { ...i, quantity } : i)
    );
    this.saveToStorage();
  }

  clear(): void {
    this._items.set([]);
    this.saveToStorage();
  }

  getOrderItems(): { foodId: number; quantity: number }[] {
    return this._items().map(i => ({ foodId: i.food.id, quantity: i.quantity }));
  }
}
