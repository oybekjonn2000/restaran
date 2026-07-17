import { Component, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { OrderService } from '../../../core/services/order.service';
import { Order, ORDER_STATUS_LABELS, OrderStatus } from '../../../core/models/order.model';
import { BodyPortalDirective } from '../../../core/directives/body-portal.directive';
import { Restaurant } from '../../../core/models/restaurant.model';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-manager-orders',
  standalone: true,
  imports: [CommonModule, FormsModule, MatProgressSpinnerModule, BodyPortalDirective, RouterLink],
  template: `
    <div class="manager-orders-page animate-in">
      
      <!-- HEADER SECTION -->
      <div class="orders-header-premium">
        <div class="header-left-side">
          <h2 class="page-title">📋 Buyurtmalar boshqaruvi</h2>
          <p class="page-subtitle">Restoran buyurtmalarining to'liq ro'yxati va real-vaqtda boshqaruv oynasi</p>
        </div>
        
        <div class="header-search-side">
          <div class="search-bar-wrap">
            <span class="search-icon">🔍</span>
            <input 
              type="text" 
              [ngModel]="searchQuery()" 
              (ngModelChange)="searchQuery.set($event); currentPage.set(1)" 
              placeholder="Buyurtma ID, mijoz yoki taom..." 
              class="search-input">
          </div>
        </div>
      </div>

      <!-- MAIN ORDERS SECTION -->
      <div class="orders-section-premium">
        <div class="orders-filter-bar">
          <div class="filter-tabs">
            <button class="tab-btn" [class.active]="statusFilter() === 'ALL'" (click)="statusFilter.set('ALL'); currentPage.set(1)">Barchasi</button>
            <button class="tab-btn" [class.active]="statusFilter() === 'PENDING'" (click)="statusFilter.set('PENDING'); currentPage.set(1)">Yangi</button>
            <button class="tab-btn" [class.active]="statusFilter() === 'PREPARING'" (click)="statusFilter.set('PREPARING'); currentPage.set(1)">Tayyorlash</button>
            <button class="tab-btn" [class.active]="statusFilter() === 'DELIVERING'" (click)="statusFilter.set('DELIVERING'); currentPage.set(1)">Yetkazishda</button>
            <button class="tab-btn" [class.active]="statusFilter() === 'DELIVERED'" (click)="statusFilter.set('DELIVERED'); currentPage.set(1)">Yakunlangan</button>
            <button class="tab-btn" [class.active]="statusFilter() === 'CANCELED'" (click)="statusFilter.set('CANCELED'); currentPage.set(1)">Bekor qilingan</button>
          </div>
        </div>

        @if (loading()) {
          <div class="loading-state">
            <mat-spinner diameter="40" color="accent"></mat-spinner>
            <p>Buyurtmalar yuklanmoqda...</p>
          </div>
        } @else {
          <div class="table-wrap-premium">
            <table class="data-table-premium">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Mijoz</th>
                  <th>Taomlar</th>
                  <th>Jami Narx</th>
                  <th>Masofa</th>
                  <th>Kuryer to'lovi</th>
                  <th>Holat</th>
                  <th>Amallar</th>
                </tr>
              </thead>
              <tbody>
                @for (order of paginatedOrders(); track order.id) {
                  <tr [id]="'order-row-' + order.id" [class.row-updating]="updatingId() === order.id">
                    <td class="col-id" data-label="ID"><strong>#{{ order.id }}</strong></td>
                    <td class="col-client" data-label="Mijoz">
                      <div class="client-info-cell">
                        <span class="client-name">{{ order.user.name }}</span>
                        <span class="client-phone">📞 {{ order.user.phone || 'Tel kiritilmagan' }}</span>
                        @if (order.deliveryProvider === 'YANDEX' || order.yandexDelivery) {
                          <div style="margin-top: 6px; padding: 6px 10px; background: rgba(245,158,11,0.12); border: 1px solid rgba(245,158,11,0.3); border-radius: 8px; color: #fde68a; font-size: 0.72rem; font-weight: 600; line-height: 1.3; text-align: left;">
                            ⚠️ Ushbu buyurtma Yandex Delivery orqali yetkaziladi. Iltimos, Yandex Delivery xizmatini chaqiring.
                          </div>
                        }

                        <!-- Client Address & GPS Block -->
                        <div class="location-details-block" style="margin-top: 10px; padding: 10px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; text-align: left;">
                          <div style="font-weight: 600; font-size: 0.8rem; color: #94a3b8; margin-bottom: 6px; display: flex; align-items: center; gap: 4px;">
                            <span>📍</span> Mijoz manzili
                          </div>
                          <div style="font-size: 0.8rem; color: #fff; margin-bottom: 6px; line-height: 1.4;">
                            <strong>Manzil:</strong> {{ order.customerAddress || order.deliveryAddress || 'Kiritilmagan' }}
                          </div>
                          @if (order.customerLatitude && order.customerLongitude) {
                            <div style="font-size: 0.76rem; color: #94a3b8; margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center; background: rgba(0,0,0,0.2); padding: 4px 8px; border-radius: 6px;">
                              <span><strong>Koordinatalar:</strong> {{ order.customerLatitude }}, {{ order.customerLongitude }}</span>
                              <button (click)="copyToClipboard(order.customerLatitude + ', ' + order.customerLongitude)" 
                                      style="background: transparent; border: none; color: #f97316; font-size: 0.72rem; cursor: pointer; font-weight: 600; padding: 2px 6px; border-radius: 4px; transition: all 0.2s;"
                                      onmouseover="this.style.background='rgba(249,115,22,0.1)'"
                                      onmouseout="this.style.background='transparent'">
                                📋 Nusxalash
                              </button>
                            </div>
                            <div style="display: flex; gap: 8px;">
                              <a [href]="'https://yandex.uz/maps/?pt=' + order.customerLongitude + ',' + order.customerLatitude + '&z=17&l=map'" 
                                 target="_blank" 
                                 style="flex: 1; display: inline-flex; align-items: center; justify-content: center; gap: 6px; padding: 6px; background: #f59e0b; color: #000; font-size: 0.72rem; font-weight: 700; text-decoration: none; border-radius: 6px; text-align: center; transition: background 0.2s;"
                                 onmouseover="this.style.background='#d97706'"
                                 onmouseout="this.style.background='#f59e0b'">
                                🔗 Yandex Maps
                              </a>
                              <a [href]="'https://www.google.com/maps/search/?api=1&query=' + order.customerLatitude + ',' + order.customerLongitude" 
                                 target="_blank" 
                                 style="flex: 1; display: inline-flex; align-items: center; justify-content: center; gap: 6px; padding: 6px; background: rgba(255,255,255,0.1); color: #fff; font-size: 0.72rem; font-weight: 600; text-decoration: none; border-radius: 6px; text-align: center; transition: background 0.2s;"
                                 onmouseover="this.style.background='rgba(255,255,255,0.15)'"
                                 onmouseout="this.style.background='rgba(255,255,255,0.1)'">
                                🔗 Google Maps
                              </a>
                            </div>
                          } @else {
                            <div style="font-size: 0.76rem; color: #ef4444; font-weight: 500;">
                              Joylashuv mavjud emas
                            </div>
                          }
                        </div>
                      </div>
                    </td>
                    <td class="col-foods" data-label="Taomlar">
                      <div class="food-list-cell">
                        @for (item of order.items; track item.id) {
                          <div class="food-item-badge">
                            🍔 {{ item.food.name }} <strong class="qty">x{{ item.quantity }}</strong>
                          </div>
                        }
                      </div>
                    </td>
                    <td class="col-price" data-label="Jami Narx">
                      <div class="price-info-cell">
                        <strong class="total-price">{{ (order.totalPrice + (order.deliveryFee || 0)) | number:'1.0-0' }} so'm</strong>
                        <span class="delivery-fee-sub">(Yetkazish: {{ order.deliveryFee | number:'1.0-0' }} so'm)</span>
                        <div class="payment-method-badge" style="font-size: 0.72rem; margin-top: 4px; font-weight: 600; display: inline-block; padding: 2px 6px; border-radius: 4px;"
                              [style.background]="order.paymentMethod === 'CARD' ? 'rgba(16,185,129,0.15)' : 'rgba(249,115,22,0.15)'"
                              [style.color]="order.paymentMethod === 'CARD' ? '#10b981' : '#f97316'">
                          {{ order.paymentMethod === 'CARD' ? '💳 Karta' : '💵 Naqd pul' }}
                        </div>
                      </div>
                    </td>
                    <td class="col-distance" data-label="Masofa">{{ (order.deliveryDistanceKm || order.distance || 0) | number:'1.1-2' }} km</td>
                    <td class="col-courier" data-label="Kuryer to'lovi">
                      @if (order.deliveryProvider === 'YANDEX' || order.yandexDelivery) {
                        <div class="courier-pill" style="background: rgba(245,158,11,0.12); color: #f59e0b; border: 1px solid rgba(245,158,11,0.25); padding: 4px 8px; border-radius: 8px; font-weight: 700; font-size: 0.72rem; text-transform: uppercase;">🟨 Yandex Delivery</div>
                      } @else if (order.courier) {
                        <div class="courier-pill">🏍️ {{ order.courier.name }}</div>
                        <div class="courier-fees">
                          <div>Baza: {{ order.baseFee || 9000 | number:'1.0-0' }} so'm</div>
                          <div>Jami: {{ order.totalEarning || 0 | number:'1.0-0' }} so'm</div>
                        </div>
                      } @else {
                        <span class="unassigned-text">Tayinlanmagan</span>
                      }
                    </td>
                    <td class="col-status" data-label="Holat">
                      <span class="status-badge-new" [class]="'badge-' + order.status.toLowerCase()">
                        {{ getStatusLabel(order.status) }}
                      </span>
                    </td>
                    <td class="col-actions" data-label="Amallar">
                      <div class="action-buttons-wrap">
                        @if (order.status === 'DELIVERED') {
                          <span class="status-done-new">✅ Topshirildi</span>
                        } @else if (order.status === 'CANCELED') {
                          <span class="status-canceled-new">🚫 Bekor qilindi</span>
                        }

                        <!-- YANDEX ACTION BUTTONS FLOW -->
                        @else if (order.deliveryProvider === 'YANDEX' || order.status === 'TRANSFERRED_TO_YANDEX' || order.status === 'YANDEX_COURIER_CALLED' || order.status === 'READY' || order.status === 'YANDEX_COURIER_PICKED_UP') {
                          @if (order.status === 'TRANSFERRED_TO_YANDEX') {
                            <button class="act-btn-new act-courier" (click)="changeStatus(order.id, 'YANDEX_COURIER_CALLED')" [disabled]="updatingId() === order.id" style="background: #f59e0b; color: white;">
                              🚕 Yandex Delivery chaqirish
                            </button>
                          } @else if (order.status === 'YANDEX_COURIER_CALLED') {
                            <button class="act-btn-new act-prepare" (click)="changeStatus(order.id, 'PREPARING')" [disabled]="updatingId() === order.id">
                              🍳 Tayyorlashni boshlash
                            </button>
                          } @else if (order.status === 'PREPARING') {
                            <button class="act-btn-new act-ready" (click)="markReady(order.id)" [disabled]="updatingId() === order.id">
                              ✅ Tayyor
                            </button>
                          } @else if (order.status === 'READY') {
                            <button class="act-btn-new act-courier" (click)="changeStatus(order.id, 'YANDEX_COURIER_PICKED_UP')" [disabled]="updatingId() === order.id" style="background: #3b82f6; color: white;">
                              📦 Yandexga berildi
                            </button>
                          } @else if (order.status === 'YANDEX_COURIER_PICKED_UP') {
                            <button class="act-btn-new act-ready" (click)="changeStatus(order.id, 'DELIVERED')" [disabled]="updatingId() === order.id">
                              ✔ Buyurtmani yakunlash
                            </button>
                          }
                          <button class="act-btn-new act-cancel" (click)="confirmCancel(order)" [disabled]="updatingId() === order.id" style="margin-top: 4px; width: fit-content;">
                            ✕ Bekor
                          </button>
                        }

                        @else if (order.status === 'PENDING') {
                          <button class="act-btn-new act-prepare" (click)="changeStatus(order.id, 'PREPARING')" [disabled]="updatingId() === order.id">
                            🍳 Tayyorlash
                          </button>
                          <button class="act-btn-new act-cancel" (click)="confirmCancel(order)" [disabled]="updatingId() === order.id">
                            ✕ Bekor
                          </button>
                        }

                        @else if (order.status === 'PREPARING') {
                          @if (!order.isReady) {
                            <button class="act-btn-new act-ready" (click)="markReady(order.id)" [disabled]="updatingId() === order.id">
                              ✅ Tayyor
                            </button>
                          } @else {
                            <span class="cooking-label">🍳 Taom tayyor</span>
                          }
                          <button class="act-btn-new act-cancel" (click)="confirmCancel(order)" [disabled]="updatingId() === order.id">
                            ✕ Bekor
                          </button>
                        }

                        @else if (order.status === 'COURIER_ACCEPTED' || order.status === 'COURIER_AT_RESTAURANT') {
                          @if (!order.isReady) {
                            <button class="act-btn-new act-ready" (click)="markReady(order.id)" [disabled]="updatingId() === order.id">
                              ✅ Tayyor
                            </button>
                          } @else {
                            @if (order.courier && order.courierActiveOnShift) {
                              <span class="cooking-label">✅ Kuryerda</span>
                            } @else {
                              <button class="act-btn-new act-courier" (click)="changeStatus(order.id, 'DELIVERING')" [disabled]="updatingId() === order.id">
                                🏍️ Yo'lga chiqdi
                              </button>
                            }
                          }
                          <button class="act-btn-new act-cancel" (click)="confirmCancel(order)" [disabled]="updatingId() === order.id">
                            ✕ Bekor
                          </button>
                        }

                        @else if (order.status === 'DELIVERING' || order.status === 'COURIER_AT_CLIENT') {
                          @if (order.courier && order.courierActiveOnShift) {
                            <span class="transit-label">🚴 Yo'lda...</span>
                          } @else {
                            <button class="act-btn-new act-ready" (click)="changeStatus(order.id, 'DELIVERED')" [disabled]="updatingId() === order.id">
                              ✅ Topshirildi
                            </button>
                          }
                          <button class="act-btn-new act-cancel" (click)="confirmCancel(order)" [disabled]="updatingId() === order.id">
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

          @if (filteredOrders().length === 0) {
            <div class="empty-state-new">
              <div class="empty-icon">🍳</div>
              <h3>Mos buyurtmalar topilmadi</h3>
              <p>Qidiruv shartlarini o'zgartirib ko'ring</p>
            </div>
          } @else {
            <!-- PAGINATION CONTROLS -->
            <div class="pagination-wrap">
              <span class="pagination-info">
                Jami {{ filteredOrders().length }} ta buyurtmadan {{ (currentPage() - 1) * pageSize + 1 }}-{{ Math.min(currentPage() * pageSize, filteredOrders().length) }} ko'rsatilmoqda
              </span>
              <div class="pagination-buttons">
                <button 
                  class="pag-btn" 
                  [disabled]="currentPage() === 1" 
                  (click)="currentPage.set(currentPage() - 1)">
                  ← Avvalgi
                </button>
                <span class="pag-current">Sahifa {{ currentPage() }} / {{ totalPages() }}</span>
                <button 
                  class="pag-btn" 
                  [disabled]="currentPage() >= totalPages()" 
                  (click)="currentPage.set(currentPage() + 1)">
                  Keyingi →
                </button>
              </div>
            </div>
          }
        }
      </div>

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

      <!-- Toast Notification -->
      @if (toast()) {
        <div class="toast-bar" [class.toast-success]="toast()!.type === 'success'" [class.toast-error]="toast()!.type === 'error'">
          {{ toast()!.message }}
        </div>
      }
    </div>
  `,
  styles: [`
    .manager-orders-page {
      color: #f1f5f9;
      font-family: 'Poppins', sans-serif;
    }

    .orders-header-premium {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
      gap: 16px;
      flex-wrap: wrap;
    }

    .page-title {
      font-size: 1.5rem;
      font-weight: 800;
      color: #fff;
      margin: 0 0 4px;
    }

    .page-subtitle {
      font-size: 0.85rem;
      color: #94a3b8;
      margin: 0;
    }

    .header-search-side {
      flex: 1;
      max-width: 360px;
    }

    .search-bar-wrap {
      display: flex;
      align-items: center;
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 12px;
      padding: 0 14px;
      transition: all 0.2s ease;
    }

    .search-bar-wrap:focus-within {
      border-color: #f97316;
      box-shadow: 0 0 0 3px rgba(249, 115, 22, 0.15);
    }

    .search-icon {
      font-size: 0.9rem;
      color: #94a3b8;
      margin-right: 8px;
    }

    .search-input {
      width: 100%;
      background: transparent;
      border: none;
      padding: 10px 0;
      font-size: 0.88rem;
      color: #f1f5f9;
      outline: none;
    }

    /* FILTERS & TABS */
    .orders-section-premium {
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 20px;
      padding: 24px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
    }

    .orders-filter-bar {
      margin-bottom: 20px;
      border-bottom: 1px solid #334155;
      padding-bottom: 16px;
    }

    .filter-tabs {
      display: flex;
      gap: 8px;
      overflow-x: auto;
      padding-bottom: 4px;
    }

    .tab-btn {
      background: transparent;
      border: 1px solid #334155;
      color: #cbd5e1;
      padding: 8px 16px;
      border-radius: 10px;
      font-size: 0.82rem;
      font-weight: 600;
      cursor: pointer;
      white-space: nowrap;
      transition: all 0.2s ease;
    }

    .tab-btn:hover {
      background: rgba(255, 255, 255, 0.02);
      border-color: #475569;
    }

    .tab-btn.active {
      background: #f97316;
      border-color: #f97316;
      color: #fff;
      box-shadow: 0 4px 12px rgba(249, 115, 22, 0.25);
    }

    /* TABLE */
    .table-wrap-premium {
      overflow-x: auto;
    }

    .data-table-premium {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
    }

    .data-table-premium th {
      padding: 14px 16px;
      font-size: 0.76rem;
      font-weight: 700;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      border-bottom: 1px solid #334155;
    }

    .data-table-premium tr {
      border-bottom: 1px solid #334155;
      transition: background-color 0.2s;
    }

    .data-table-premium tr:hover {
      background: rgba(255, 255, 255, 0.01);
    }

    .data-table-premium td {
      padding: 16px;
      font-size: 0.88rem;
      color: #cbd5e1;
      vertical-align: top;
    }

    .col-id { width: 80px; }
    .col-client { min-width: 260px; }
    .col-foods { min-width: 220px; }
    .col-price { min-width: 160px; }
    .col-distance { width: 100px; }
    .col-courier { min-width: 160px; }
    .col-status { width: 150px; }
    .col-actions { min-width: 180px; }

    /* BADGES & PILLS */
    .food-list-cell {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .food-item-badge {
      display: inline-flex;
      align-items: center;
      background: #0f172a;
      border: 1px solid #334155;
      border-radius: 8px;
      padding: 4px 10px;
      font-size: 0.8rem;
      color: #fff;
      width: fit-content;
    }

    .food-item-badge .qty {
      color: #f97316;
      margin-left: 6px;
    }

    .price-info-cell {
      display: flex;
      flex-direction: column;
    }

    .total-price {
      color: #fff;
      font-size: 0.95rem;
    }

    .delivery-fee-sub {
      font-size: 0.74rem;
      color: #64748b;
      margin-top: 2px;
    }

    .courier-pill {
      display: inline-block;
      background: rgba(249, 115, 22, 0.1);
      color: #f97316;
      border: 1px solid rgba(249, 115, 22, 0.2);
      border-radius: 6px;
      padding: 2px 8px;
      font-size: 0.76rem;
      font-weight: 600;
    }

    .courier-fees {
      font-size: 0.72rem;
      color: #64748b;
      margin-top: 4px;
      line-height: 1.4;
    }

    .unassigned-text {
      color: #64748b;
      font-size: 0.8rem;
      font-style: italic;
    }

    .status-badge-new {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 8px;
      font-size: 0.76rem;
      font-weight: 700;
      text-transform: uppercase;
    }

    .badge-pending { background: rgba(245, 158, 11, 0.12); color: #f59e0b; border: 1px solid rgba(245,158,11,0.2); }
    .badge-preparing { background: rgba(139, 92, 246, 0.12); color: #8b5cf6; border: 1px solid rgba(139,92,246,0.2); }
    .badge-courier_accepted { background: rgba(59, 130, 246, 0.12); color: #3b82f6; border: 1px solid rgba(59,130,246,0.2); }
    .badge-courier_at_restaurant { background: rgba(16, 185, 129, 0.12); color: #10b981; border: 1px solid rgba(16,185,129,0.2); }
    .badge-delivering { background: rgba(59, 130, 246, 0.15); color: #3b82f6; border: 1px solid rgba(59,130,246,0.25); }
    .badge-courier_at_client { background: rgba(236, 72, 153, 0.12); color: #ec4899; border: 1px solid rgba(236,72,153,0.2); }
    .badge-delivered { background: rgba(16, 185, 129, 0.12); color: #10b981; border: 1px solid rgba(16,185,129,0.2); }
    .badge-canceled { background: rgba(239, 68, 68, 0.12); color: #ef4444; border: 1px solid rgba(239,68,68,0.2); }
    .badge-transferred_to_yandex { background: rgba(245, 158, 11, 0.12); color: #f59e0b; border: 1px solid rgba(245,158,11,0.2); }
    .badge-yandex_courier_called { background: rgba(59, 130, 246, 0.12); color: #3b82f6; border: 1px solid rgba(59,130,246,0.2); }
    .badge-ready { background: rgba(16, 185, 129, 0.12); color: #10b981; border: 1px solid rgba(16,185,129,0.2); }
    .badge-yandex_courier_picked_up { background: rgba(6, 182, 212, 0.12); color: #06b6d4; border: 1px solid rgba(6,182,212,0.2); }

    .action-buttons-wrap {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .act-btn-new {
      border: 1px solid #334155;
      background: #1e293b;
      color: #cbd5e1;
      padding: 8px 12px;
      border-radius: 8px;
      font-size: 0.8rem;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s ease;
      white-space: nowrap;
    }

    .act-btn-new:hover:not(:disabled) {
      transform: translateY(-1px);
    }

    .act-prepare {
      background: rgba(249, 115, 22, 0.12);
      border-color: rgba(249, 115, 22, 0.35);
      color: #f97316;
    }
    .act-prepare:hover:not(:disabled) {
      background: #f97316;
      color: #fff;
      box-shadow: 0 4px 12px rgba(249, 115, 22, 0.25);
    }

    .act-ready {
      background: rgba(16, 185, 129, 0.12);
      border-color: rgba(16, 185, 129, 0.35);
      color: #10b981;
    }
    .act-ready:hover:not(:disabled) {
      background: #10b981;
      color: #fff;
      box-shadow: 0 4px 12px rgba(16, 185, 129, 0.25);
    }

    .act-courier {
      background: rgba(59, 130, 246, 0.12);
      border-color: rgba(59, 130, 246, 0.35);
      color: #3b82f6;
    }
    .act-courier:hover:not(:disabled) {
      background: #3b82f6;
      color: #fff;
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.25);
    }

    .act-cancel {
      background: rgba(239, 68, 68, 0.08);
      border-color: rgba(239, 68, 68, 0.25);
      color: #ef4444;
    }
    .act-cancel:hover:not(:disabled) {
      background: #ef4444;
      color: #fff;
      box-shadow: 0 4px 12px rgba(239, 68, 68, 0.25);
    }

    .cooking-label { color: #8b5cf6; font-weight: 600; font-size: 0.8rem; font-style: italic; }
    .transit-label { color: #3b82f6; font-weight: 600; font-size: 0.8rem; font-style: italic; }
    .status-done-new { color: #10b981; font-weight: 700; font-size: 0.8rem; }
    .status-canceled-new { color: #64748b; font-weight: 700; font-size: 0.8rem; }

    /* PAGINATION */
    .pagination-wrap {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 12px;
      margin-top: 20px;
      padding-top: 16px;
      border-top: 1px solid #334155;
    }
    .pagination-info {
      font-size: 0.8rem;
      color: #94a3b8;
    }
    .pagination-buttons {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .pag-btn {
      background: #1e293b;
      border: 1px solid #334155;
      color: #cbd5e1;
      padding: 6px 14px;
      border-radius: 8px;
      font-size: 0.8rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }
    .pag-btn:hover:not(:disabled) {
      border-color: #f97316;
      color: #fff;
    }
    .pag-btn:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }
    .pag-current {
      font-size: 0.8rem;
      color: #fff;
      font-weight: 600;
    }

    /* MODALS & GENERAL LOADING */
    .loading-state {
      padding: 60px 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
      color: #94a3b8;
    }
    .empty-state-new {
      padding: 60px 20px;
      text-align: center;
      color: #94a3b8;
    }
    .empty-icon {
      font-size: 2.2rem;
      margin-bottom: 12px;
    }

    .modal-overlay {
      position: fixed; inset: 0; background: rgba(0,0,0,0.6);
      display: flex; align-items: center; justify-content: center; z-index: 9999;
      backdrop-filter: blur(6px);
    }
    .modal-card {
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 20px;
      padding: 32px 24px;
      max-width: 440px; width: 90%;
      text-align: center;
      display: flex; flex-direction: column;
      box-shadow: 0 10px 40px rgba(0,0,0,0.6);
    }
    .modal-icon { font-size: 2.5rem; margin-bottom: 12px; }
    .modal-title { font-size: 1.25rem; font-weight: 800; color: #fff; margin: 0 0 8px; }
    .modal-desc { font-size: 0.88rem; color: #cbd5e1; margin: 0 0 20px; }
    .modal-reason-block { text-align: left; margin-bottom: 24px; }
    .reason-label { font-size: 0.78rem; font-weight: 700; color: #94a3b8; display: block; margin-bottom: 8px; }
    .reason-input-premium {
      width: 100%;
      background: #0f172a;
      border: 1px solid #334155;
      border-radius: 10px;
      padding: 12px 14px;
      color: #fff;
      font-size: 0.88rem;
      box-sizing: border-box;
      outline: none;
      transition: border-color 0.2s;
    }
    .reason-input-premium:focus { border-color: #ef4444; }
    .modal-buttons-row { display: flex; gap: 12px; justify-content: center; }
    .modal-btn {
      padding: 10px 20px;
      border-radius: 10px;
      font-size: 0.88rem;
      font-weight: 700;
      border: none;
      cursor: pointer;
      transition: all 0.2s;
    }
    .btn-back { background: transparent; color: #94a3b8; border: 1px solid #334155; }
    .btn-back:hover { background: rgba(255,255,255,0.02); }
    .btn-cancel-confirm { background: #ef4444; color: #fff; }
    .btn-cancel-confirm:hover:not(:disabled) { background: #dc2626; box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3); }

    .toast-bar {
      position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%);
      padding: 12px 24px; border-radius: 12px; font-weight: 700; font-size: 0.88rem;
      z-index: 9999; animation: slideInUp 0.2s ease-out;
      box-shadow: 0 8px 30px rgba(0,0,0,0.35);
    }
    .toast-success { background: #10b981; color: #fff; }
    .toast-error { background: #ef4444; color: #fff; }

    .animate-pop { animation: popScale 0.25s cubic-bezier(0.34, 1.56, 0.64, 1) both; }
    @keyframes popScale { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
    @keyframes slideInUp { from { transform: translateX(-50%) translateY(20px); opacity: 0; } to { transform: translateX(-50%) translateY(0); opacity: 1; } }

    /* RESPONSIVE DESIGN */
    @media (max-width: 768px) {
      .orders-header-premium {
        flex-direction: column;
        align-items: stretch;
        gap: 12px;
      }
      .header-search-side {
        max-width: 100%;
      }

      .data-table-premium, .data-table-premium thead, .data-table-premium tbody, .data-table-premium th, .data-table-premium td, .data-table-premium tr { display: block; }
      .data-table-premium thead { display: none; }
      .data-table-premium tr {
        border: 1px solid #334155; border-radius: 12px;
        padding: 12px; margin-bottom: 12px; background: rgba(255,255,255,0.01);
      }
      .data-table-premium td {
        border: none; padding: 10px 0; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px dashed rgba(255,255,255,0.05); gap: 12px; text-align: right;
      }
      .data-table-premium td::before {
        content: attr(data-label); font-weight: 700; color: #94a3b8; font-size: 0.78rem; text-transform: uppercase; text-align: left;
      }
      .data-table-premium td:last-child { border-bottom: none; }
      .col-client, .col-foods, .col-price, .col-courier, .col-status, .col-actions { width: 100% !important; min-width: 0 !important; }
      
      .client-info-cell {
        width: 100%;
      }
      
      .location-details-block {
        width: 100%;
        box-sizing: border-box;
      }

      .action-buttons-wrap {
        width: 100%;
        align-items: flex-end;
      }
      
      .act-btn-new {
        width: fit-content;
      }
    }
  `]
})
export class ManagerOrdersComponent implements OnInit, OnDestroy {
  orders = signal<Order[]>([]);
  loading = signal(true);
  updatingId = signal<number | null>(null);

