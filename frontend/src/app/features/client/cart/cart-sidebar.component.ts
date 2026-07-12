import { Component, Input, Output, EventEmitter, signal, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CartService } from '../../../core/services/cart.service';
import { OrderService } from '../../../core/services/order.service';
import { AuthService } from '../../../core/services/auth.service';
import { HttpClient } from '@angular/common/http';
import { API_BASE } from '../../../core/config';

@Component({
  selector: 'app-cart-sidebar',
  standalone: true,
  imports: [CommonModule, FormsModule, MatSnackBarModule, MatProgressSpinnerModule],
  template: `
    <div class="sidebar" [class.open]="isOpen">
      <!-- Header -->
      <div class="sidebar-header">
        <h2 class="sidebar-title">🛒 Savat</h2>
        <button class="close-btn" (click)="closed.emit()" id="cart-close-btn">✕</button>
      </div>

      <!-- Empty state -->
      @if (cart.isEmpty()) {
        <div class="empty-cart">
          <div class="empty-icon">🛒</div>
          <p>Savat bo'sh</p>
          <small>Menyudan taom tanlang</small>
        </div>
      }

      <!-- Items list -->
      @if (!cart.isEmpty()) {
        <div class="cart-items">
          @for (item of cart.items(); track item.food.id) {
            <div class="cart-item">
              <img [src]="item.food.imageUrl" [alt]="item.food.name"
                   class="item-img" (error)="onImgError($event)">
              <div class="item-info">
                <span class="item-name">{{ item.food.name }}</span>
                <span class="item-price">{{ item.food.price | number:'1.0-0' }} so'm</span>
              </div>
              <div class="qty-controls">
                <button class="qty-btn" (click)="cart.updateQuantity(item.food.id, item.quantity - 1)"
                        [id]="'qty-minus-' + item.food.id">−</button>
                <span class="qty-num">{{ item.quantity }}</span>
                <button class="qty-btn" (click)="cart.updateQuantity(item.food.id, item.quantity + 1)"
                        [id]="'qty-plus-' + item.food.id">+</button>
              </div>
              <button class="remove-btn" (click)="cart.removeItem(item.food.id)"
                      [id]="'remove-' + item.food.id">🗑️</button>
            </div>
          }
        </div>

        <!-- Order form -->
        <div class="order-form">
          <h3 class="form-section-title">📍 Yetkazib berish manzili</h3>
          <textarea
            [(ngModel)]="deliveryAddress"
            class="form-control"
            placeholder="Yetkazib berish manzili..."
            rows="2"
            id="delivery-address"></textarea>

          <div style="position: relative; margin-top: 8px;">
            <div id="yandex-map" style="width: 100%; height: 200px; border-radius: var(--radius); border: 1px solid var(--border); overflow: hidden;"></div>
            <button type="button" class="locate-me-btn" (click)="locateMe()" id="locate-me-btn">
              📍 Joylashuvni aniqlash
            </button>
          </div>

          <textarea
            [(ngModel)]="note"
            class="form-control"
            style="margin-top: 8px"
            placeholder="Izoh (ixtiyoriy)..."
            rows="2"
            id="order-note"></textarea>
        </div>

        <!-- Summary -->
        <div class="cart-summary">
          <div class="summary-row">
            <span class="s-label">Taomlar summasi:</span>
            <span class="s-value">{{ cart.totalPrice() | number:'1.0-0' }} so'm</span>
          </div>
          @if (courierActive) {
            <div class="summary-row">
              <span class="s-label">Yetkazib berish ({{ distance }} km):</span>
              <span class="s-value">{{ deliveryFee | number:'1.0-0' }} so'm</span>
            </div>
            <div class="summary-row total">
              <span class="s-label">Jami summa:</span>
              <span class="s-value price">{{ (cart.totalPrice() + deliveryFee) | number:'1.0-0' }} so'm</span>
            </div>
          } @else {
            <div class="summary-row yandex-fee-row">
              <span class="s-label">Yetkazib berish:</span>
              <span class="s-value yandex-label">🚕 Yandex dastavka summa</span>
            </div>
            <div class="summary-row total">
              <span class="s-label">Jami summa:</span>
              <span class="s-value price">{{ cart.totalPrice() | number:'1.0-0' }} so'm + <span class="yandex-inline">Yandex</span></span>
            </div>
          }
        </div>

        <!-- Actions -->
        <div class="cart-actions">
          <button class="btn btn-outline" (click)="cart.clear()" id="cart-clear-btn">
            🗑️ Tozalash
          </button>
          <button
            class="btn btn-primary"
            (click)="placeOrder()"
            [disabled]="ordering() || !deliveryAddress"
            id="place-order-btn">
            @if (ordering()) {
              <mat-spinner diameter="18" color="accent"></mat-spinner>
            }
            🎯 Buyurtma berish
          </button>
        </div>

        @if (!deliveryAddress) {
          <p class="address-hint">⚠️ Manzilni kiriting</p>
        }
      }
    </div>
  `,
  styles: [`
    .sidebar {
      position: fixed;
      top: 0;
      right: -420px;
      width: 420px;
      max-width: 100vw;
      height: 100vh;
      background: var(--bg-card);
      border-left: 1px solid var(--border);
      z-index: 200;
      display: flex;
      flex-direction: column;
      transition: right 0.35s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: -8px 0 40px rgba(0,0,0,0.4);
    }
    .sidebar.open { right: 0; }

    .sidebar-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 20px 24px;
      border-bottom: 1px solid var(--border);
    }

    .sidebar-title { font-size: 1.2rem; font-weight: 700; }

    .close-btn {
      background: var(--bg-card2);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 6px 10px;
      cursor: pointer;
      font-size: 0.9rem;
      color: var(--text-muted);
      transition: var(--transition);
    }
    .close-btn:hover { background: var(--danger); color: white; border-color: var(--danger); }

    .empty-cart {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      flex: 1;
      text-align: center;
      gap: 8px;
      color: var(--text-muted);
    }
    .empty-icon { font-size: 3.5rem; opacity: 0.4; }
    .empty-cart p { font-size: 1rem; font-weight: 600; }
    .empty-cart small { font-size: 0.8rem; }

    .cart-items {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .cart-item {
      display: flex;
      align-items: center;
      gap: 12px;
      background: var(--bg-card2);
      border-radius: var(--radius);
      padding: 10px;
      border: 1px solid var(--border);
    }

    .item-img {
      width: 50px;
      height: 50px;
      border-radius: 8px;
      object-fit: cover;
      flex-shrink: 0;
    }

    .item-info {
      flex: 1;
      min-width: 0;
    }
    .item-name {
      display: block;
      font-size: 0.875rem;
      font-weight: 600;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .item-price { font-size: 0.8rem; color: var(--primary); font-weight: 600; }

    .qty-controls {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .qty-btn {
      width: 28px;
      height: 28px;
      border-radius: 8px;
      border: 1px solid var(--border);
      background: var(--bg-card);
      color: var(--text);
      cursor: pointer;
      font-size: 1rem;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: var(--transition);
      font-weight: 700;
    }
    .qty-btn:hover { background: var(--primary); border-color: var(--primary); color: white; }

    .qty-num {
      min-width: 24px;
      text-align: center;
      font-weight: 700;
      font-size: 0.9rem;
    }

    .remove-btn {
      background: none;
      border: none;
      cursor: pointer;
      font-size: 1rem;
      padding: 4px;
      transition: var(--transition);
      border-radius: 6px;
    }
    .remove-btn:hover { background: rgba(239,68,68,0.1); transform: scale(1.2); }

    .order-form {
      padding: 0 16px;
      margin-bottom: 8px;
    }
    .form-section-title {
      font-size: 0.875rem;
      font-weight: 600;
      margin-bottom: 8px;
      color: var(--text-muted);
    }

    .cart-summary {
      padding: 16px;
      border-top: 1px solid var(--border);
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .summary-row {
      display: flex;
      justify-content: space-between;
      font-size: 0.875rem;
    }
    .summary-row.total { font-weight: 700; font-size: 1rem; }

    .s-label { color: var(--text-muted); }
    .s-value { color: var(--text); }
    .s-value.price { color: var(--primary); }

    .cart-actions {
      display: flex;
      gap: 10px;
      padding: 16px;
      border-top: 1px solid var(--border);
    }
    .cart-actions .btn { flex: 1; justify-content: center; gap: 6px; }

    .address-hint {
      text-align: center;
      font-size: 0.78rem;
      color: var(--warning);
      padding-bottom: 8px;
    }
    .locate-me-btn {
      position: absolute;
      bottom: 10px;
      right: 10px;
      z-index: 100;
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 6px 12px;
      font-size: 0.75rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 4px;
      color: var(--text);
      box-shadow: 0 2px 8px rgba(0,0,0,0.25);
      transition: var(--transition);
      font-family: inherit;
    }
    .locate-me-btn:hover {
      background: var(--primary);
      color: white;
      border-color: var(--primary);
    }
    .yandex-label {
      color: #f59e0b;
      font-weight: 600;
      font-size: 0.85rem;
    }
    .yandex-fee-row .s-label { color: var(--text-muted); }
    .yandex-inline {
      color: #f59e0b;
      font-weight: 700;
      font-size: 0.85rem;
    }
  `]
})
export class CartSidebarComponent {
  private _isOpen = false;
  @Input() set isOpen(value: boolean) {
    this._isOpen = value;
    if (value) {
      this.checkCourierActive();
      setTimeout(() => this.initMap(), 300);
    }
  }
  get isOpen(): boolean {
    return this._isOpen;
  }

