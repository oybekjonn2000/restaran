import { Component, OnInit, OnDestroy, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { OrderService } from '../../../core/services/order.service';
import { Order, ORDER_STATUS_LABELS, OrderStatus } from '../../../core/models/order.model';

@Component({
  selector: 'app-courier-dashboard',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule, MatSnackBarModule],
  template: `
    <div class="courier-page animate-in">
      <div class="page-header">
        <div>
          <h1 class="page-title">🏍️ Kuryer Dashboard</h1>
          <p style="color: var(--text-muted); font-size: 0.9rem;">Buyurtmalarni qabul qiling va yetkazing</p>
        </div>
        <button class="btn btn-outline" (click)="loadAll()" id="courier-refresh">
          🔄 Yangilash
        </button>
      </div>

      <!-- Stats -->
      <div class="stats-grid" style="margin-bottom: 24px;">
        <div class="stat-card">
          <div class="stat-number">{{ activeRequests().length }}</div>
          <div class="stat-label">⚡ Yangi so'rovlar</div>
        </div>
        <div class="stat-card" style="border-color: rgba(139,92,246,0.3)">
          <div class="stat-number" style="color: #8b5cf6">{{ activeDeliveriesCount }}</div>
          <div class="stat-label">🚗 Faol yetkazilmoqda</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">{{ deliveredCount() }} ta</div>
          <div class="stat-label">✅ Topshirildi</div>
        </div>
        <div class="stat-card" style="border-color: rgba(16,185,129,0.3)">
          <div class="stat-number" style="color: #10b981">{{ totalEarnings | number:'1.0-0' }} so'm</div>
          <div class="stat-label">💰 Topilgan daromad</div>
        </div>
        <div class="stat-card" style="border-color: rgba(59,130,246,0.3)">
          <div class="stat-number" style="color: #3b82f6">{{ totalDistance | number:'1.0-1' }} km</div>
          <div class="stat-label">🛣️ Jami yurilgan masofa</div>
        </div>
      </div>

      <div class="two-cols">
        <!-- New Order Requests (Auto-assigned but not yet accepted) -->
        <div class="col">
          <h2 class="col-title">📥 Yangi buyurtma so'rovlari</h2>
          <p class="col-sub">Sizga avtomatik tayinlangan buyurtmalar (qabul qilishingiz kutilmoqda)</p>

          @if (loading()) {
            <div class="spinner-overlay"><mat-spinner color="warn" diameter="40"></mat-spinner></div>
          }

          @if (!loading()) {
            @if (activeRequests().length === 0) {
              <div class="empty-state" style="padding: 40px 0;">
                <div class="icon">📭</div>
                <p>Hozircha yangi so'rovlar yo'q</p>
              </div>
            } @else {
              <div class="orders-list">
                @for (order of activeRequests(); track order.id) {
                  <div class="order-card request-card" [id]="'request-order-' + order.id">
                    <div class="order-header">
                      <div>
                        <span class="order-num">#{{ order.id }}</span>
                        <span class="order-date">{{ order.createdAt | date:'HH:mm' }}</span>
                      </div>
                      <span class="badge badge-pending">Yangi so'rov</span>
                    </div>

                    <div class="order-details">
                      <p class="detail-item">👤 Mijoz: {{ order.user?.name }}</p>
                      <p class="detail-item">📍 Manzil: {{ order.deliveryAddress }}</p>
                      <p class="detail-item">🍽️ Taomlar: {{ order.items?.length }} ta</p>
                      <p class="detail-item total">💰 Ovqat: {{ order.totalPrice | number:'1.0-0' }} so'm | 🏍️ Kuryer haqi: {{ order.deliveryFee | number:'1.0-0' }} so'm ({{ order.distance }} km)</p>
                    </div>

                    <button
                      class="btn btn-primary accept-btn"
                      (click)="acceptOrder(order.id)"
                      [disabled]="actionLoading() === order.id"
                      [id]="'accept-' + order.id">
                      @if (actionLoading() === order.id) {
                        <mat-spinner diameter="16" color="accent"></mat-spinner>
                      } @else {
                        👍
                      }
                      Qabul qilish
                    </button>
                  </div>
                }
              </div>
            }
          }
        </div>

        <!-- My active deliveries in progress -->
        <div class="col">
          <h2 class="col-title">🏍️ Faol yetkazib berishlar</h2>
          <p class="col-sub">Hozirgi yetkazish jarayoni va marshrutlar</p>

          @if (!loading()) {
            @if (currentDeliveries().length === 0) {
              <div class="empty-state" style="padding: 40px 0;">
                <div class="icon">🏍️</div>
                <p>Hozircha faol buyurtmalaringiz yo'q</p>
              </div>
            } @else {
              <div class="orders-list">
                @for (order of currentDeliveries(); track order.id) {
                  <div class="order-card active-delivery" [id]="'active-order-' + order.id">
                    <div class="order-header">
                      <div>
                        <span class="order-num">#{{ order.id }}</span>
                        <span class="order-date">{{ order.createdAt | date:'HH:mm' }}</span>
                      </div>
                      <span class="badge" [class]="'badge-' + order.status.toLowerCase()">
                        {{ statusLabel(order.status) }}
                      </span>
                    </div>

                    <div class="order-details">
                      <p class="detail-item">👤 Mijoz: {{ order.user?.name }}</p>
                      <p class="detail-item">📍 Manzil: {{ order.deliveryAddress }}</p>
                      @if (order.note) {
                        <p class="detail-item note">💬 Izoh: {{ order.note }}</p>
                      }
                      <p class="detail-item total">💰 Ovqat: {{ order.totalPrice | number:'1.0-0' }} so'm | 🏍️ Kuryer haqi: {{ order.deliveryFee | number:'1.0-0' }} so'm ({{ order.distance }} km)</p>
                    </div>

                    <!-- Stage 1: Courier Accepted, moving to restaurant -->
                    @if (order.status === 'COURIER_ACCEPTED') {
                      <div class="route-section">
                        <p class="route-title">🏪 Restoranga borish yo'nalishi:</p>
                        <div [id]="'map-restaurant-' + order.id" class="delivery-map"></div>
                      </div>
                      <button
                        class="btn btn-primary action-btn"
                        (click)="arriveAtRestaurant(order.id)"
                        [disabled]="actionLoading() === order.id"
                        [id]="'arrive-rest-' + order.id">
                        @if (actionLoading() === order.id) {
                          <mat-spinner diameter="16" color="accent"></mat-spinner>
                        } @else {
                          🏪
                        }
                        Men restorandaman
                      </button>
                    }

                    <!-- Stage 2: Arrived at restaurant, preparing / waiting -->
                    @if (order.status === 'COURIER_AT_RESTAURANT') {
                      <div class="waiting-notice animate-pulse">
                        🏪 Siz restorandasiz. Taomni qabul qilib oling va yo'lga chiqing.
                      </div>
                      <button
                        class="btn btn-primary action-btn"
                        (click)="pickupFood(order.id)"
                        [disabled]="actionLoading() === order.id"
                        [id]="'pickup-' + order.id">
                        @if (actionLoading() === order.id) {
                          <mat-spinner diameter="16" color="accent"></mat-spinner>
                        } @else {
                          🚗
                        }
                        Yo'lga chiqdim (Taomni oldim)
                      </button>
                    }

                    <!-- Stage 3: Delivering to client, show route and link to Yandex Maps -->
                    @if (order.status === 'DELIVERING') {
                      <div class="route-section">
                        <p class="route-title">📍 Mijoz uyiga borish yo'nalishi:</p>
                        <div [id]="'map-client-' + order.id" class="delivery-map"></div>
                      </div>
                      
                      <div class="actions-row">
                        <button
                          class="btn btn-outline map-redirect-btn"
                          (click)="openYandexRoute(order)"
                          [id]="'yandex-redirect-' + order.id">
                          🗺️ Yandex Kartada ochish (Marshrut)
                        </button>
                        
                        <button
                          class="btn btn-primary action-btn"
                          (click)="arriveAtClient(order.id)"
                          [disabled]="actionLoading() === order.id"
                          [id]="'arrive-client-' + order.id">
                          @if (actionLoading() === order.id) {
                            <mat-spinner diameter="16" color="accent"></mat-spinner>
                          } @else {
                            📍
                          }
                          Men mijoz manzilidaman
                        </button>
                      </div>
                    }

                    <!-- Stage 4: Arrived at client, call and complete buttons -->
                    @if (order.status === 'COURIER_AT_CLIENT') {
                      <div class="arrived-notice">
                        📍 Siz mijoz manzilidasiz. Mijoz bilan bog'laning va buyurtmani topshiring.
                      </div>
                      <div class="actions-row">
                        <a
                          [href]="'tel:' + (order.user?.phone || '')"
                          class="btn btn-outline call-btn"
                          [id]="'call-client-' + order.id">
                          📞 Mijozga tel qilish
                        </a>
                        <button
                          class="btn btn-success action-btn"
                          (click)="deliverOrder(order.id)"
                          [disabled]="actionLoading() === order.id"
                          [id]="'complete-' + order.id">
                          @if (actionLoading() === order.id) {
                            <mat-spinner diameter="16" color="accent"></mat-spinner>
                          } @else {
                            🏁
                          }
                          Buyurtmani topshirdim
                        </button>
                      </div>
                    }
                  </div>
                }
              </div>
            }
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .courier-page { max-width: 1100px; margin: 0 auto; }

    .two-cols {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
    }

    .col-title { font-size: 1.15rem; font-weight: 700; margin-bottom: 4px; color: var(--text); }
    .col-sub { font-size: 0.8rem; color: var(--text-muted); margin-bottom: 16px; }

    .orders-list { display: flex; flex-direction: column; gap: 16px; }

    .order-card {
      background: var(--bg-card);
      border-radius: var(--radius-lg);
      border: 1px solid var(--border);
      padding: 20px;
      transition: var(--transition);
      animation: fadeInUp 0.3s ease both;
    }
    .order-card.request-card { border-color: rgba(245,158,11,0.2); }
    .order-card.active-delivery { border-color: rgba(139,92,246,0.3); }

    .order-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 12px;
      border-bottom: 1px solid rgba(255,255,255,0.05);
      padding-bottom: 8px;
    }
    .order-num { font-size: 1.05rem; font-weight: 700; color: var(--text); margin-right: 8px; }
    .order-date { font-size: 0.78rem; color: var(--text-muted); }

    .order-details { display: flex; flex-direction: column; gap: 4px; margin-bottom: 16px; }
    .detail-item { font-size: 0.875rem; color: var(--text-muted); }
    .detail-item.total { color: var(--primary); font-weight: 700; font-size: 0.95rem; }
    .detail-item.note { font-style: italic; color: #cbd5e1; }

    .accept-btn, .action-btn {
      width: 100%;
      justify-content: center;
      gap: 8px;
      padding: 12px;
    }

    .route-section {
      margin-bottom: 16px;
    }
    .route-title { font-size: 0.85rem; font-weight: 600; color: var(--text); margin-bottom: 8px; }

    .delivery-map {
      width: 100%;
      height: 220px;
      border-radius: var(--radius);
      border: 1px solid var(--border);
      overflow: hidden;
      background: var(--bg-card2);
    }

    .waiting-notice {
      background: rgba(6,182,212,0.1);
      border: 1px solid rgba(6,182,212,0.25);
      color: #06b6d4;
      border-radius: var(--radius);
      padding: 12px;
      font-size: 0.85rem;
      margin-bottom: 14px;
      text-align: center;
      font-weight: 500;
    }

    .arrived-notice {
      background: rgba(20,184,166,0.1);
      border: 1px solid rgba(20,184,166,0.25);
      color: #14b8a6;
      border-radius: var(--radius);
      padding: 12px;
      font-size: 0.85rem;
      margin-bottom: 14px;
      text-align: center;
      font-weight: 500;
    }

    .actions-row {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .actions-row .btn {
      width: 100%;
      justify-content: center;
      padding: 12px;
    }

    .call-btn {
      background: rgba(59,130,246,0.15) !important;
      color: #3b82f6 !important;
      border-color: rgba(59,130,246,0.3) !important;
      text-align: center;
      display: flex;
      align-items: center;
      font-weight: 600;
      border: 2px solid;
    }

    .map-redirect-btn {
      border-color: var(--primary) !important;
      color: var(--primary) !important;
      font-weight: 600;
    }

    .btn-success { background: var(--success); color: white; }
    .btn-success:hover { opacity: 0.95; }

    @media (max-width: 768px) {
      .two-cols { grid-template-columns: 1fr; }
    }
  `]
})
export class CourierDashboardComponent implements OnInit, OnDestroy {
  allOrders = signal<Order[]>([]);
  loading = signal(true);
  actionLoading = signal<number | null>(null);

