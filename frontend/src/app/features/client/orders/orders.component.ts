import { Component, OnInit, OnDestroy, signal, inject, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { OrderService } from '../../../core/services/order.service';
import { Order, ORDER_STATUS_LABELS, ORDER_STATUS_COLORS, OrderStatus } from '../../../core/models/order.model';
import { API_BASE } from '../../../core/config';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-client-orders',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule],
  template: `
    <div class="orders-page animate-in">
      <div class="page-header" style="margin-bottom: 12px;">
        <div>
          <h1 class="page-title">📋 Buyurtmalarim</h1>
          <p style="color: var(--text-muted); font-size: 0.9rem;">Barcha buyurtmalar tarixi</p>
        </div>
        <button class="btn btn-outline" (click)="load()" id="refresh-orders-btn">
          🔄 Yangilash
        </button>
      </div>

      <!-- Tabs -->
      <div class="orders-tabs" style="display: flex; gap: 12px; margin-bottom: 20px; border-bottom: 1px solid var(--border); padding-bottom: 10px;">
        <button class="tab-btn" [class.active]="activeTab === 'active'" (click)="activeTab = 'active'" style="background: none; border: none; padding: 8px 16px; border-radius: 20px; font-weight: 600; cursor: pointer; color: var(--text-muted); transition: var(--transition);" [style.color]="activeTab === 'active' ? 'var(--primary)' : 'var(--text-muted)'" [style.background]="activeTab === 'active' ? 'rgba(249,115,22,0.1)' : 'transparent'">
          Aktiv buyurtmalar ({{ activeOrdersCount() }})
        </button>
        <button class="tab-btn" [class.active]="activeTab === 'history'" (click)="activeTab = 'history'" style="background: none; border: none; padding: 8px 16px; border-radius: 20px; font-weight: 600; cursor: pointer; color: var(--text-muted); transition: var(--transition);" [style.color]="activeTab === 'history' ? 'var(--primary)' : 'var(--text-muted)'" [style.background]="activeTab === 'history' ? 'rgba(249,115,22,0.1)' : 'transparent'">
          Buyurtmalar tarixi ({{ historyOrdersCount() }})
        </button>
      </div>

      @if (loading()) {
        <div class="spinner-overlay">
          <mat-spinner color="warn"></mat-spinner>
        </div>
      }

      @if (!loading()) {
        @if (filteredOrdersList.length === 0) {
          <div class="empty-state">
            <div class="icon">📋</div>
            <h3>Buyurtmalar yo'q</h3>
            <p>{{ activeTab === 'active' ? "Hozircha faol buyurtmalaringiz yo'q" : "Buyurtmalar tarixi bo'sh" }}</p>
          </div>
        } @else {
          <div class="orders-list">
            @for (order of filteredOrdersList; track order.id; let i = $index) {
              <div class="order-card animate-in" [style.animation-delay]="(i * 0.07) + 's'"
                   [id]="'order-' + order.id">
                <!-- Order Header -->
                <div class="order-header">
                  <div class="order-id">
                    <span class="order-num">#{{ order.id }}</span>
                    <span class="order-date">{{ order.createdAt | date:'dd.MM.yyyy HH:mm' }}</span>
                  </div>
                  <span class="badge" [class]="'badge-' + order.status.toLowerCase()">
                    {{ statusLabel(order.status) }}
                  </span>
                </div>

                <!-- Order Items -->
                <div class="order-items">
                  @for (item of order.items; track item.id) {
                    <div class="order-item">
                      <img [src]="item.food?.imageUrl" [alt]="item.food?.name"
                           class="item-img" (error)="onImgError($event)">
                      <span class="item-name">{{ item.food?.name }}</span>
                      <span class="item-qty">x{{ item.quantity }}</span>
                      <span class="item-price">{{ (item.price * item.quantity) | number:'1.0-0' }} so'm</span>
                    </div>
                  }
                </div>

                <!-- Order Footer -->
                <div class="order-footer">
                  <div class="order-meta">
                    @if (order.deliveryAddress) {
                      <span class="meta-item">📍 {{ order.deliveryAddress }}</span>
                    }
                    @if (order.courier) {
                      <span class="meta-item">🏍️ Kuryer: {{ order.courier.name }}</span>
                    }
                    <span class="meta-item">
                      To'lov turi: 
                      <strong>{{ order.paymentMethod === 'CARD' ? '💳 Karta orqali' : '💵 Naqd pul' }}</strong>
                    </span>
                    <span class="meta-item">
                      Yetkazish turi: 
                      <strong>{{ (order.deliveryProvider === 'YANDEX' || order.yandexDelivery) ? '🚕 Yandex Delivery' : '🏍️ Ichki kuryer' }}</strong>
                    </span>
                  </div>
                  <div class="order-total" style="font-size: 0.85rem;">
                    @if (order.deliveryFee || order.totalEarning) {
                      <span>Taomlar: {{ order.totalPrice | number:'1.0-0' }} so'm | Yetkazish: {{ (order.totalEarning || order.deliveryFee || 0) | number:'1.0-0' }} so'm ({{ (order.deliveryDistanceKm || order.distance || 0) | number:'1.1-2' }} km) | </span>
                    }
                    Jami: <strong>{{ (order.totalPrice + (order.totalEarning || order.deliveryFee || 0)) | number:'1.0-0' }} so'm</strong>
                  </div>
                </div>

                <!-- Bekor qilish sababi -->
                @if (order.status === 'CANCELED' && order.cancelReason) {
                  <div class="cancel-reason-banner">
                    <span class="cancel-icon">⚠️</span>
                    <div class="cancel-content">
                      <div class="cancel-title">Admin xabari:</div>
                      <div class="cancel-text">{{ order.cancelReason }}</div>
                    </div>
                  </div>
                }

                <!-- Yandex yetkazib berish xabari -->
                @if ((order.yandexDelivery || order.deliveryProvider === 'YANDEX') && order.status !== 'CANCELED' && order.status !== 'DELIVERED') {
                  <div class="yandex-delivery-banner animate-in">
                    <span class="yandex-icon">✅</span>
                    <div class="yandex-content">
                      <div class="yandex-title">Yandex Delivery</div>
                      <div class="yandex-text">Hozirda ichki kuryerlar mavjud emas. Buyurtmangiz Yandex Delivery orqali yetkazib beriladi.</div>
                    </div>
                  </div>
                }

                <!-- REAL-TIME TRACKING SECTION -->
                @if (order.status !== 'DELIVERED' && order.status !== 'CANCELED') {
                  <div class="tracking-section">
                    <div class="tracking-stats">
                      <div class="stat-grid">
                        <div class="stat-box">
                          <span class="stat-lbl">Qabul qilindi</span>
                          <span class="stat-val">{{ order.courierAcceptedAt ? (order.courierAcceptedAt | date:'HH:mm') : '-' }}</span>
                        </div>
                        <div class="stat-box">
                          <span class="stat-lbl">Restoranga keldi</span>
                          <span class="stat-val">{{ order.courierArrivedAtRestaurantAt ? (order.courierArrivedAtRestaurantAt | date:'HH:mm') : '-' }}</span>
                        </div>
                        <div class="stat-box">
                          <span class="stat-lbl">Restorangacha masofa</span>
                          <span class="stat-val">{{ order.distanceToRestaurant ? (order.distanceToRestaurant | number:'1.1-2') + ' km' : '0 km' }}</span>
                        </div>
                        <div class="stat-box">
                          <span class="stat-lbl">Kutilmoqda (ETA)</span>
                          <span class="stat-val">{{ order.etaToRestaurant ? (order.etaToRestaurant | date:'HH:mm') : '-' }}</span>
                        </div>
                      </div>
                      @if (order.gpsSignalLost) {
                        <div class="gps-lost-banner animate-in">
                          ⚠️ GPS signali yo'qoldi! Oxirgi joylashuv ko'rsatilmoqda.
                        </div>
                      }
                    </div>
                    <div [id]="'tracking-map-' + order.id" class="mini-tracking-map"></div>
                  </div>
                }

                <!-- Progress bar -->
                <div class="progress-bar">
                  <div class="progress-fill" [style.width]="progressWidth(order.status)"></div>
                </div>
              </div>
            }
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .orders-page { max-width: 800px; margin: 0 auto; }

    .orders-list { display: flex; flex-direction: column; gap: 16px; }

    .order-card {
      background: var(--bg-card);
      border-radius: var(--radius-lg);
      border: 1px solid var(--border);
      overflow: hidden;
      transition: var(--transition);
    }
    .order-card:hover { border-color: rgba(249,115,22,0.3); }

    .order-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 20px;
      border-bottom: 1px solid var(--border);
    }

    .order-id { display: flex; align-items: center; gap: 12px; }
    .order-num { font-size: 1.1rem; font-weight: 700; color: var(--text); }
    .order-date { font-size: 0.8rem; color: var(--text-muted); }

    .order-items {
      padding: 12px 20px;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .order-item {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .item-img {
      width: 40px;
      height: 40px;
      border-radius: 8px;
      object-fit: cover;
      flex-shrink: 0;
    }

    .item-name { flex: 1; font-size: 0.875rem; font-weight: 500; }
    .item-qty { font-size: 0.8rem; color: var(--text-muted); min-width: 30px; text-align: center; }
    .item-price { font-size: 0.875rem; font-weight: 600; color: var(--primary); min-width: 90px; text-align: right; }

    .order-footer {
      padding: 12px 20px;
      border-top: 1px solid var(--border);
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      flex-wrap: wrap;
    }

    .order-meta {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .meta-item { font-size: 0.8rem; color: var(--text-muted); }

    .order-total {
      font-size: 0.9rem;
      color: var(--text-muted);
    }
    .order-total strong { color: var(--primary); font-size: 1rem; }

    .progress-bar {
      height: 3px;
      background: var(--border);
    }
    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, var(--primary), var(--primary-dark));
      transition: width 0.5s ease;
    }

    .cancel-reason-banner {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      margin: 0 20px 12px;
      padding: 12px 16px;
      background: rgba(239,68,68,0.08);
      border: 1px solid rgba(239,68,68,0.25);
      border-radius: 10px;
    }
    .cancel-icon { font-size: 1.2rem; flex-shrink: 0; margin-top: 1px; }
    .cancel-content { display: flex; flex-direction: column; gap: 3px; }
    .cancel-title { font-size: 0.75rem; font-weight: 600; color: #ef4444; text-transform: uppercase; letter-spacing: 0.5px; }
    .cancel-text { font-size: 0.875rem; color: #fca5a5; line-height: 1.4; }

    .yandex-delivery-banner {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      margin: 0 20px 12px;
      padding: 12px 16px;
      background: rgba(245,158,11,0.08);
      border: 1px solid rgba(245,158,11,0.25);
      border-radius: 10px;
    }
    .yandex-icon { font-size: 1.2rem; flex-shrink: 0; margin-top: 1px; }
    .yandex-content { display: flex; flex-direction: column; gap: 3px; }
    .yandex-title { font-size: 0.75rem; font-weight: 600; color: #f59e0b; text-transform: uppercase; letter-spacing: 0.5px; }
    .yandex-text { font-size: 0.875rem; color: #fde68a; line-height: 1.4; }

    .tracking-section {
      margin: 12px 20px;
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid var(--border);
      border-radius: 10px;
      overflow: hidden;
    }
    .tracking-stats {
      padding: 12px;
      border-bottom: 1px solid var(--border);
    }
    .stat-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 8px;
    }
    .stat-box {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
    }
    .stat-lbl {
      font-size: 0.65rem;
      color: var(--text-muted);
      text-transform: uppercase;
      font-weight: 600;
      letter-spacing: 0.5px;
    }
    .stat-val {
      font-size: 0.8rem;
      font-weight: 700;
      color: var(--text);
      margin-top: 2px;
    }
    .gps-lost-banner {
      margin-top: 8px;
      background: rgba(239, 68, 68, 0.12);
      color: #f87171;
      padding: 6px 12px;
      border-radius: 6px;
      font-size: 0.75rem;
      text-align: center;
      font-weight: 600;
    }
    .mini-tracking-map {
      width: 100%;
      height: 220px;
      background: #111827;
    }
    @media (max-width: 576px) {
      .stat-grid {
        grid-template-columns: repeat(2, 1fr);
        gap: 12px;
      }
    }
  `]
})
export class ClientOrdersComponent implements OnInit, OnDestroy {
  orders = signal<Order[]>([]);
  loading = signal(true);
  activeTab: 'active' | 'history' = 'active';