  @Output() closed = new EventEmitter<void>();

  deliveryAddress = '';
  note = '';
  ordering = signal(false);

  // Yandex Map properties (Defaulting to Karshi Restaurant location)
  latitude = 38.866127;
  longitude = 65.816309;
  map: any;
  placemark: any;
  restaurantPlacemark: any;

  // Real Yandex routing distance and calculated fee
  distance = 0;
  deliveryFee = 10000;
  courierActive = true; // Default true, will be updated on open

  constructor(
    public cart: CartService,
    private orderService: OrderService,
    public auth: AuthService,
    private snack: MatSnackBar,
    private ngZone: NgZone,
    private router: Router,
    private http: HttpClient
  ) {
    const user = this.auth.user();
    if (user?.address) {
      this.deliveryAddress = user.address;
    }
  }

  checkCourierActive(): void {
    this.orderService.isCourierActive().subscribe({
      next: (res) => {
        this.ngZone.run(() => {
          this.courierActive = res.active;
        });
      },
      error: () => {
        // Default: assume courier is active if API fails
        this.courierActive = true;
      }
    });
  }

  locateMe(): void {
    if (!navigator.geolocation) {
      this.snack.open('⚠️ Geolokatsiya brauzeringiz tomonidan qo\'llab-quvvatlanmaydi', 'Yopish', { duration: 3000 });
      return;
    }

    this.snack.open('🔍 Joylashuvingiz aniqlanmoqda...', 'Yopish', { duration: 2000 });

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const coords = [lat, lng];

        this.ngZone.run(() => {
          if (this.map) {
            this.map.setCenter(coords, 15);
            this.setMarker(coords);
            this.snack.open('✅ Joylashuv aniqlandi!', 'Yopish', { duration: 2000 });
          }
        });
      },
      (error) => {
        let msg = '⚠️ Joylashuvni aniqlab bo\'lmadi';
        if (error.code === error.PERMISSION_DENIED) {
          msg = '⚠️ Geolokatsiya uchun ruxsat berilmadi';
        }
        this.snack.open(msg, 'Yopish', { duration: 3000 });
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }

