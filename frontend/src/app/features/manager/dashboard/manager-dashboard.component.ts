import { Component, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { OrderService } from '../../../core/services/order.service';
import { Order, ORDER_STATUS_LABELS } from '../../../core/models/order.model';

@Component({
  selector: 'app-manager-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, MatProgressSpinnerModule],
  template: `
    <div class="manager-dashboard animate-in">
      <div class="page-header">
        <div>
          <h1 class="page-title">📊 Restoran Boshqaruv Paneli</h1>
          <p style="color: var(--text-muted); font-size: 0.875rem;">
            Buyurtmalar oqimi, tahlillar va holatlarni real vaqtda boshqarish
          </p>
        </div>
        <button class="btn btn-outline" (click)="load(true)" id="refresh-manager-btn">
          🔄 Yangilash
        </button>
      </div>

      <!-- Stats Grid -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-number">{{ pendingOrders().length }}</div>
          <div class="stat-label">⏳ Yangi buyurtmalar</div>
        </div>
        <div class="stat-card" style="border-color: rgba(249,115,22,0.3)">
          <div class="stat-number" style="color: var(--primary)">{{ activePrepOrders().length }}</div>
          <div class="stat-label">🍳 Tayyorlanmoqda</div>
        </div>
        <div class="stat-card" style="border-color: rgba(16,185,129,0.3)">
          <div class="stat-number" style="color: #10b981">{{ completedCount() }} ta</div>
          <div class="stat-label">✅ Yakunlanganlar</div>
        </div>
        <div class="stat-card" style="border-color: rgba(59,130,246,0.3)">
          <div class="stat-number" style="color: #3b82f6">{{ totalRevenue() | number:'1.0-0' }} so'm</div>
          <div class="stat-label">💰 Umumiy aylanma</div>
        </div>
      </div>

      @if (loading()) {
        <div class="spinner-overlay">
          <mat-spinner color="warn"></mat-spinner>
        </div>
      }

      @if (!loading()) {
        <!-- Active Orders Section -->
        <div class="orders-section">
          <h2 class="section-title">📋 Buyurtmalar Ro'yxati</h2>
          
          <div class="table-wrap">
            <table class="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Mijoz</th>
                  <th>Taomlar</th>
                  <th>Jami Narx</th>
                  <th>Masofa</th>
                  <th>Kuryer</th>
                  <th>Holat</th>
                  <th>Amal</th>
                </tr>
              </thead>
              <tbody>
                @for (order of orders(); track order.id) {
                  <tr [id]="'order-row-' + order.id">
                    <td data-label="ID"><strong>#{{ order.id }}</strong></td>
                    <td data-label="Mijoz">
                      <div class="client-info">
                        <span class="name">{{ order.user.name }}</span>
                        <span class="phone">{{ order.user.phone || 'Tel kiritilmagan' }}</span>
                      </div>
                    </td>
                    <td data-label="Taomlar">
                      <div class="food-list">
                        @for (item of order.items; track item.id) {
                          <div class="food-item">{{ item.food.name }} x{{ item.quantity }}</div>
                        }
                      </div>
                    </td>
                    <td data-label="Jami Narx">
                      <div class="price-info">
                        <strong>{{ (order.totalPrice + (order.deliveryFee || 0)) | number:'1.0-0' }} so'm</strong>
                        <span class="fee">(Kuryer: {{ order.deliveryFee | number:'1.0-0' }} so'm)</span>
                      </div>
                    </td>
                    <td data-label="Masofa">{{ order.distance || 0 }} km</td>
                    <td data-label="Kuryer">
                      @if (order.courier) {
                        <span class="courier-tag">🏍️ {{ order.courier.name }}</span>
                      } @else {
                        <span class="no-courier">Tayinlanmagan</span>
                      }
                    </td>
                    <td data-label="Holat">
                      <span class="status-badge" [class]="'badge-' + order.status.toLowerCase()">
                        {{ getStatusLabel(order.status) }}
                      </span>
                    </td>
                    <td data-label="Amal">
                      @if (order.status === 'PENDING') {
                        <button 
                          class="btn btn-primary btn-sm" 
                          (click)="changeStatus(order.id, 'PREPARING')"
                          id="prep-btn-{{ order.id }}"
                          style="white-space: nowrap;">
                          🍳 Tayyorlash
                        </button>
                      } @else if (order.status === 'PREPARING') {
                        <span class="status-info">Kuryer kutilmoqda...</span>
                      } @else if (order.status === 'COURIER_ACCEPTED') {
                        <span class="status-info">Kuryer yo'lda...</span>
                      } @else if (order.status === 'DELIVERED') {
                        <span class="status-done">✅ Topshirildi</span>
                      } @else {
                        <span class="status-info">Faol yetkazilmoqda</span>
                      }
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          @if (orders().length === 0) {
            <div class="empty-state">
              <div class="icon">📋</div>
              <h3>Hozircha buyurtmalar mavjud emas</h3>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .manager-dashboard { max-width: 1100px; margin: 0 auto; }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 20px;
      margin-bottom: 28px;
    }

    .orders-section {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      padding: 24px;
    }

    .section-title {
      font-size: 1.25rem;
      font-weight: 700;
      margin-bottom: 20px;
      color: var(--text);
    }

    .client-info { display: flex; flex-direction: column; }
    .client-info .name { font-weight: 600; color: var(--text); }
    .client-info .phone { font-size: 0.75rem; color: var(--text-muted); margin-top: 2px; }

    .food-list { display: flex; flex-direction: column; gap: 2px; }
    .food-item { font-size: 0.82rem; color: var(--text); }

    .price-info { display: flex; flex-direction: column; }
    .price-info .fee { font-size: 0.72rem; color: var(--text-muted); margin-top: 2px; }

    .courier-tag {
      background: rgba(249,115,22,0.1);
      color: var(--primary);
      padding: 4px 8px;
      border-radius: 12px;
      font-size: 0.78rem;
      font-weight: 600;
      border: 1px solid rgba(249,115,22,0.2);
    }

    .no-courier { font-size: 0.78rem; color: var(--text-muted); font-style: italic; }

    .status-badge {
      font-size: 0.75rem;
      font-weight: 600;
      padding: 4px 10px;
      border-radius: 20px;
      display: inline-block;
      text-transform: capitalize;
    }
    .badge-pending { background: rgba(239,68,68,0.1); color: #ef4444; border: 1px solid rgba(239,68,68,0.2); }
    .badge-preparing { background: rgba(245,158,11,0.1); color: #f59e0b; border: 1px solid rgba(245,158,11,0.2); }
    .badge-courier_accepted { background: rgba(59,130,246,0.1); color: #3b82f6; border: 1px solid rgba(59,130,246,0.2); }
    .badge-courier_at_restaurant { background: rgba(139,92,246,0.1); color: #8b5cf6; border: 1px solid rgba(139,92,246,0.2); }
    .badge-delivering { background: rgba(59,130,246,0.15); color: #3b82f6; border: 1px solid rgba(59,130,246,0.3); }
    .badge-courier_at_client { background: rgba(236,72,153,0.1); color: #ec4899; border: 1px solid rgba(236,72,153,0.2); }
    .badge-delivered { background: rgba(16,185,129,0.1); color: #10b981; border: 1px solid rgba(16,185,129,0.2); }
    .badge-canceled { background: rgba(100,116,139,0.1); color: #64748b; border: 1px solid rgba(100,116,139,0.2); }

    .status-info { font-size: 0.8rem; color: var(--text-muted); font-style: italic; }
    .status-done { font-size: 0.82rem; font-weight: 600; color: #10b981; }

    .btn-sm { padding: 6px 12px; font-size: 0.78rem; border-radius: 6px; }

    @media (max-width: 768px) {
      .orders-section { padding: 16px; }
      .page-header { flex-direction: column; align-items: stretch; gap: 12px; }
      .page-header button { width: 100%; }
      
      /* Turn table into card rows */
      .data-table, .data-table thead, .data-table tbody, .data-table th, .data-table td, .data-table tr {
        display: block;
      }
      .data-table thead {
        display: none;
      }
      .data-table tr {
        border: 1px solid var(--border);
        border-radius: var(--radius);
        padding: 12px;
        margin-bottom: 12px;
        background: var(--bg-card2);
      }
      .data-table td {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px 0;
        border-bottom: 1px dashed var(--border);
        text-align: right;
      }
      .data-table td:last-child {
        border-bottom: none;
        padding-top: 12px;
        justify-content: flex-end;
      }
      .data-table td::before {
        content: attr(data-label);
        font-weight: 600;
        color: var(--text-muted);
        font-size: 0.75rem;
        text-transform: uppercase;
        text-align: left;
        margin-right: 12px;
      }
    }
  `]
})
export class ManagerDashboardComponent implements OnInit, OnDestroy {
  orders = signal<Order[]>([]);
  loading = signal(true);
  private pollInterval: any;