  // Computed signals for clean categorization
  activeRequests = signal<Order[]>([]);
  currentDeliveries = signal<Order[]>([]);
  deliveredCount = signal<number>(0);

  get activeDeliveriesCount(): number {
    return this.currentDeliveries().filter(o => o.status !== 'DELIVERED').length;
  }

  get totalEarnings(): number {
    return this.allOrders()
      .filter(o => o.status === 'DELIVERED')
      .reduce((sum, o) => sum + (o.deliveryFee || 0), 0);
  }

  get totalDistance(): number {
    return this.allOrders()
      .filter(o => o.status === 'DELIVERED')
      .reduce((sum, o) => sum + (o.distance || 0), 0);
  }

  private pollInterval: any;
  private mapsInitialized = new Set<string>();

  // Static coordinate of the restaurant (Karshi location)
  private restaurantCoords = [38.866127, 65.816309];
  // Mock current location of the courier (Karshi location near restaurant)
  private courierStartCoords = [38.870000, 65.810000];

  constructor(
    private orderService: OrderService,
    private snack: MatSnackBar
  ) {
    // Re-initialize maps whenever currentDeliveries changes
    effect(() => {
      const deliveries = this.currentDeliveries();
      if (deliveries.length > 0) {
        setTimeout(() => {
          deliveries.forEach(order => {
            let restLat = 38.866127;
            let restLng = 65.816309;
            if (order.restaurant && order.restaurant.latitude && order.restaurant.longitude) {
              restLat = order.restaurant.latitude;
              restLng = order.restaurant.longitude;
            }
            const dynamicRestCoords = [restLat, restLng];

            if (order.status === 'COURIER_ACCEPTED') {
              const mapId = `map-restaurant-${order.id}`;
              if (!this.mapsInitialized.has(mapId)) {
                this.initRouteMap(order.id, this.courierStartCoords, dynamicRestCoords, mapId);
              }
            } else if (order.status === 'DELIVERING') {
              const mapId = `map-client-${order.id}`;
              if (!this.mapsInitialized.has(mapId)) {
                const clientCoords = [order.latitude || 41.3111, order.longitude || 69.2797];
                this.initRouteMap(order.id, dynamicRestCoords, clientCoords, mapId);
              }
            }
          });
        }, 500);
      }
    });
  }