  initMap(): void {
    const ymaps = (window as any).ymaps;
    if (!ymaps) {
      console.warn('Yandex Maps API is not loaded');
      return;
    }

    ymaps.ready(() => {
      // Get restaurant coordinates from cart items
      let restLat = 38.866127;
      let restLng = 65.816309;
      let restName = 'Restoran';
      const items = this.cart.items();
      if (items.length > 0 && items[0].food.restaurant) {
        const rest = items[0].food.restaurant;
        if (rest.latitude && rest.longitude) {
          restLat = rest.latitude;
          restLng = rest.longitude;
        }
        if (rest.name) restName = rest.name;
      }

      const restCoords = [restLat, restLng];
      const mapContainer = document.getElementById('yandex-map');
      if (!mapContainer) return;

      mapContainer.innerHTML = '';

      this.map = new ymaps.Map('yandex-map', {
        center: restCoords,
        zoom: 13,
        controls: ['zoomControl']
      });

      this.map.events.add('click', (e: any) => {
        const coords = e.get('coords');
        this.ngZone.run(() => {
          this.setMarker(coords);
        });
      });

      // Add restaurant marker first
      this.addRestaurantMarker(restCoords, restName);

      // Set default delivery marker at restaurant location
      this.setMarker(restCoords);
    });
  }