  activeOrdersCount(): number {
    return this.orders().filter(o => o.status !== 'DELIVERED' && o.status !== 'CANCELED').length;
  }

  historyOrdersCount(): number {
    return this.orders().filter(o => o.status === 'DELIVERED' || o.status === 'CANCELED').length;
  }

  get filteredOrdersList(): Order[] {
    if (this.activeTab === 'active') {
      return this.orders().filter(o => o.status !== 'DELIVERED' && o.status !== 'CANCELED');
    } else {
      return this.orders().filter(o => o.status === 'DELIVERED' || o.status === 'CANCELED');
    }
  }
  private pollInterval: any;

  // Tracking properties
  private orderMaps = new Map<number, any>();
  private courierPlacemarks = new Map<number, any>();
  private trackingSockets = new Map<number, WebSocket>();
  
  private auth = inject(AuthService);
  private ngZone = inject(NgZone);

  constructor(private orderService: OrderService) {}

  ngOnInit(): void {
    this.load(true);
    // Poll every 4 seconds to show real-time changes to the client
    this.pollInterval = setInterval(() => this.load(false), 4000);
  }

  ngOnDestroy(): void {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
    }
    // Clean up all maps and WebSockets
    this.trackingSockets.forEach(ws => ws.close());
    this.trackingSockets.clear();
    this.orderMaps.clear();
    this.courierPlacemarks.clear();
  }

  load(showLoader = true): void {
    if (showLoader) this.loading.set(true);
    this.orderService.getMyOrders().subscribe({
      next: (orders) => {
        this.orders.set(orders);
        if (showLoader) this.loading.set(false);
        // Process maps for active orders
        setTimeout(() => this.initializeActiveOrderMaps(), 100);
      },
      error: () => {
        if (showLoader) this.loading.set(false);
      }
    });
  }

  initializeActiveOrderMaps(): void {
    const ymaps = (window as any).ymaps;
    if (!ymaps) return;

    const activeOrders = this.orders().filter(o => o.status !== 'DELIVERED' && o.status !== 'CANCELED');
    
    activeOrders.forEach(order => {
      const containerId = 'tracking-map-' + order.id;
      const el = document.getElementById(containerId);
      if (!el) return;

      // If map is already initialized, just update coords and check WS connection
      if (this.orderMaps.has(order.id)) {
        const map = this.orderMaps.get(order.id);
        this.updateCourierMarker(order, map);
        if (order.courier && !this.trackingSockets.has(order.id)) {
          this.connectToOrderTrackingWs(order.id);
        }
        return;
      }

      // Initialize new map
      ymaps.ready(() => {
        // Double check container still exists
        if (!document.getElementById(containerId)) return;

        const restLat = order.restaurantLatitude || (order.restaurant?.latitude) || 38.866127;
        const restLng = order.restaurantLongitude || (order.restaurant?.longitude) || 65.816309;
        const restCoords = [restLat, restLng];

        const clientLat = order.latitude || 38.866127;
        const clientLng = order.longitude || 65.816309;
        const clientCoords = [clientLat, clientLng];

        const map = new ymaps.Map(containerId, {
          center: restCoords,
          zoom: 13,
          controls: ['zoomControl']
        });

        this.orderMaps.set(order.id, map);

        // Add Restaurant marker
        const restPlacemark = new ymaps.Placemark(restCoords, {
          balloonContentHeader: `🏪 ${order.restaurant?.name || 'Restoran'}`,
          hintContent: 'Tayyorlash punkti'
        }, {
          preset: 'islands#redFoodIcon',
          iconColor: '#ff4444'
        });
        map.geoObjects.add(restPlacemark);

        // Add Client marker
        const clientPlacemark = new ymaps.Placemark(clientCoords, {
          balloonContentHeader: '📍 Mening manzilim',
          hintContent: 'Yetkazish manzili'
        }, {
          preset: 'islands#violetDotIconWithCaption',
          iconColor: '#8b5cf6'
        });
        map.geoObjects.add(clientPlacemark);

        // Fit map bounds
        map.setBounds([restCoords, clientCoords], { checkZoomRange: true, zoomMargin: 40 });

        // Update courier location if already available
        this.updateCourierMarker(order, map);

        // Establish WebSocket tracking if courier is assigned
        if (order.courier) {
          this.connectToOrderTrackingWs(order.id);
        }
      });
    });

    // Close sockets for orders that are no longer active
    this.trackingSockets.forEach((ws, orderId) => {
      const orderStillActive = activeOrders.some(o => o.id === orderId);
      if (!orderStillActive) {
        ws.close();
        this.trackingSockets.delete(orderId);
        this.orderMaps.delete(orderId);
        this.courierPlacemarks.delete(orderId);
      }
    });
  }

  updateCourierMarker(order: Order, map: any): void {
    if (!order.courierLatitude || !order.courierLongitude) return;

    const ymaps = (window as any).ymaps;
    const newCoords = [order.courierLatitude, order.courierLongitude];

    let courierPlacemark = this.courierPlacemarks.get(order.id);

    if (!courierPlacemark) {
      courierPlacemark = new ymaps.Placemark(newCoords, {
        balloonContentHeader: `🏍️ Kuryer: ${order.courier?.name || 'Yo\'lda'}`,
        hintContent: 'Kuryerning joriy joylashuvi'
      }, {
        preset: 'islands#blueSportIcon',
        iconColor: '#3b82f6'
      });
      map.geoObjects.add(courierPlacemark);
      this.courierPlacemarks.set(order.id, courierPlacemark);

      // Adjust bounds to fit courier too
      const restLat = order.restaurantLatitude || (order.restaurant?.latitude) || 38.866127;
      const restLng = order.restaurantLongitude || (order.restaurant?.longitude) || 65.816309;
      const clientLat = order.latitude || 38.866127;
      const clientLng = order.longitude || 65.816309;
      map.setBounds([
        [restLat, restLng],
        [clientLat, clientLng],
        newCoords
      ], { checkZoomRange: true, zoomMargin: 40 });
    } else {
      const oldCoords = courierPlacemark.geometry.getCoordinates();
      if (oldCoords[0] !== newCoords[0] || oldCoords[1] !== newCoords[1]) {
        this.animateMarker(courierPlacemark, oldCoords, newCoords);
      }
    }
  }

  connectToOrderTrackingWs(orderId: number): void {
    const token = this.auth.getToken();
    if (!token || this.trackingSockets.has(orderId)) return;

    const wsProtocol = API_BASE.startsWith('https') ? 'wss' : 'ws';
    const cleanBase = API_BASE.replace(/^https?:\/\//, '');
    const wsUrl = `${wsProtocol}://${cleanBase}/ws/gps?token=${token}&orderId=${orderId}`;

    try {
      const ws = new WebSocket(wsUrl);
      this.trackingSockets.set(orderId, ws);

      ws.onmessage = (event) => {
        this.ngZone.run(() => {
          try {
            const data = JSON.parse(event.data);
            if (data.error) {
              console.warn('WS tracking error response:', data.error);
              return;
            }

            // Update stats and coords on matching order object
            this.orders.update(orders => {
              return orders.map(o => {
                if (o.id === orderId) {
                  return {
                    ...o,
                    courierLatitude: data.courierLatitude,
                    courierLongitude: data.courierLongitude,
                    courierStartLatitude: data.courierStartLatitude,
                    courierStartLongitude: data.courierStartLongitude,
                    distanceToRestaurant: data.distanceToRestaurant,
                    etaToRestaurant: data.etaToRestaurant || undefined,
                    courierAcceptedAt: data.courierAcceptedAt || undefined,
                    courierArrivedAtRestaurantAt: data.courierArrivedAtRestaurantAt || undefined,
                    gpsSignalLost: data.gpsSignalLost,
                    status: data.status
                  };
                }
                return o;
              });
            });

            // Trigger visual marker update on map
            const map = this.orderMaps.get(orderId);
            if (map) {
              const updatedOrder = this.orders().find(o => o.id === orderId);
              if (updatedOrder) {
                this.updateCourierMarker(updatedOrder, map);
              }
            }
          } catch (err) {
            console.error('Error parsing WS tracking message:', err);
          }
        });
      };

      ws.onerror = (err) => {
        console.error(`WebSocket error for order #${orderId}:`, err);
      };

      ws.onclose = () => {
        console.log(`WebSocket closed for order #${orderId}`);
        this.trackingSockets.delete(orderId);
      };
    } catch (e) {
      console.error('Failed to create tracking WebSocket connection:', e);
    }
  }

  animateMarker(placemark: any, startCoords: number[], endCoords: number[], duration = 1200): void {
    const startTime = performance.now();
    
    const update = (time: number) => {
      const elapsed = time - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Interpolate coordinates
      const lat = startCoords[0] + (endCoords[0] - startCoords[0]) * progress;
      const lng = startCoords[1] + (endCoords[1] - startCoords[1]) * progress;
      
      placemark.geometry.setCoordinates([lat, lng]);
      
      if (progress < 1) {
        requestAnimationFrame(update);
      }
    };
    
    requestAnimationFrame(update);
  }

  statusLabel(status: OrderStatus): string {
    return ORDER_STATUS_LABELS[status] ?? status;
  }

  progressWidth(status: OrderStatus): string {
    const map: Record<OrderStatus, string> = {
      PENDING:               '10%',
      PREPARING:             '30%',
      COURIER_ACCEPTED:      '50%',
      COURIER_AT_RESTAURANT: '70%',
      DELIVERING:            '85%',
      COURIER_AT_CLIENT:     '95%',
      DELIVERED:             '100%',
      CANCELED:              '0%',
      CANCELLATION_REQUESTED: '50%',
      TRANSFERRED_TO_YANDEX: '30%',
      YANDEX_COURIER_CALLED: '40%',
      READY:                 '60%',
      YANDEX_COURIER_PICKED_UP: '80%',
    };
    return map[status] ?? '0%';
  }

  onImgError(e: Event): void {
    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=80';
  }
}