  // Computed metrics for manager
  pendingOrders = computed(() => this.orders().filter(o => o.status === 'PENDING'));
  activePrepOrders = computed(() => this.orders().filter(o => o.status === 'PREPARING'));
  completedCount = computed(() => this.orders().filter(o => o.status === 'DELIVERED').length);
  totalRevenue = computed(() =>
    this.orders()
      .filter(o => o.status === 'DELIVERED')
      .reduce((sum, o) => sum + o.totalPrice, 0)
  );

  constructor(private orderService: OrderService) {}

  ngOnInit(): void {
    this.load(true);
    // Poll active orders every 4 seconds
    this.pollInterval = setInterval(() => this.load(false), 4000);
  }

  ngOnDestroy(): void {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
    }
  }

  load(showLoader = true): void {
    if (showLoader) this.loading.set(true);
    this.orderService.getManagerOrders().subscribe({
      next: (data) => {
        this.orders.set(data);
        if (showLoader) this.loading.set(false);
      },
      error: () => {
        if (showLoader) this.loading.set(false);
      }
    });
  }

  changeStatus(orderId: number, status: string): void {
    this.orderService.updateManagerOrderStatus(orderId, status).subscribe({
      next: () => {
        this.load(false);
      },
      error: (err) => {
        alert(err.error?.message || "Buyurtma holatini yangilab bo'lmadi!");
      }
    });
  }

  getStatusLabel(status: string): string {
    return (ORDER_STATUS_LABELS as any)[status] || status;
  }
}