  addRestaurantMarker(coords: number[], name: string): void {
    const ymaps = (window as any).ymaps;
    if (!ymaps || !this.map) return;

    if (this.restaurantPlacemark) {
      this.map.geoObjects.remove(this.restaurantPlacemark);
    }

    this.restaurantPlacemark = new ymaps.Placemark(
      coords,
      {
        balloonContentHeader: `🍽️ ${name}`,
        balloonContentBody: 'Buyurtmangiz shu restorandan tayyorlanadi',
        hintContent: `🍽️ ${name}`
      },
      {
        preset: 'islands#redFoodIcon',
        iconColor: '#ff4444'
      }
    );

    this.map.geoObjects.add(this.restaurantPlacemark);
  }

  setMarker(coords: number[]): void {
    const ymaps = (window as any).ymaps;
    if (!ymaps || !this.map) return;

    this.latitude = coords[0];
    this.longitude = coords[1];

    if (this.placemark) {
      this.placemark.geometry.setCoordinates(coords);
    } else {
      this.placemark = new ymaps.Placemark(coords, {}, {
        preset: 'islands#violetDotIconWithCaption',
        draggable: true
      });

      this.placemark.events.add('dragend', () => {
        const newCoords = this.placemark.geometry.getCoordinates();
        this.ngZone.run(() => {
          this.latitude = newCoords[0];
          this.longitude = newCoords[1];
          this.geocode(newCoords);
          this.calculateYandexDistance(newCoords);
        });
      });

      this.map.geoObjects.add(this.placemark);
    }

    this.geocode(coords);
    this.calculateYandexDistance(coords);
  }

  geocode(coords: number[]): void {
    const ymaps = (window as any).ymaps;
    this.deliveryAddress = 'Manzil aniqlanmoqda...';

    if (ymaps) {
      ymaps.geocode(coords).then((res: any) => {
        const firstGeoObject = res.geoObjects.get(0);
        if (firstGeoObject) {
          const address = firstGeoObject.getAddressLine();
          this.ngZone.run(() => {
            this.deliveryAddress = address;
          });
        } else {
          this.geocodeOSM(coords);
        }
      }, (err: any) => {
        console.warn('Yandex geocoder failed, trying OpenStreetMap Nominatim...', err);
        this.geocodeOSM(coords);
      });
    } else {
      this.geocodeOSM(coords);
    }
  }

