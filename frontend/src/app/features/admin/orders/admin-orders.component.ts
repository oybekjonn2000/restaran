import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { OrderService } from '../../../core/services/order.service';
import { Order, ORDER_STATUS_LABELS, OrderStatus } from '../../../core/models/order.model';
import { User } from '../../../core/models/user.model';

const ALL_STATUSES: OrderStatus[] = ['PENDING','PREPARING','COURIER_ACCEPTED','COURIER_AT_RESTAURANT','DELIVERING','COURIER_AT_CLIENT','DELIVERED','CANCELED'];

@Component({
  selector: 'app-admin-orders',
  standalone: true,
  imports: [CommonModule, FormsModule, MatProgressSpinnerModule, MatSnackBarModule],
  template: `
    <div class="orders-page animate-in">
      <div class="page-header">
        <div>
          <h1 class="page-title">📋 Buyurtmalar boshqaruvi</h1>
          <p style="color: var(--text-muted); font-size: 0.875rem;">
            Barcha buyurtmalar — jami {{ orders().length }} ta
          </p>
        </div>
        <button class="btn btn-outline" (click)="load()" id="admin-orders-refresh">
          🔄 Yangilash
        </button>
      </div>

      <!-- Filter -->
      <div class="filter-bar">
        <button class="filter-btn" [class.active]="filterStatus === null"
                (click)="filterStatus = null" id="filter-all">Barchasi</button>
        @for (s of statuses; track s) {
          <button class="filter-btn" [class.active]="filterStatus === s"
                  (click)="filterStatus = s" [id]="'filter-' + s">
            {{ statusLabel(s) }}
          </button>
        }
      </div>

      @if (loading()) {
        <div class="spinner-overlay"><mat-spinner color="warn"></mat-spinner></div>
      }

      @if (!loading()) {
        <div class="table-wrap">
          <table class="orders-table">
            <thead>
              <tr>
                <th>#ID</th>
                <th>Mijoz</th>
                <th>Taomlar</th>
                <th>Summa</th>
                <th>Holat</th>
                <th>Kuryer</th>
                <th>Amallar</th>
              </tr>
            </thead>
            <tbody>
              @for (order of filteredOrders; track order.id) {
                <tr [id]="'admin-order-row-' + order.id">
                  <td><strong>#{{ order.id }}</strong></td>
                  <td>
                    <div class="cell-name">{{ order.user?.name }}</div>
                    <div class="cell-sub">{{ order.createdAt | date:'dd.MM HH:mm' }}</div>
                  </td>
                  <td>
                    <div class="cell-name">{{ order.items?.length }} ta taom</div>
                    @if (order.deliveryAddress) {
                      <div class="cell-sub">📍 {{ order.deliveryAddress | slice:0:30 }}...</div>
                    }
                  </td>
                  <td class="price-cell">{{ order.totalPrice | number:'1.0-0' }} so'm</td>
                  <td>
                    @if (order.status === 'CANCELED') {
                      <span class="canceled-badge">❌ Bekor qilindi</span>
                      @if (order.cancelReason) {
                        <div class="cancel-reason-chip" [title]="order.cancelReason">
                          💬 {{ order.cancelReason | slice:0:25 }}{{ order.cancelReason!.length > 25 ? '...' : '' }}
                        </div>
                      }
                    } @else {
                      <select class="status-select" [ngModel]="order.status"
                              (change)="changeStatus(order.id, $any($event.target).value)"
                              [id]="'status-select-' + order.id">
                        @for (s of statuses; track s) {
                          <option [value]="s">{{ statusLabel(s) }}</option>
                        }
                      </select>
                    }
                  </td>
                  <td>
                    @if (order.courier) {
                      <span class="courier-chip">🏍️ {{ order.courier.name }}</span>
                    } @else if (order.status !== 'CANCELED') {
                      <select class="courier-select" (change)="assignCourier(order.id, +$any($event.target).value)"
                              [id]="'courier-select-' + order.id">
                        <option value="">-- Kuryer tayinla --</option>
                        @for (c of couriers(); track c.id) {
                          <option [value]="c.id">🏍️ {{ c.name }}</option>
                        }
                      </select>
                    } @else {
                      <span style="color: var(--text-muted); font-size: 0.8rem;">—</span>
                    }
                  </td>
                  <td>
                    <div class="action-btns">
                      <button class="icon-btn view-btn" title="Ko'rish" (click)="viewOrder(order)">👁️</button>
                      @if (order.status !== 'CANCELED' && order.status !== 'DELIVERED') {
                        <button class="icon-btn cancel-btn" title="Sabab bilan bekor qilish"
                                (click)="openCancelModal(order)"
                                [id]="'cancel-btn-' + order.id">🚫</button>
                      }
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>

          @if (filteredOrders.length === 0) {
            <div class="empty-state" style="padding: 40px;">
              <div class="icon">📭</div>
              <p>Bu filtrlash bo'yicha buyurtmalar yo'q</p>
            </div>
          }
        </div>
      }

      <!-- Order detail modal -->
      @if (selectedOrder()) {
        <div class="modal-overlay" (click)="selectedOrder.set(null)">
          <div class="modal-card animate-in" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h2>Buyurtma #{{ selectedOrder()!.id }}</h2>
              <button class="close-btn" (click)="selectedOrder.set(null)">✕</button>
            </div>
            <div class="modal-body">
              <p><strong>Mijoz:</strong> {{ selectedOrder()!.user?.name }}</p>
              <p><strong>Manzil:</strong> {{ selectedOrder()!.deliveryAddress || '—' }}</p>
              <p><strong>Izoh:</strong> {{ selectedOrder()!.note || '—' }}</p>
              <p><strong>Holat:</strong> {{ statusLabel(selectedOrder()!.status) }}</p>
              @if (selectedOrder()!.cancelReason) {
                <div class="cancel-reason-box">
                  <span>⚠️ Bekor qilish sababi:</span>
                  <p>{{ selectedOrder()!.cancelReason }}</p>
                </div>
              }
              <hr style="border-color: var(--border); margin: 12px 0;">
              <h3>Taomlar:</h3>
              @for (item of selectedOrder()!.items; track item.id) {
                <div class="modal-item">
                  <span>{{ item.food?.name }}</span>
                  <span>x{{ item.quantity }}</span>
                  <span>{{ (item.price * item.quantity) | number:'1.0-0' }} so'm</span>
                </div>
              }
              <div class="modal-total">
                Jami: {{ selectedOrder()!.totalPrice | number:'1.0-0' }} so'm
              </div>
            </div>
          </div>
        </div>
      }

      <!-- Cancel with reason modal -->
      @if (cancelModalOrder()) {
        <div class="modal-overlay" (click)="closeCancelModal()">
          <div class="modal-card cancel-modal animate-in" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h2>🚫 Buyurtma #{{ cancelModalOrder()!.id }} ni bekor qilish</h2>
              <button class="close-btn" (click)="closeCancelModal()">✕</button>
            </div>
            <div class="modal-body">
              <p style="color: var(--text-muted); margin-bottom: 16px;">
                Mijozga ko'rsatiladigan bekor qilish sababini kiriting.
                Bu xabar yuborilganda buyurtma avtomatik bekor bo'ladi.
              </p>
              <div class="reason-presets">
                <p style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 8px;">Tezkor sabablar:</p>
                <div class="preset-btns">
                  @for (preset of cancelPresets; track preset) {
                    <button class="preset-btn" (click)="cancelReason = preset">{{ preset }}</button>
                  }
                </div>
              </div>
              <div class="reason-input-wrap">
                <label style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 6px; display: block;">
                  Sabab matni:
                </label>
                <textarea
                  class="reason-textarea"
                  [(ngModel)]="cancelReason"
                  placeholder="Masalan: Kuryer topilmadi, iltimos qayta urinib ko'ring..."
                  rows="4"
                  id="cancel-reason-textarea"
                  maxlength="500"
                ></textarea>
                <div style="text-align: right; font-size: 0.75rem; color: var(--text-muted);">
                  {{ cancelReason.length }}/500
                </div>
              </div>
              <div class="modal-actions">
                <button class="btn btn-outline" (click)="closeCancelModal()">Bekor</button>
                <button class="btn-danger"
                        [disabled]="!cancelReason.trim() || canceling()"
                        (click)="confirmCancel()"
                        id="confirm-cancel-btn">
                  @if (canceling()) { ⏳ Bekor qilinmoqda... }
                  @else { 🚫 Xabar yuborib bekor qilish }
                </button>
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .orders-page { max-width: 100%; }

    .filter-bar {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      margin-bottom: 20px;
    }

    .filter-btn {
      padding: 6px 14px;
      border-radius: 20px;
      border: 1px solid var(--border);
      background: var(--bg-card);
      color: var(--text-muted);
      font-size: 0.8rem;
      font-weight: 500;
      cursor: pointer;
      font-family: 'Poppins', sans-serif;
      transition: var(--transition);
    }
    .filter-btn:hover, .filter-btn.active {
      background: var(--primary);
      border-color: var(--primary);
      color: white;
    }

    .table-wrap {
      background: var(--bg-card);
      border-radius: var(--radius-lg);
      border: 1px solid var(--border);
      overflow-x: auto;
    }

    .orders-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.875rem;
    }

    .orders-table th {
      background: var(--bg-card2);
      padding: 12px 16px;
      text-align: left;
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border-bottom: 1px solid var(--border);
    }

    .orders-table td {
      padding: 12px 16px;
      border-bottom: 1px solid rgba(255,255,255,0.04);
      vertical-align: middle;
    }

    .orders-table tbody tr:hover { background: rgba(255,255,255,0.02); }
    .orders-table tbody tr:last-child td { border-bottom: none; }

    .cell-name { font-weight: 500; color: var(--text); }
    .cell-sub { font-size: 0.75rem; color: var(--text-muted); margin-top: 2px; }
    .price-cell { font-weight: 700; color: var(--primary); }

    .status-select, .courier-select {
      background: var(--bg-card2);
      border: 1px solid var(--border);
      border-radius: 8px;
      color: var(--text);
      padding: 6px 10px;
      font-family: 'Poppins', sans-serif;
      font-size: 0.8rem;
      cursor: pointer;
      outline: none;
      max-width: 160px;
    }

    .courier-chip {
      background: rgba(139,92,246,0.1);
      color: #8b5cf6;
      border: 1px solid rgba(139,92,246,0.2);
      border-radius: 12px;
      padding: 4px 10px;
      font-size: 0.8rem;
      white-space: nowrap;
    }

    .canceled-badge {
      background: rgba(239,68,68,0.1);
      color: #ef4444;
      border: 1px solid rgba(239,68,68,0.2);
      border-radius: 8px;
      padding: 4px 10px;
      font-size: 0.8rem;
      display: inline-block;
    }

    .cancel-reason-chip {
      margin-top: 4px;
      font-size: 0.75rem;
      color: var(--text-muted);
      background: rgba(239,68,68,0.05);
      border: 1px solid rgba(239,68,68,0.15);
      border-radius: 6px;
      padding: 2px 8px;
      max-width: 180px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      cursor: help;
    }

    .action-btns { display: flex; gap: 6px; }
    .icon-btn {
      background: var(--bg-card2);
      border: 1px solid var(--border);
      border-radius: 6px;
      padding: 5px 8px;
      cursor: pointer;
      font-size: 0.9rem;
      transition: var(--transition);
    }
    .icon-btn:hover { background: var(--border); }
    .cancel-btn:hover { background: rgba(239,68,68,0.15) !important; border-color: rgba(239,68,68,0.4) !important; }

    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.6);
      backdrop-filter: blur(4px);
      z-index: 300;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }

    .modal-card {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      width: 100%;
      max-width: 500px;
      max-height: 80vh;
      overflow-y: auto;
    }

    .cancel-modal { max-width: 520px; }

    .modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 20px 24px;
      border-bottom: 1px solid var(--border);
    }
    .modal-header h2 { font-size: 1.1rem; font-weight: 700; }
    .close-btn {
      background: var(--bg-card2); border: 1px solid var(--border);
      border-radius: 8px; padding: 6px 10px; cursor: pointer;
      transition: var(--transition); color: var(--text);
    }
    .close-btn:hover { background: var(--danger); color: white; border-color: var(--danger); }

    .modal-body {
      padding: 20px 24px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      font-size: 0.9rem;
      color: var(--text-muted);
    }
    .modal-body strong { color: var(--text); }

    .modal-item {
      display: flex;
      justify-content: space-between;
      padding: 6px 0;
      border-bottom: 1px solid rgba(255,255,255,0.04);
    }

    .modal-total {
      margin-top: 12px;
      font-weight: 700;
      font-size: 1rem;
      color: var(--primary);
      text-align: right;
    }

    .cancel-reason-box {
      background: rgba(239,68,68,0.08);
      border: 1px solid rgba(239,68,68,0.2);
      border-radius: 10px;
      padding: 12px 16px;
      color: #fca5a5;
    }
    .cancel-reason-box span { font-size: 0.8rem; font-weight: 600; display: block; margin-bottom: 6px; }
    .cancel-reason-box p { margin: 0; font-size: 0.9rem; }

    .reason-presets { margin-bottom: 4px; }
    .preset-btns {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    .preset-btn {
      padding: 5px 12px;
      background: var(--bg-card2);
      border: 1px solid var(--border);
      border-radius: 16px;
      color: var(--text-muted);
      font-size: 0.78rem;
      cursor: pointer;
      font-family: 'Poppins', sans-serif;
      transition: var(--transition);
    }
    .preset-btn:hover {
      border-color: rgba(239,68,68,0.5);
      color: #fca5a5;
      background: rgba(239,68,68,0.08);
    }

    .reason-input-wrap { display: flex; flex-direction: column; gap: 4px; }
    .reason-textarea {
      background: var(--bg-card2);
      border: 1px solid var(--border);
      border-radius: 10px;
      color: var(--text);
      padding: 12px;
      font-family: 'Poppins', sans-serif;
      font-size: 0.875rem;
      resize: vertical;
      outline: none;
      transition: var(--transition);
      line-height: 1.5;
    }
    .reason-textarea:focus { border-color: rgba(249,115,22,0.5); }

    .modal-actions {
      display: flex;
      gap: 12px;
      justify-content: flex-end;
      margin-top: 8px;
      padding-top: 16px;
      border-top: 1px solid var(--border);
    }

    .btn-danger {
      background: #ef4444;
      color: white;
      padding: 10px 20px;
      border-radius: 10px;
      font-family: 'Poppins', sans-serif;
      font-size: 0.875rem;
      font-weight: 600;
      cursor: pointer;
      transition: var(--transition);
      border: none;
    }
    .btn-danger:hover:not(:disabled) { background: #dc2626; }
    .btn-danger:disabled { opacity: 0.5; cursor: not-allowed; }
  `]
})
export class AdminOrdersComponent implements OnInit, OnDestroy {
  orders = signal<Order[]>([]);
  couriers = signal<User[]>([]);
  loading = signal(true);
  filterStatus: OrderStatus | null = null;
  selectedOrder = signal<Order | null>(null);
  cancelModalOrder = signal<Order | null>(null);
  canceling = signal(false);
  cancelReason = '';
  statuses = ALL_STATUSES;
  private pollInterval: any;