  ngOnInit(): void {
    this.loadAll(true);
    this.pollInterval = setInterval(() => this.loadAll(false), 4000);
  }

  ngOnDestroy(): void {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
    }
  }

  loadAll(showLoader = true): void {
    if (showLoader) this.loading.set(true);
    this.orderService.getMyCourierOrders().subscribe({
      next: (orders) => {
        this.allOrders.set(orders);
        
        // Categorize orders
        // Active Requests are assigned orders where status is PREPARING
        this.activeRequests.set(orders.filter(o => o.status === 'PREPARING'));
        
        // Active and completed Deliveries
        this.currentDeliveries.set(orders.filter(o => 
          o.status === 'COURIER_ACCEPTED' || 
          o.status === 'COURIER_AT_RESTAURANT' || 
          o.status === 'DELIVERING' || 
          o.status === 'COURIER_AT_CLIENT' ||
          o.status === 'DELIVERED'
        ));

        // Total delivered orders
        this.deliveredCount.set(orders.filter(o => o.status === 'DELIVERED').length);

        if (showLoader) this.loading.set(false);
      },
      error: () => {
        if (showLoader) this.loading.set(false);
      }
    });
  }

  acceptOrder(id: number): void {
    this.actionLoading.set(id);
    this.orderService.acceptOrder(id).subscribe({
      next: () => {
        this.actionLoading.set(null);
        this.snack.open('🏍️ Buyurtma qabul qilindi! Restoranga yo\'l oling.', '', { duration: 3000 });
        this.loadAll(false);
      },
      error: (err) => {
        this.actionLoading.set(null);
        this.snack.open(`❌ Xatolik: ${err.error?.message || 'Qabul qilib bo\'lmadi'}`, '', { duration: 3000 });
      }
    });
  }

  arriveAtRestaurant(id: number): void {
    this.actionLoading.set(id);
    this.orderService.arriveRestaurant(id).subscribe({
      next: () => {
        this.actionLoading.set(null);
        this.snack.open('🏪 Restoranga kelganingiz tasdiqlandi!', '', { duration: 3000 });
        this.loadAll(false);
      },
      error: () => this.actionLoading.set(null)
    });
  }

  pickupFood(id: number): void {
    this.actionLoading.set(id);
    this.orderService.pickupOrder(id).subscribe({
      next: () => {
        this.actionLoading.set(null);
        this.snack.open('🚗 Taomni oldingiz, mijoz tomon yo\'lga chiqing!', '', { duration: 3000 });
        this.loadAll(false);
      },
      error: () => this.actionLoading.set(null)
    });
  }

  arriveAtClient(id: number): void {
    this.actionLoading.set(id);
    this.orderService.arriveClient(id).subscribe({
      next: () => {
        this.actionLoading.set(null);
        this.snack.open('📍 Mijoz manziliga yetib keldingiz!', '', { duration: 3000 });
        this.loadAll(false);
      },
      error: () => this.actionLoading.set(null)
    });
  }

  deliverOrder(id: number): void {
    this.actionLoading.set(id);
    this.orderService.deliverOrder(id).subscribe({
      next: () => {
        this.actionLoading.set(null);
        this.snack.open('🎉 Buyurtma topshirildi! Baraka toping.', '', { duration: 3500 });
        this.loadAll(false);
      },
      error: () => this.actionLoading.set(null)
    });
  }

  openYandexRoute(order: Order): void {
    let restLat = 38.866127;
    let restLng = 65.816309;
    if (order.restaurant && order.restaurant.latitude && order.restaurant.longitude) {
      restLat = order.restaurant.latitude;
      restLng = order.restaurant.longitude;
    }
    const start = `${restLat},${restLng}`;
    const dest = `${order.latitude || 41.3111},${order.longitude || 69.2797}`;
    const url = `https://yandex.ru/maps/?rtext=${start}~${dest}&rtt=auto`;
    window.open(url, '_blank');
  }

  initRouteMap(orderId: number, startCoords: number[], endCoords: number[], containerId: string): void {
    const ymaps = (window as any).ymaps;
    if (!ymaps) return;

    this.mapsInitialized.add(containerId);

    ymaps.ready(() => {
      const container = document.getElementById(containerId);
      if (!container) return;

      container.innerHTML = '';
      const map = new ymaps.Map(containerId, {
        center: startCoords,
        zoom: 13,
        controls: ['zoomControl']
      });

      const multiRoute = new ymaps.multiRouter.MultiRoute({
        referencePoints: [
          startCoords,
          endCoords
        ],
        params: {
          routingMode: 'auto'
        }
      }, {
        boundsAutoApply: true
      });

      map.geoObjects.add(multiRoute);
    });
  }

  statusLabel(status: OrderStatus): string {
    return ORDER_STATUS_LABELS[status] ?? status;
  }
}