  geocodeOSM(coords: number[]): void {
    const lat = coords[0];
    const lon = coords[1];
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&accept-language=uz`;

    fetch(url, {
      headers: {
        'User-Agent': 'FoodDeliveryApp/1.0'
      }
    })
      .then(res => {
        if (!res.ok) throw new Error('OSM request failed');
        return res.json();
      })
      .then(data => {
        if (data && data.display_name) {
          // Simplify address or use directly
          this.ngZone.run(() => {
            this.deliveryAddress = data.display_name;
          });
        } else {
          this.ngZone.run(() => {
            this.deliveryAddress = `Koordinata: ${lat.toFixed(6)}, ${lon.toFixed(6)}`;
          });
        }
      })
      .catch(err => {
        console.error('OSM geocoding failed:', err);
        this.ngZone.run(() => {
          this.deliveryAddress = `Koordinata: ${lat.toFixed(6)}, ${lon.toFixed(6)}`;
        });
      });
  }

  calculateHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2); 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    return R * c; // Distance in km
  }

  calculateYandexDistance(coords: number[]): void {
    const ymaps = (window as any).ymaps;

    // Load coordinates of the selected restaurant dynamically
    let restLat = 38.866127;
    let restLng = 65.816309;
    const items = this.cart.items();
    if (items.length > 0 && items[0].food.restaurant) {
      const rest = items[0].food.restaurant;
      if (rest.latitude && rest.longitude) {
        restLat = rest.latitude;
        restLng = rest.longitude;
      }
    }

    const restCoords = [restLat, restLng];

    if (!ymaps) {
      this.fallbackToHaversine(restLat, restLng, coords[0], coords[1]);
      return;
    }

    ymaps.route([restCoords, coords]).then((route: any) => {
      const distanceInMeters = route.getLength();
      const distanceInKm = distanceInMeters / 1000;
      
      this.ngZone.run(() => {
        this.distance = Math.round(distanceInKm * 10) / 10; // Round to 1 decimal place (e.g., 5.4 km)
        this.deliveryFee = 10000 + (this.distance * 1800);
        this.deliveryFee = Math.round(this.deliveryFee / 100) * 100; // Round to nearest 100 so'm
      });
    }, (err: any) => {
      console.warn('Error calculating Yandex route distance, fallback to Haversine', err);
      this.fallbackToHaversine(restLat, restLng, coords[0], coords[1]);
    });
  }

  private fallbackToHaversine(restLat: number, restLng: number, targetLat: number, targetLng: number): void {
    const straightDistance = this.calculateHaversineDistance(restLat, restLng, targetLat, targetLng);
    // Driving distance is usually around 1.35 times straight-line distance due to roads
    const estimatedDrivingDistance = straightDistance * 1.35;
    
    this.ngZone.run(() => {
      this.distance = Math.round(estimatedDrivingDistance * 10) / 10;
      if (this.distance < 0.1) {
        this.distance = 0;
        this.deliveryFee = 10000;
      } else {
        this.deliveryFee = 10000 + (this.distance * 1800);
        this.deliveryFee = Math.round(this.deliveryFee / 100) * 100; // Round to nearest 100 so'm
      }
    });
  }

  placeOrder(): void {
    if (!this.deliveryAddress || this.cart.isEmpty()) return;

    if (!this.auth.isLoggedIn()) {
      this.closed.emit();
      this.snack.open('⚠️ Buyurtma berish uchun avval tizimga kiring!', 'Yopish', { duration: 4000 });
      this.router.navigate(['/auth/login']);
      return;
    }

    this.ordering.set(true);

    const restId = this.cart.getRestaurantId();

    this.orderService.createOrder({
      deliveryAddress: this.deliveryAddress,
      latitude: this.latitude,
      longitude: this.longitude,
      distance: this.distance,
      deliveryFee: this.deliveryFee,
      restaurantId: restId || undefined,
      note: this.note || undefined,
      items: this.cart.getOrderItems()
    }).subscribe({
      next: (order) => {
        this.ordering.set(false);
        this.cart.clear();
        this.note = '';
        this.closed.emit();
        this.snack.open(
          `🎉 Buyurtma #${order.id} muvaffaqiyatli berildi!`,
          'Yopish',
          { duration: 4000, panelClass: ['success-snack'] }
        );
      },
      error: (err) => {
        this.ordering.set(false);
        this.snack.open(
          `❌ Xatolik: ${err.error?.message || 'Buyurtma berilib bo\'lmadi'}`,
          'Yopish',
          { duration: 4000 }
        );
      }
    });
  }

  onImgError(e: Event): void {
    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=100';
  }
}