  cancelPresets = [
    'Kuryer topilmadi',
    'Restoran yopiq',
    'Hududda yetkazish imkonsiz',
    "Buyurtma noto'g'ri kiritilgan",
    'Texnik muammo sababli',
  ];

  get filteredOrders(): Order[] {
    if (!this.filterStatus) return this.orders();
    return this.orders().filter(o => o.status === this.filterStatus);
  }

  constructor(
    private orderService: OrderService,
    private snack: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.load(true);
    this.pollInterval = setInterval(() => this.load(false), 4000);
  }

  ngOnDestroy(): void {
    if (this.pollInterval) clearInterval(this.pollInterval);
  }

  load(showLoader = true): void {
    if (showLoader) this.loading.set(true);
    this.orderService.getAllOrders().subscribe({
      next: (orders) => {
        this.orders.set(orders);
        if (showLoader) this.loading.set(false);
      },
      error: () => { if (showLoader) this.loading.set(false); }
    });
    this.orderService.getCouriers().subscribe(c => this.couriers.set(c));
  }

  changeStatus(orderId: number, status: string): void {
    this.orderService.updateOrderStatus(orderId, status).subscribe({
      next: (updated) => {
        this.orders.update(list => list.map(o => o.id === orderId ? updated : o));
        this.snack.open(`✅ Holat "${this.statusLabel(status as OrderStatus)}" ga o'zgartirildi`, '', { duration: 2000 });
      },
      error: () => this.snack.open('❌ Xatolik', '', { duration: 2000 })
    });
  }

