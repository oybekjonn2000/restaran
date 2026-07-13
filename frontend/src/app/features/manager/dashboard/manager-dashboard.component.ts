import { Component, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { OrderService } from '../../../core/services/order.service';
import { Order, ORDER_STATUS_LABELS, OrderStatus } from '../../../core/models/order.model';

const ALL_STATUSES: OrderStatus[] = ['PENDING','PREPARING','COURIER_ACCEPTED','COURIER_AT_RESTAURANT','DELIVERING','COURIER_AT_CLIENT','DELIVERED','CANCELED'];

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

      <!-- Toast notification -->
      @if (toast()) {
        <div class="toast-bar" [class.toast-success]="toast()!.type === 'success'" [class.toast-error]="toast()!.type === 'error'">
          {{ toast()!.message }}
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
                  <tr [id]="'order-row-' + order.id" [class.row-updating]="updatingId() === order.id">
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
                      <div class="action-btns">

                        <!-- DELIVERED / CANCELED stages -->
                        @if (order.status === 'DELIVERED') {
                          <span class="status-done">✅ Topshirildi</span>
                        } @else if (order.status === 'CANCELED') {
                          <span class="status-canceled">🚫 Bekor qilindi</span>
                        }

                        <!-- PENDING → PREPARING -->
                        @else if (order.status === 'PENDING') {
                          <button
                            class="act-btn act-prepare"
                            (click)="changeStatus(order.id, 'PREPARING')"
                            [disabled]="updatingId() === order.id"
                            [id]="'prep-btn-' + order.id">
                            🍳 Tayyorlash
                          </button>
                          <button
                            class="act-btn act-cancel"
                            (click)="confirmCancel(order)"
                            [disabled]="updatingId() === order.id"
                            [id]="'cancel-btn-' + order.id">
                            ✕ Bekor
                          </button>
                        }

                        <!-- PREPARING -->
                        @else if (order.status === 'PREPARING') {
                          @if (!order.isReady) {
                            <button
                              class="act-btn act-ready"
                              (click)="markReady(order.id)"
                              [disabled]="updatingId() === order.id"
                              [id]="'ready-btn-' + order.id">
                              ✅ Tayyor
                            </button>
                          } @else {
                            <span class="status-info" style="color: #10b981; font-weight: 600;">🍳 Taom tayyor (Kuryer kutilmoqda)</span>
                          }
                          <button
                            class="act-btn act-cancel"
                            (click)="confirmCancel(order)"
                            [disabled]="updatingId() === order.id">
                            ✕ Bekor
                          </button>
                        }

                        <!-- COURIER_ACCEPTED / COURIER_AT_RESTAURANT -->
                        @else if (order.status === 'COURIER_ACCEPTED' || order.status === 'COURIER_AT_RESTAURANT') {
                          @if (!order.isReady) {
                            <button
                              class="act-btn act-ready"
                              (click)="markReady(order.id)"
                              [disabled]="updatingId() === order.id"
                              [id]="'ready-btn-' + order.id">
                              ✅ Tayyor
                            </button>
                          } @else {
                            @if (order.courier && order.courierActiveOnShift) {
                              <!-- Faol kuryer bor: u o'zi boshqaradi -->
                              <span class="status-info" style="color: #10b981; font-weight: 600;">✅ Taom tayyor (Kuryerda)</span>
                            } @else {
                              <!-- Kuryer chiqmagan yoki nofaol: manager "Kuryer yo'lda" tugmasini bosadi -->
                              <button
                                class="act-btn act-courier"
                                (click)="changeStatus(order.id, 'DELIVERING')"
                                [disabled]="updatingId() === order.id"
                                [id]="'courier-way-btn-' + order.id">
                                🏍️ Kuryer yo'lda
                              </button>
                            }
                          }
                          <button
                            class="act-btn act-cancel"
                            (click)="confirmCancel(order)"
                            [disabled]="updatingId() === order.id">
                            ✕ Bekor
                          </button>
                        }

                        <!-- DELIVERING / COURIER_AT_CLIENT → DELIVERED -->
                        @else if (order.status === 'DELIVERING' || order.status === 'COURIER_AT_CLIENT') {
                          @if (order.courier && order.courierActiveOnShift) {
                            <!-- Faol kuryer bor: u o'zi boshqaradi -->
                            <span class="status-info">Yetkazilmoqda…</span>
                          } @else {
                            @if (order.yandexDelivery) {
                              <span class="status-info" style="color: #ea580c; font-weight: 600; display: block; margin-bottom: 6px;">🚕 Yandex orqali yuborildi</span>
                            }
                            <!-- Kuryer chiqmagan yoki nofaol: manager "Yetkazildi" tugmasini bosadi -->
                            <button
                              class="act-btn act-ready"
                              (click)="changeStatus(order.id, 'DELIVERED')"
                              [disabled]="updatingId() === order.id"
                              [id]="'deliver-btn-' + order.id">
                              ✅ Yetkazildi
                            </button>
                          }
                          <button
                            class="act-btn act-cancel"
                            (click)="confirmCancel(order)"
                            [disabled]="updatingId() === order.id">
                            ✕ Bekor
                          </button>
                        }

                      </div>
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

      <!-- Cancel Confirm Modal -->
      @if (cancelTarget()) {
        <div class="modal-overlay" (click)="cancelTarget.set(null)">
          <div class="modal-card" (click)="$event.stopPropagation()">
            <div class="modal-icon">⚠️</div>
            <h3 class="modal-title">Buyurtmani bekor qilish</h3>
            <p class="modal-desc">#{{ cancelTarget()!.id }} buyurtmani bekor qilmoqchimisiz?</p>
            <div class="modal-reason">
              <label>Sabab</label>
              <input
                class="reason-input"
                [(ngModel)]="cancelReason"
                placeholder="Masalan: omborda mahsulot yo'q…"
                id="cancel-reason-input" />
            </div>
            <div class="modal-actions">
              <button class="act-btn act-outline" (click)="cancelTarget.set(null)">Orqaga</button>
              <button class="act-btn act-cancel" (click)="doCancel()" [disabled]="!cancelReason.trim() || updatingId() !== null">
                Bekor qilish
              </button>
            </div>
          </div>
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
      white-space: nowrap;
    }
    .badge-pending { background: rgba(239,68,68,0.1); color: #ef4444; border: 1px solid rgba(239,68,68,0.2); }
    .badge-preparing { background: rgba(245,158,11,0.1); color: #f59e0b; border: 1px solid rgba(245,158,11,0.2); }
    .badge-courier_accepted { background: rgba(59,130,246,0.1); color: #3b82f6; border: 1px solid rgba(59,130,246,0.2); }
    .badge-courier_at_restaurant { background: rgba(139,92,246,0.1); color: #8b5cf6; border: 1px solid rgba(139,92,246,0.2); }
    .badge-delivering { background: rgba(59,130,246,0.15); color: #3b82f6; border: 1px solid rgba(59,130,246,0.3); }
    .badge-courier_at_client { background: rgba(236,72,153,0.1); color: #ec4899; border: 1px solid rgba(236,72,153,0.2); }
    .badge-delivered { background: rgba(16,185,129,0.1); color: #10b981; border: 1px solid rgba(16,185,129,0.2); }
    .badge-canceled { background: rgba(100,116,139,0.1); color: #64748b; border: 1px solid rgba(100,116,139,0.2); }

    .status-select {
      background: var(--bg-card2);
      border: 1px solid var(--border);
      border-radius: 8px;
      color: var(--text);
      padding: 6px 10px;
      font-size: 0.78rem;
      cursor: pointer;
      outline: none;
      max-width: 180px;
      font-family: inherit;
    }
    .status-select:focus { border-color: var(--primary); }
    .status-select:disabled { opacity: 0.5; cursor: not-allowed; }

    .no-shift-badge {
      font-size: 0.72rem;
      font-weight: 600;
      color: #ef4444;
      background: rgba(239,68,68,0.1);
      border: 1px solid rgba(239,68,68,0.25);
      border-radius: 8px;
      padding: 2px 8px;
      display: inline-block;
    }

    .status-info { font-size: 0.8rem; color: var(--text-muted); font-style: italic; }
    .status-done { font-size: 0.82rem; font-weight: 600; color: #10b981; }
    .status-canceled { font-size: 0.82rem; font-weight: 600; color: #64748b; }

    /* Action buttons */
    .action-btns { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }

    .act-btn {
      padding: 5px 12px;
      font-size: 0.78rem;
      font-weight: 600;
      border-radius: 8px;
      border: none;
      cursor: pointer;
      transition: all 0.18s ease;
      white-space: nowrap;
    }
    .act-btn:disabled { opacity: 0.5; cursor: not-allowed; }

    .act-prepare {
      background: linear-gradient(135deg, #f59e0b, #d97706);
      color: #fff;
    }
    .act-prepare:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 3px 10px rgba(245,158,11,0.4); }

    .act-ready {
      background: linear-gradient(135deg, #10b981, #059669);
      color: #fff;
    }
    .act-ready:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 3px 10px rgba(16,185,129,0.4); }

    .act-courier {
      background: linear-gradient(135deg, #3b82f6, #2563eb);
      color: #fff;
    }
    .act-courier:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 3px 10px rgba(59,130,246,0.4); }

    .act-cancel {
      background: rgba(239,68,68,0.12);
      color: #ef4444;
      border: 1px solid rgba(239,68,68,0.3);
    }
    .act-cancel:hover:not(:disabled) { background: rgba(239,68,68,0.22); }

    .act-outline {
      background: transparent;
      color: var(--text-muted);
      border: 1px solid var(--border);
    }
    .act-outline:hover { background: var(--bg-card2); }

    /* Row highlight when updating */
    .row-updating { opacity: 0.6; pointer-events: none; }

    /* Toast */
    .toast-bar {
      position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%);
      padding: 12px 28px; border-radius: 12px; font-weight: 600; font-size: 0.9rem;
      z-index: 9999; animation: slideUp 0.3s ease;
      box-shadow: 0 8px 24px rgba(0,0,0,0.3);
    }
    .toast-success { background: #10b981; color: #fff; }
    .toast-error   { background: #ef4444; color: #fff; }
    @keyframes slideUp { from { transform: translateX(-50%) translateY(20px); opacity: 0; } to { transform: translateX(-50%) translateY(0); opacity: 1; } }

    /* Cancel Modal */
    .modal-overlay {
      position: fixed; inset: 0; background: rgba(0,0,0,0.6);
      display: flex; align-items: center; justify-content: center; z-index: 1000;
      backdrop-filter: blur(4px);
    }
    .modal-card {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: 20px;
      padding: 32px 28px;
      max-width: 380px; width: 90%;
      text-align: center;
      animation: popIn 0.25s ease;
    }
    @keyframes popIn { from { transform: scale(0.88); opacity: 0; } to { transform: scale(1); opacity: 1; } }
    .modal-icon { font-size: 2.5rem; margin-bottom: 12px; }
    .modal-title { font-size: 1.2rem; font-weight: 700; margin-bottom: 8px; color: var(--text); }
    .modal-desc { color: var(--text-muted); font-size: 0.88rem; margin-bottom: 18px; }
    .modal-reason { text-align: left; margin-bottom: 20px; }
    .modal-reason label { font-size: 0.8rem; color: var(--text-muted); font-weight: 600; display: block; margin-bottom: 6px; }
    .reason-input {
      width: 100%; padding: 10px 14px; border-radius: 10px;
      border: 1px solid var(--border); background: var(--bg-card2);
      color: var(--text); font-size: 0.88rem; box-sizing: border-box;
    }
    .reason-input:focus { outline: none; border-color: #ef4444; }
    .modal-actions { display: flex; gap: 10px; justify-content: center; }

    @media (max-width: 768px) {
      .orders-section { padding: 16px; }
      .page-header { flex-direction: column; align-items: stretch; gap: 12px; }
      .page-header button { width: 100%; }
      .data-table, .data-table thead, .data-table tbody, .data-table th, .data-table td, .data-table tr { display: block; }
      .data-table thead { display: none; }
      .data-table tr {
        border: 1px solid var(--border); border-radius: var(--radius);
        padding: 12px; margin-bottom: 12px; background: var(--bg-card2);
      }
      .data-table td {
        display: flex; justify-content: space-between; align-items: center;
        padding: 8px 0; border-bottom: 1px dashed var(--border); text-align: right;
      }
      .data-table td:last-child { border-bottom: none; padding-top: 12px; justify-content: flex-end; }
      .data-table td::before {
        content: attr(data-label); font-weight: 600; color: var(--text-muted);
        font-size: 0.75rem; text-transform: uppercase; text-align: left; margin-right: 12px;
      }
    }
  `]
})
export class ManagerDashboardComponent implements OnInit, OnDestroy {
  orders      = signal<Order[]>([]);
  loading     = signal(true);
  updatingId  = signal<number | null>(null);
  cancelTarget = signal<Order | null>(null);
  cancelReason = '';
  toast        = signal<{ message: string; type: 'success' | 'error' } | null>(null);
  allStatuses  = ALL_STATUSES;

  private pollInterval: any;
  private toastTimer: any;

  // Computed metrics
  pendingOrders   = computed(() => this.orders().filter(o => o.status === 'PENDING'));
  activePrepOrders = computed(() => this.orders().filter(o => o.status === 'PREPARING'));
  completedCount  = computed(() => this.orders().filter(o => o.status === 'DELIVERED').length);
  totalRevenue    = computed(() =>
    this.orders().filter(o => o.status === 'DELIVERED').reduce((sum, o) => sum + o.totalPrice, 0)
  );

  constructor(private orderService: OrderService) {}

  ngOnInit(): void {
    this.load(true);
    this.pollInterval = setInterval(() => this.load(false), 4000);
  }

  ngOnDestroy(): void {
    if (this.pollInterval) clearInterval(this.pollInterval);
    if (this.toastTimer) clearTimeout(this.toastTimer);
  }

  load(showLoader = true): void {
    if (showLoader) this.loading.set(true);
    this.orderService.getManagerOrders().subscribe({
      next: (data) => {
        this.orders.set(data);
        if (showLoader) this.loading.set(false);
      },
      error: () => { if (showLoader) this.loading.set(false); }
    });
  }

  changeStatus(orderId: number, status: string): void {
    this.updatingId.set(orderId);
    this.orderService.updateManagerOrderStatus(orderId, status).subscribe({
      next: () => {
        this.updatingId.set(null);
        this.showToast(`✅ Buyurtma #${orderId} holati yangilandi`, 'success');
        this.load(false);
      },
      error: (err: any) => {
        this.updatingId.set(null);
        this.showToast(err.error?.message || '❌ Holatni yangilab bo\'lmadi', 'error');
      }
    });
  }

  markReady(orderId: number): void {
    this.updatingId.set(orderId);
    this.orderService.markManagerOrderReady(orderId).subscribe({
      next: () => {
        this.updatingId.set(null);
        this.showToast(`✅ Buyurtma #${orderId} tayyor deb e'lon qilindi`, 'success');
        this.load(false);
      },
      error: (err: any) => {
        this.updatingId.set(null);
        this.showToast(err.error?.message || '❌ Buyurtmani tayyor deb belgilab bo\'lmadi', 'error');
      }
    });
  }

  confirmCancel(order: Order): void {
    this.cancelTarget.set(order);
    this.cancelReason = '';
  }

  doCancel(): void {
    const order = this.cancelTarget();
    if (!order || !this.cancelReason.trim()) return;
    this.updatingId.set(order.id);
    this.orderService.cancelManagerOrder(order.id, this.cancelReason).subscribe({
      next: () => {
        this.updatingId.set(null);
        this.cancelTarget.set(null);
        this.showToast(`🚫 Buyurtma #${order.id} bekor qilindi`, 'success');
        this.load(false);
      },
      error: (err: any) => {
        this.updatingId.set(null);
        this.showToast(err.error?.message || '❌ Bekor qilib bo\'lmadi', 'error');
      }
    });
  }

  private showToast(message: string, type: 'success' | 'error'): void {
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toast.set({ message, type });
    this.toastTimer = setTimeout(() => this.toast.set(null), 3500);
  }

  getStatusLabel(status: string): string {
    return (ORDER_STATUS_LABELS as any)[status] || status;
  }
}

