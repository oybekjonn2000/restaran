import { Injectable, signal, computed } from '@angular/core';
import { Food, CartItem } from '../models/food.model';

@Injectable({ providedIn: 'root' })
export class CartService {

  private _items = signal<CartItem[]>([]);

  readonly items = this._items.asReadonly();

  readonly totalItems = computed(() =>
    this._items().reduce((sum, i) => sum + i.quantity, 0)
  );

  readonly totalPrice = computed(() =>
    this._items().reduce((sum, i) => sum + i.food.price * i.quantity, 0)
  );

  readonly isEmpty = computed(() => this._items().length === 0);

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
  }

  removeItem(foodId: number): void {
    this._items.set(this._items().filter(i => i.food.id !== foodId));
  }

  updateQuantity(foodId: number, quantity: number): void {
    if (quantity <= 0) {
      this.removeItem(foodId);
      return;
    }
    this._items.set(
      this._items().map(i => i.food.id === foodId ? { ...i, quantity } : i)
    );
  }

  clear(): void {
    this._items.set([]);
  }

  getOrderItems(): { foodId: number; quantity: number }[] {
    return this._items().map(i => ({ foodId: i.food.id, quantity: i.quantity }));
  }
}