  assignCourier(orderId: number, courierId: number): void {
    if (!courierId) return;
    this.orderService.assignCourier(orderId, courierId).subscribe({
      next: (updated) => {
        this.orders.update(list => list.map(o => o.id === orderId ? updated : o));
        this.snack.open('✅ Kuryer tayinlandi!', '', { duration: 2000 });
      },
      error: () => this.snack.open('❌ Xatolik', '', { duration: 2000 })
    });
  }

  viewOrder(order: Order): void { this.selectedOrder.set(order); }

  openCancelModal(order: Order): void {
    this.cancelModalOrder.set(order);
    this.cancelReason = '';
  }

  closeCancelModal(): void {
    this.cancelModalOrder.set(null);
    this.cancelReason = '';
  }

  confirmCancel(): void {
    const order = this.cancelModalOrder();
    if (!order || !this.cancelReason.trim()) return;
    this.canceling.set(true);
    this.orderService.cancelOrderWithReason(order.id, this.cancelReason.trim()).subscribe({
      next: (updated) => {
        this.orders.update(list => list.map(o => o.id === order.id ? updated : o));
        this.canceling.set(false);
        this.closeCancelModal();
        this.snack.open('✅ Buyurtma bekor qilindi, mijozga sabab yuborildi', '', { duration: 3000 });
      },
      error: () => {
        this.canceling.set(false);
        this.snack.open('❌ Xatolik yuz berdi', '', { duration: 2000 });
      }
    });
  }

  statusLabel(s: OrderStatus | string): string {
    return ORDER_STATUS_LABELS[s as OrderStatus] ?? s;
  }
}