  // Filters & Search
  statusFilter = signal<string>('ALL');
  searchQuery = signal<string>('');
  currentPage = signal<number>(1);
  pageSize = 10;

  // Cancel flow
  cancelTarget = signal<Order | null>(null);
  cancelReason = '';

  // Toast notifier
  toast = signal<{ message: string; type: 'success' | 'error' } | null>(null);
  private toastTimer: any;
  private pollInterval: any;

  constructor(
    private orderService: OrderService,
    public auth: AuthService
  ) {}

  ngOnInit(): void {
    this.load(true);
    // Poll orders every 5 seconds to keep data live
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
      error: () => {
        if (showLoader) this.loading.set(false);
      }
    });
  }

  // Filters & Pagination
  filteredOrders = computed(() => {
    let list = this.orders();
    const query = this.searchQuery().toLowerCase().trim();
    const filter = this.statusFilter();

    if (filter !== 'ALL') {
      if (filter === 'PENDING') {
        list = list.filter(o => o.status === 'PENDING' || o.status === 'TRANSFERRED_TO_YANDEX' || o.status === 'YANDEX_COURIER_CALLED');
      } else if (filter === 'PREPARING') {
        list = list.filter(o => o.status === 'PREPARING' || o.status === 'READY');
      } else if (filter === 'DELIVERING') {
        list = list.filter(o => o.status === 'DELIVERING' || o.status === 'COURIER_AT_CLIENT' || o.status === 'YANDEX_COURIER_PICKED_UP' || o.status === 'COURIER_ACCEPTED' || o.status === 'COURIER_AT_RESTAURANT');
      } else {
        list = list.filter(o => o.status === filter);
      }
    }

    if (query) {
      list = list.filter(o => 
        o.id.toString().includes(query) || 
        o.user.name.toLowerCase().includes(query) ||
        o.items.some(i => i.food.name.toLowerCase().includes(query))
      );
    }

    return list;
  });

  paginatedOrders = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize;
    const end = start + this.pageSize;
    return this.filteredOrders().slice(start, end);
  });

  totalPages = computed(() => {
    return Math.max(1, Math.ceil(this.filteredOrders().length / this.pageSize));
  });

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

  copyToClipboard(text: string): void {
    navigator.clipboard.writeText(text).then(() => {
      this.showToast('📋 Koordinatalar nusxalandi', 'success');
    }).catch(() => {
      this.showToast('❌ Nusxalab bo\'lmadi', 'error');
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

  // Math Helper for template
  Math = Math;
}
