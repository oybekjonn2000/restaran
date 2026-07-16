import { Component, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { OrderService } from '../../../core/services/order.service';
import { Order, ORDER_STATUS_LABELS, OrderStatus } from '../../../core/models/order.model';
import { BodyPortalDirective } from '../../../core/directives/body-portal.directive';

const ALL_STATUSES: OrderStatus[] = ['PENDING','PREPARING','COURIER_ACCEPTED','COURIER_AT_RESTAURANT','DELIVERING','COURIER_AT_CLIENT','DELIVERED','CANCELED'];

@Component({
  selector: 'app-manager-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, MatProgressSpinnerModule, BodyPortalDirective],
  template: `
    <div class="manager-dashboard-page animate-in">
      
      <!-- HEADER -->
      <div class="dashboard-header">
        <div class="header-left">
          <h1 class="page-title">🍳 Restoran Oshxona Paneli</h1>
          <p class="page-subtitle">Buyurtmalar oqimi, oshxona yuklamasi va real-vaqtda boshqarish</p>
        </div>
        <div class="header-right">
          <button class="btn-refresh-premium" (click)="load(true)" id="refresh-manager-btn">
            <span class="refresh-icon">🔄</span> Yangilash
          </button>
        </div>
      </div>

      <!-- METRICS GRID -->
      <div class="metrics-grid">
        <!-- Metric 1: Pending (Yangi) -->
        <div class="metric-card border-orange">
          <div class="metric-header">
            <span class="metric-label">YANGI BUYURTMALAR</span>
            <span class="metric-icon">⏳</span>
          </div>
          <div class="metric-value color-orange">{{ pendingOrders().length }} ta</div>
          <div class="metric-footer">Tasdiqlash kutilmoqda</div>
        </div>

        <!-- Metric 2: Preparing -->
        <div class="metric-card border-purple">
          <div class="metric-header">
            <span class="metric-label">TAYYORLANMOQDA</span>
            <span class="metric-icon">🍳</span>
          </div>
          <div class="metric-value color-purple">{{ activePrepOrders().length }} ta</div>
          <div class="metric-footer">Hozir tayyorlanayotgan taomlar</div>
        </div>

        <!-- Metric 3: Completed -->
        <div class="metric-card border-green">
          <div class="metric-header">
            <span class="metric-label">YAKUNLANGANLAR</span>
            <span class="metric-icon">✅</span>
          </div>
          <div class="metric-value color-green">{{ completedCount() }} ta</div>
          <div class="metric-footer">Yetkazib berilgan buyurtmalar</div>
        </div>

        <!-- Metric 4: Revenue -->
        <div class="metric-card border-blue">
          <div class="metric-header">
            <span class="metric-label">UMUMIY AYLANMA</span>
            <span class="metric-icon">💰</span>
          </div>
          <div class="metric-value color-blue">{{ totalRevenue() | number:'1.0-0' }} so'm</div>
          <div class="metric-footer">Bugungi aylanma (yetkazilganlar)</div>
        </div>
      </div>

      <!-- PIPELINE PROGRESS BAR -->
      <div class="pipeline-section">
        <div class="pipeline-header">
          <h2 class="section-title">📊 Oshxona va Yetkazish Yuklamasi</h2>
          <span class="total-badge">Jami faol: {{ activeOrdersCount() }} ta</span>
        </div>
        
        <div class="progress-bar-wrap">
          <div class="segment-bar">
            <div class="segment bg-pending" [style.width.%]="getStatusPercent('PENDING')" title="Kutilmoqda"></div>
            <div class="segment bg-preparing" [style.width.%]="getStatusPercent('PREPARING')" title="Tayyorlanmoqda"></div>
            <div class="segment bg-ready" [style.width.%]="getReadyPercent()" title="Tayyor / Kuryer kutilmoqda"></div>
            <div class="segment bg-delivering" [style.width.%]="getDeliveringPercent()" title="Yo'lda"></div>
          </div>
          
          <div class="segment-legend">
            <div class="legend-item"><span class="legend-dot bg-pending"></span> Yangi ({{ pendingOrders().length }})</div>
            <div class="legend-item"><span class="legend-dot bg-preparing"></span> Tayyorlanmoqda ({{ getOnlyPreparingCount() }})</div>
            <div class="legend-item"><span class="legend-dot bg-ready"></span> Taom tayyor ({{ getReadyButNotPickedCount() }})</div>
            <div class="legend-item"><span class="legend-dot bg-delivering"></span> Yo'lda ({{ getDeliveringCount() }})</div>
          </div>
        </div>
      </div>

      <!-- MAIN ORDERS SECTION -->
      <div class="orders-section">
        <div class="section-header-row">
          <h2 class="section-title">📋 Buyurtmalar Ro'yxati</h2>
        </div>

        @if (loading()) {
          <div class="loading-state">
            <mat-spinner diameter="40" color="warn"></mat-spinner>
            <p>Yuklanmoqda...</p>
          </div>
        } @else {
          <div class="table-wrap">
            <table class="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Mijoz</th>
                  <th>Taomlar</th>
                  <th>Jami Narx</th>
                  <th>Masofa</th>
                  <th>Kuryer to'lovi</th>
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
                        <span class="phone">📞 {{ order.user.phone || 'Tel kiritilmagan' }}</span>
                      </div>
                    </td>
                    <td data-label="Taomlar">
                      <div class="food-list">
                        @for (item of order.items; track item.id) {
                          <div class="food-item">🍔 {{ item.food.name }} <strong class="qty-badge">x{{ item.quantity }}</strong></div>
                        }
                      </div>
                    </td>
                    <td data-label="Jami Narx">
                      <div class="price-info">
                        <strong class="total-price-text">{{ (order.totalPrice + (order.deliveryFee || 0)) | number:'1.0-0' }} so'm</strong>
                        <span class="fee-text">(Yetkazish: {{ order.deliveryFee | number:'1.0-0' }} so'm)</span>
                      </div>
                    </td>
                    <td data-label="Masofa">{{ (order.deliveryDistanceKm || order.distance || 0) | number:'1.1-2' }} km</td>
                    <td data-label="Kuryer to'lovi">
                      @if (order.courier) {
                        <div class="courier-badge">🏍️ {{ order.courier.name }}</div>
                        <div class="courier-earning-details">
                          <div>💰 Baza: {{ order.baseFee || 9000 | number:'1.0-0' }} so'm</div>
                          <div>🏪 Restorangacha: {{ order.pickupDistanceKm || 0 | number:'1.2-2' }} km ({{ order.pickupFee || 0 | number:'1.0-0' }} so'm)</div>
                          <div>📍 Mijozgacha: {{ order.deliveryDistanceKm || 0 | number:'1.2-2' }} km ({{ order.courierDeliveryFee || 0 | number:'1.0-0' }} so'm)</div>
                          <div class="total-payout">💸 Jami: {{ order.totalEarning || 0 | number:'1.0-0' }} so'm</div>
                        </div>
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
                            <span class="status-info-cooking">🍳 Taom tayyor (kutilmoqda)</span>
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
                              <span class="status-info-cooking">✅ Taom tayyor (kuryerda)</span>
                            } @else {
                              <button
                                class="act-btn act-courier"
                                (click)="changeStatus(order.id, 'DELIVERING')"
                                [disabled]="updatingId() === order.id"
                                [id]="'courier-way-btn-' + order.id">
                                🏍️ Kuryer yo'lga chiqdi
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

                        <!-- DELIVERING / COURIER_AT_CLIENT -->
                        @else if (order.status === 'DELIVERING' || order.status === 'COURIER_AT_CLIENT') {
                          @if (order.courier && order.courierActiveOnShift) {
                            <span class="status-info-transit">🚴 Yetkazilmoqda...</span>
                          } @else {
                            @if (order.yandexDelivery) {
                              <span class="status-info-yandex">🚕 Yandex yetkazib berish</span>
                            }
                            <button
                              class="act-btn act-ready"
                              (click)="changeStatus(order.id, 'DELIVERED')"
                              [disabled]="updatingId() === order.id"
                              [id]="'deliver-btn-' + order.id">
                              ✅ Topshirildi
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
            <div class="empty-state-card">
              <div class="empty-icon">🍳</div>
              <h3>Hozircha buyurtmalar mavjud emas</h3>
              <p>Yangi buyurtmalar kelganda shu yerda paydo bo'ladi</p>
            </div>
          }
        }
      </div>

      <!-- Toast Notification -->
      @if (toast()) {
        <div class="toast-bar" [class.toast-success]="toast()!.type === 'success'" [class.toast-error]="toast()!.type === 'error'">
          {{ toast()!.message }}
        </div>
      }

      <!-- Cancel Confirm Modal -->
      @if (cancelTarget()) {
        <div class="modal-overlay" appBodyPortal (click)="cancelTarget.set(null)">
          <div class="modal-card animate-pop" (click)="$event.stopPropagation()">
            <div class="modal-icon">⚠️</div>
            <h3 class="modal-title">Buyurtmani bekor qilish</h3>
            <p class="modal-desc">#{{ cancelTarget()!.id }} buyurtmani rostdan ham bekor qilmoqchimisiz?</p>
            
            <div class="modal-reason-block">
              <label class="reason-label">Bekor qilish sababi</label>
              <input
                class="reason-input-premium"
                [(ngModel)]="cancelReason"
                placeholder="Masalan: Mahsulot tugab qoldi, kuryer topilmadi..."
                id="cancel-reason-input" />
            </div>

            <div class="modal-buttons-row">
              <button class="modal-btn btn-back" (click)="cancelTarget.set(null)">Orqaga</button>
              <button class="modal-btn btn-cancel-confirm" (click)="doCancel()" [disabled]="!cancelReason.trim() || updatingId() !== null">
                Bekor qilish
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .manager-dashboard-page {
      max-width: 1100px;
      margin: 0 auto;
      padding: 10px;
      color: var(--text);
    }

    /* HEADER */
    .dashboard-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
      border-bottom: 1px solid var(--border);
      padding-bottom: 16px;
    }
    .page-title {
      font-size: 1.8rem;
      font-weight: 800;
      margin: 0;
      background: linear-gradient(135deg, #fff, var(--text-muted));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .page-subtitle {
      color: var(--text-muted);
      margin: 4px 0 0;
      font-size: 0.9rem;
    }
    .btn-refresh-premium {
      background: var(--bg-card);
      border: 1px solid var(--border);
      color: var(--text);
      padding: 10px 20px;
      border-radius: 12px;
      font-weight: 600;
      font-size: 0.88rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
      transition: all 0.2s;
    }
    .btn-refresh-premium:hover {
      border-color: var(--primary);
      background: rgba(75, 107, 251, 0.08);
      transform: translateY(-1px);
    }

    /* METRIC CARDS */
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 20px;
      margin-bottom: 28px;
    }
    .metric-card {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 22px;
      box-shadow: var(--shadow);
    }
    .border-orange { border-left: 4px solid #f97316; }
    .border-purple { border-left: 4px solid #8b5cf6; }
    .border-green { border-left: 4px solid #10b981; }
    .border-blue { border-left: 4px solid #3b82f6; }

    .metric-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }
    .metric-label {
      font-size: 0.72rem;
      font-weight: 700;
      color: var(--text-muted);
      letter-spacing: 0.08em;
    }
    .metric-icon { font-size: 1.3rem; }
    .metric-value {
      font-size: 1.7rem;
      font-weight: 800;
      margin-bottom: 6px;
    }
    .color-orange { color: #f97316; }
    .color-purple { color: #8b5cf6; }
    .color-green { color: #10b981; }
    .color-blue { color: #3b82f6; }
    .metric-footer {
      font-size: 0.75rem;
      color: var(--text-muted);
    }

    /* PIPELINE SECTION */
    .pipeline-section {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 20px;
      margin-bottom: 28px;
    }
    .pipeline-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }
    .section-title {
      font-size: 1.1rem;
      font-weight: 800;
      margin: 0;
    }
    .total-badge {
      font-size: 0.8rem;
      background: var(--border);
      padding: 4px 10px;
      border-radius: 12px;
      font-weight: 600;
    }
    .progress-bar-wrap {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .segment-bar {
      display: flex;
      height: 12px;
      border-radius: 6px;
      overflow: hidden;
      background: var(--border);
    }
    .segment {
      height: 100%;
      transition: width 0.4s ease;
    }
    .bg-pending { background-color: #f59e0b; }
    .bg-preparing { background-color: #8b5cf6; }
    .bg-ready { background-color: #10b981; }
    .bg-delivering { background-color: #3b82f6; }

    .segment-legend {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
      font-size: 0.78rem;
      color: var(--text-muted);
    }
    .legend-item {
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .legend-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
    }

    /* ORDERS TABLE SECTION */
    .orders-section {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 24px;
      position: relative;
    }
    .table-wrap {
      overflow-x: auto;
      margin-top: 16px;
    }
    .data-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
    }
    .data-table th {
      padding: 12px 16px;
      border-bottom: 2px solid var(--border);
      color: var(--text-muted);
      font-size: 0.8rem;
      text-transform: uppercase;
      font-weight: 700;
      letter-spacing: 0.05em;
    }
    .data-table td {
      padding: 16px;
      border-bottom: 1px solid var(--border);
      font-size: 0.88rem;
    }
    .data-table tbody tr:hover {
      background: rgba(255,255,255,0.01);
    }

    /* ROW DETAILS TYPOGRAPHY */
    .client-info {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .client-info .name {
      font-weight: 700;
      color: #fff;
    }
    .client-info .phone {
      font-size: 0.75rem;
      color: var(--text-muted);
    }

    .food-list {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .food-item {
      font-size: 0.82rem;
    }
    .qty-badge {
      background: var(--border);
      padding: 2px 6px;
      border-radius: 6px;
      font-size: 0.75rem;
      margin-left: 4px;
    }

    .price-info {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .total-price-text {
      color: #fff;
      font-weight: 700;
    }
    .fee-text {
      font-size: 0.72rem;
      color: var(--text-muted);
    }

    /* COURIER ACCENT BADGE */
    .courier-badge {
      background: rgba(75, 107, 251, 0.12);
      color: #3b82f6;
      border: 1px solid rgba(75, 107, 251, 0.25);
      border-radius: 12px;
      padding: 4px 10px;
      font-size: 0.78rem;
      font-weight: 700;
      display: inline-block;
      margin-bottom: 6px;
    }
    .courier-earning-details {
      font-size: 0.7rem;
      color: var(--text-muted);
      line-height: 1.4;
      border-top: 1px dashed rgba(255,255,255,0.08);
      padding-top: 4px;
    }
    .total-payout {
      color: #10b981;
      font-weight: 700;
      margin-top: 2px;
    }
    .no-courier {
      font-size: 0.78rem;
      color: var(--text-muted);
      font-style: italic;
    }

    /* STATUS PILLS */
    .status-badge {
      font-size: 0.7rem;
      padding: 4px 10px;
      border-radius: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.03em;
      display: inline-block;
    }
    .badge-pending { background: rgba(245,158,11,0.12); color: #f59e0b; }
    .badge-preparing { background: rgba(139,92,246,0.12); color: #8b5cf6; }
    .badge-courier_accepted { background: rgba(59,130,246,0.12); color: #3b82f6; }
    .badge-courier_at_restaurant { background: rgba(16,185,129,0.12); color: #10b981; }
    .badge-delivering { background: rgba(59,130,246,0.15); color: #3b82f6; }
    .badge-courier_at_client { background: rgba(236,72,153,0.12); color: #ec4899; }
    .badge-delivered { background: rgba(16,185,129,0.12); color: #10b981; }
    .badge-canceled { background: rgba(239,68,68,0.12); color: #ef4444; }

    /* ACTION BUTTONS */
    .action-btns {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }
    .act-btn {
      padding: 6px 12px;
      font-size: 0.78rem;
      font-weight: 700;
      border-radius: 8px;
      border: none;
      cursor: pointer;
      transition: all 0.15s ease;
      white-space: nowrap;
    }
    .act-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .act-prepare {
      background: linear-gradient(135deg, #f59e0b, #d97706);
      color: #fff;
    }
    .act-prepare:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 4px 10px rgba(245,158,11,0.3); }
    .act-ready {
      background: linear-gradient(135deg, #10b981, #059669);
      color: #fff;
    }
    .act-ready:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 4px 10px rgba(16,185,129,0.3); }
    .act-courier {
      background: linear-gradient(135deg, #3b82f6, #1d4ed8);
      color: #fff;
    }
    .act-courier:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 4px 10px rgba(59,130,246,0.3); }
    .act-cancel {
      background: rgba(239,68,68,0.12);
      color: #ef4444;
      border: 1px solid rgba(239,68,68,0.25);
    }
    .act-cancel:hover:not(:disabled) { background: rgba(239,68,68,0.2); }

    .status-done { color: #10b981; font-weight: 700; font-size: 0.8rem; }
    .status-canceled { color: var(--text-muted); font-weight: 700; font-size: 0.8rem; }
    .status-info-cooking { color: #8b5cf6; font-weight: 600; font-style: italic; font-size: 0.8rem; }
    .status-info-transit { color: #3b82f6; font-weight: 600; font-style: italic; font-size: 0.8rem; }
    .status-info-yandex { color: #f97316; font-weight: 600; font-size: 0.8rem; display: block; margin-bottom: 4px; }

    /* LOADING & EMPTY STATES */
    .loading-state {
      padding: 50px 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      color: var(--text-muted);
    }
    .empty-state-card {
      padding: 48px;
      text-align: center;
      background: rgba(255,255,255,0.01);
      border: 1px dashed var(--border);
      border-radius: 12px;
      color: var(--text-muted);
      margin-top: 16px;
    }
    .empty-icon { font-size: 2.2rem; margin-bottom: 12px; }
    .empty-state-card h3 { color: #fff; font-size: 1rem; margin: 0 0 6px; }
    .empty-state-card p { font-size: 0.82rem; margin: 0; }

    .row-updating { opacity: 0.5; pointer-events: none; }

    /* MODAL OVERLAY & CARD */
    .modal-overlay {
      position: fixed; inset: 0; background: rgba(0,0,0,0.6);
      display: flex; align-items: center; justify-content: center; z-index: 9999;
      backdrop-filter: blur(4px);
    }
    .modal-card {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: 20px;
      padding: 32px 24px;
      max-width: 400px; width: 90%;
      text-align: center;
      display: flex; flex-direction: column;
    }
    .animate-pop { animation: popScale 0.2s cubic-bezier(0.34, 1.56, 0.64, 1) both; }
    @keyframes popScale { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }
    
    .modal-icon { font-size: 2.2rem; margin-bottom: 12px; }
    .modal-title { font-size: 1.15rem; font-weight: 800; margin: 0 0 8px; }
    .modal-desc { font-size: 0.85rem; color: var(--text-muted); margin: 0 0 20px; }
    
    .modal-reason-block {
      text-align: left;
      margin-bottom: 24px;
    }
    .reason-label {
      font-size: 0.78rem;
      font-weight: 700;
      color: var(--text-muted);
      display: block;
      margin-bottom: 8px;
    }
    .reason-input-premium {
      width: 100%;
      background: rgba(0,0,0,0.2);
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: 10px 14px;
      color: #fff;
      font-size: 0.88rem;
      box-sizing: border-box;
    }
    .reason-input-premium:focus {
      outline: none;
      border-color: #ef4444;
    }

    .modal-buttons-row {
      display: flex;
      gap: 12px;
      justify-content: center;
    }
    .modal-btn {
      padding: 10px 20px;
      border-radius: 10px;
      font-size: 0.88rem;
      font-weight: 700;
      border: none;
      cursor: pointer;
      transition: all 0.2s;
    }
    .btn-back {
      background: transparent;
      color: var(--text-muted);
      border: 1px solid var(--border);
    }
    .btn-back:hover { background: rgba(255,255,255,0.03); }
    .btn-cancel-confirm {
      background: #ef4444;
      color: #fff;
    }
    .btn-cancel-confirm:hover:not(:disabled) {
      background: #dc2626;
      box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
    }

    /* TOAST */
    .toast-bar {
      position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%);
      padding: 12px 24px; border-radius: 12px; font-weight: 700; font-size: 0.88rem;
      z-index: 9999; animation: slideInUp 0.2s ease-out;
      box-shadow: 0 8px 30px rgba(0,0,0,0.35);
    }
    .toast-success { background: #10b981; color: #fff; }
    .toast-error { background: #ef4444; color: #fff; }
    @keyframes slideInUp { from { transform: translateX(-50%) translateY(20px); opacity: 0; } to { transform: translateX(-50%) translateY(0); opacity: 1; } }

    /* Responsive tables */
    @media (max-width: 768px) {
      .dashboard-header { flex-direction: column; align-items: stretch; gap: 12px; }
      .btn-refresh-premium { width: 100%; justify-content: center; }
      
      .data-table, .data-table thead, .data-table tbody, .data-table th, .data-table td, .data-table tr { display: block; }
      .data-table thead { display: none; }
      .data-table tr {
        border: 1px solid var(--border); border-radius: 12px;
        padding: 12px; margin-bottom: 12px; background: rgba(255,255,255,0.01);
      }
      .data-table td {
        display: flex; justify-content: space-between; align-items: center;
        padding: 10px 0; border-bottom: 1px dashed var(--border); text-align: right;
      }
      .data-table td:last-child { border-bottom: none; padding-top: 12px; justify-content: flex-end; }
      .data-table td::before {
        content: attr(data-label); font-weight: 700; color: var(--text-muted);
        font-size: 0.72rem; text-transform: uppercase; margin-right: 12px;
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

  activeOrdersCount = computed(() => 
    this.orders().filter(o => o.status !== 'DELIVERED' && o.status !== 'CANCELED').length
  );

  constructor(private orderService: OrderService) {}

  ngOnInit(): void {
    this.load(true);
    // Poll stats every 5 seconds to keep data live
    this.pollInterval = setInterval(() => this.load(false), 5000);
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

  // Pipeline helper percentages
  getStatusPercent(status: string): number {
    const active = this.activeOrdersCount();
    if (active === 0) return 0;
    const count = this.orders().filter(o => o.status === status).length;
    return (count / active) * 100;
  }

  getOnlyPreparingCount(): number {
    return this.orders().filter(o => o.status === 'PREPARING' && !o.isReady).length;
  }

  getReadyButNotPickedCount(): number {
    // Preparing with isReady, or COURIER_ACCEPTED/COURIER_AT_RESTAURANT but not ready
    return this.orders().filter(o => 
      (o.status === 'PREPARING' && o.isReady) || 
      (['COURIER_ACCEPTED', 'COURIER_AT_RESTAURANT'].includes(o.status) && o.isReady)
    ).length;
  }

  getDeliveringCount(): number {
    return this.orders().filter(o => ['DELIVERING', 'COURIER_AT_CLIENT'].includes(o.status)).length;
  }

  getReadyPercent(): number {
    const active = this.activeOrdersCount();
    if (active === 0) return 0;
    return (this.getReadyButNotPickedCount() / active) * 100;
  }

  getDeliveringPercent(): number {
    const active = this.activeOrdersCount();
    if (active === 0) return 0;
    return (this.getDeliveringCount() / active) * 100;
  }
}

