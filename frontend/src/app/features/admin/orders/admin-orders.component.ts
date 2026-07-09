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
                    <select class="status-select" [ngModel]="order.status"
                            (change)="changeStatus(order.id, $any($event.target).value)"
                            [id]="'status-select-' + order.id">
                      @for (s of statuses; track s) {
                        <option [value]="s">{{ statusLabel(s) }}</option>
                      }
                    </select>
                  </td>
                  <td>
                    @if (order.courier) {
                      <span class="courier-chip">🏍️ {{ order.courier.name }}</span>
                    } @else {
                      <select class="courier-select" (change)="assignCourier(order.id, +$any($event.target).value)"
                              [id]="'courier-select-' + order.id">
                        <option value="">-- Kuryer tayinla --</option>
                        @for (c of couriers(); track c.id) {
                          <option [value]="c.id">🏍️ {{ c.name }}</option>
                        }
                      </select>
                    }
                  </td>
                  <td>
                    <div class="action-btns">
                      <button class="icon-btn view-btn" title="Ko'rish" (click)="viewOrder(order)">👁️</button>
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
      transition: var(--transition);
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
  `]
})
export class AdminOrdersComponent implements OnInit, OnDestroy {
  orders = signal<Order[]>([]);
  couriers = signal<User[]>([]);
  loading = signal(true);
  filterStatus: OrderStatus | null = null;
  selectedOrder = signal<Order | null>(null);
  statuses = ALL_STATUSES;
  private pollInterval: any;

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
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
    }
  }

  load(showLoader = true): void {
    if (showLoader) this.loading.set(true);
    this.orderService.getAllOrders().subscribe({
      next: (orders) => {
        this.orders.set(orders);
        if (showLoader) this.loading.set(false);
      },
      error: () => {
        if (showLoader) this.loading.set(false);
      }
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

  viewOrder(order: Order): void {
    this.selectedOrder.set(order);
  }

  statusLabel(s: OrderStatus | string): string {
    return ORDER_STATUS_LABELS[s as OrderStatus] ?? s;
  }
}
