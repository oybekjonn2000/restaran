import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { OrderService } from '../../../core/services/order.service';
import { Order, ORDER_STATUS_LABELS, ORDER_STATUS_COLORS, OrderStatus } from '../../../core/models/order.model';

@Component({
  selector: 'app-client-orders',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule],
  template: `
    <div class="orders-page animate-in">
      <div class="page-header">
        <div>
          <h1 class="page-title">📋 Buyurtmalarim</h1>
          <p style="color: var(--text-muted); font-size: 0.9rem;">Barcha buyurtmalar tarixi</p>
        </div>
        <button class="btn btn-outline" (click)="load()" id="refresh-orders-btn">
          🔄 Yangilash
        </button>
      </div>

      @if (loading()) {
        <div class="spinner-overlay">
          <mat-spinner color="warn"></mat-spinner>
        </div>
      }

      @if (!loading()) {
        @if (orders().length === 0) {
          <div class="empty-state">
            <div class="icon">📋</div>
            <h3>Buyurtmalar yo'q</h3>
            <p>Hali hech qanday buyurtma bermagansiz</p>
          </div>
        } @else {
          <div class="orders-list">
            @for (order of orders(); track order.id; let i = $index) {
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
                  </div>
                  <div class="order-total" style="font-size: 0.85rem;">
                    @if (order.deliveryFee) {
                      <span>Taomlar: {{ order.totalPrice | number:'1.0-0' }} so'm | Yetkazish: {{ order.deliveryFee | number:'1.0-0' }} so'm ({{ order.distance }} km) | </span>
                    }
                    Jami: <strong>{{ (order.totalPrice + (order.deliveryFee || 0)) | number:'1.0-0' }} so'm</strong>
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
                @if (order.yandexDelivery && order.status !== 'CANCELED' && order.status !== 'DELIVERED') {
                  <div class="yandex-delivery-banner animate-in">
                    <span class="yandex-icon">🚕</span>
                    <div class="yandex-content">
                      <div class="yandex-title">Yandex Yetkazib berish</div>
                      <div class="yandex-text">Yetkazish yandex orqali bajariladi va summasini haydovchi sizga aytadi !</div>
                    </div>
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
  `]
})
export class ClientOrdersComponent implements OnInit, OnDestroy {
  orders = signal<Order[]>([]);
  loading = signal(true);
  private pollInterval: any;

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
  }

  load(showLoader = true): void {
    if (showLoader) this.loading.set(true);
    this.orderService.getMyOrders().subscribe({
      next: (orders) => {
        this.orders.set(orders);
        if (showLoader) this.loading.set(false);
      },
      error: () => {
        if (showLoader) this.loading.set(false);
      }
    });
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
    };
    return map[status] ?? '0%';
  }

  onImgError(e: Event): void {
    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=80';
  }
}
