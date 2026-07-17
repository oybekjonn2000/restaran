import { Component, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { OrderService } from '../../../core/services/order.service';
import { Order, ORDER_STATUS_LABELS, OrderStatus } from '../../../core/models/order.model';
import { BodyPortalDirective } from '../../../core/directives/body-portal.directive';
import { Restaurant } from '../../../core/models/restaurant.model';
import { Chart } from 'chart.js/auto';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

const ALL_STATUSES: OrderStatus[] = ['PENDING','PREPARING','COURIER_ACCEPTED','COURIER_AT_RESTAURANT','DELIVERING','COURIER_AT_CLIENT','DELIVERED','CANCELED'];

@Component({
  selector: 'app-manager-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, MatProgressSpinnerModule, BodyPortalDirective, RouterLink],
  template: `
    <div class="manager-dashboard-page animate-in">
      
      <!-- STICKY HEADER -->
      <header class="dashboard-header-premium">
        <div class="header-left">
          <div class="restaurant-badge-logo">
            <span class="logo-emoji">🏪</span>
            <div class="restaurant-name-wrap">
              <span class="restaurant-title">{{ restaurant()?.name || 'Oshxona Paneli' }}</span>
              <span class="restaurant-subtitle">Restoran boshqaruvi</span>
            </div>
          </div>
        </div>

        <div class="header-search">
          <div class="search-bar-wrap">
            <span class="search-icon">🔍</span>
            <input 
              type="text" 
              [ngModel]="searchQuery()" 
              (ngModelChange)="searchQuery.set($event); currentPage.set(1)" 
              placeholder="ID, mijoz ismi yoki taom..." 
              class="search-input">
          </div>
        </div>

        <div class="header-right">
          <!-- Notification Bell -->
          <div class="bell-container" (click)="showNotifications.set(!showNotifications()); $event.stopPropagation()">
            <button class="bell-btn">
              🔔
              @if (notifications().length > 0) {
                <span class="bell-badge">{{ notifications().length }}</span>
              }
            </button>
            @if (showNotifications()) {
              <div class="notifications-dropdown animate-pop">
                <div class="dropdown-header" style="display: flex; justify-content: space-between; align-items: center;">
                  <span>Bildirishnomalar</span>
                  @if (notifications().length > 0) {
                    <button (click)="clearNotifications($event)" style="background: transparent; border: none; color: #f97316; font-size: 0.72rem; font-weight: 700; cursor: pointer; padding: 2px 6px; border-radius: 4px; transition: all 0.2s;" onmouseover="this.style.color='#ea580c'; this.style.background='rgba(249,115,22,0.1)'" onmouseout="this.style.color='#f97316'; this.style.background='transparent'">
                      Tozalash
                    </button>
                  }
                </div>
                <div class="dropdown-list">
                  @if (notifications().length === 0) {
                    <div style="padding: 24px 16px; text-align: center; color: #64748b; font-size: 0.8rem; display: flex; flex-direction: column; align-items: center; gap: 6px;">
                      <span style="font-size: 1.5rem;">📭</span>
                      <span>Bildirishnomalar mavjud emas</span>
                    </div>
                  } @else {
                    @for (n of notifications(); track n) {
                      <div class="notification-item">🔔 {{ n }}</div>
                    }
                  }
                </div>
              </div>
            }
          </div>

          <!-- Profile Menu -->
          <div class="profile-container" (click)="showUserMenu.set(!showUserMenu()); $event.stopPropagation()">
            <div class="profile-avatar">
              {{ (restaurant()?.name ? restaurant()?.name?.substring(0, 1) : 'M') }}
            </div>
            @if (showUserMenu()) {
              <div class="profile-dropdown animate-pop">
                <div class="dropdown-header">Profil Sozlamalari</div>
                <a routerLink="/manager/profile" class="dropdown-link">⚙️ Restoran Sozlamalari</a>
                <button (click)="load(true)" class="dropdown-link text-left" style="width: 100%">🔄 Ma'lumotlarni yangilash</button>
              </div>
            }
          </div>
        </div>
      </header>

      <!-- HERO BANNER -->
      <section class="hero-banner-premium">
        <div class="hero-background-effects">
          <div class="bg-blur-circle c1"></div>
          <div class="bg-blur-circle c2"></div>
        </div>
        <div class="hero-content">
          <div class="hero-text-side">
            <span class="hero-tag">2026 Dashboard v3.0</span>
            <h2 class="hero-main-title">Bugungi Boshqaruv Markazi</h2>
            <p class="hero-desc">{{ restaurant()?.address || 'Sizning faol restoraningiz boshqaruv va oshxona paneli.' }}</p>
          </div>
          <div class="hero-stats-side">
            <div class="hero-stat-box">
              <span class="stat-num">{{ activeOrdersCount() }}</span>
              <span class="stat-lbl">Faol buyurtmalar</span>
            </div>
            <div class="hero-stat-box">
              <span class="stat-num">{{ totalRevenue() | number:'1.0-0' }}</span>
              <span class="stat-lbl">Bugungi daromad (so'm)</span>
            </div>
          </div>
        </div>
      </section>

      <!-- STATISTIK GRID -->
      <div class="metrics-grid-premium">
        <div class="metric-card-new gradient-orange">
          <div class="card-inner">
            <div class="card-info">
              <span class="metric-lbl">Yangi Buyurtmalar</span>
              <h3 class="metric-val">{{ pendingOrders().length }} ta</h3>
              <p class="metric-desc">Tasdiqlash kutilmoqda</p>
            </div>
            <div class="card-icon-wrap">⏳</div>
          </div>
        </div>

        <div class="metric-card-new gradient-purple">
          <div class="card-inner">
            <div class="card-info">
              <span class="metric-lbl">Tayyorlanmoqda</span>
              <h3 class="metric-val">{{ activePrepOrders().length }} ta</h3>
              <p class="metric-desc">Oshxonada band</p>
            </div>
            <div class="card-icon-wrap">🍳</div>
          </div>
        </div>

        <div class="metric-card-new gradient-green">
          <div class="card-inner">
            <div class="card-info">
              <span class="metric-lbl">Yetkazilganlar</span>
              <h3 class="metric-val">{{ completedCount() }} ta</h3>
              <p class="metric-desc">Bugun yakunlangan</p>
            </div>
            <div class="card-icon-wrap">✅</div>
          </div>
        </div>

        <div class="metric-card-new gradient-red">
          <div class="card-inner">
            <div class="card-info">
              <span class="metric-lbl">Bekor qilinganlar</span>
              <h3 class="metric-val">{{ canceledCount() }} ta</h3>
              <p class="metric-desc">Bugun bekor bo'lgan</p>
            </div>
            <div class="card-icon-wrap">🚫</div>
          </div>
        </div>

        <div class="metric-card-new gradient-blue">
          <div class="card-inner">
            <div class="card-info">
              <span class="metric-lbl">Bugungi Daromad</span>
              <h3 class="metric-val">{{ totalRevenue() | number:'1.0-0' }} so'm</h3>
              <p class="metric-desc">Aylanma ayni paytda</p>
            </div>
            <div class="card-icon-wrap">💰</div>
          </div>
        </div>

        <div class="metric-card-new gradient-teal">
          <div class="card-inner">
            <div class="card-info">
              <span class="metric-lbl">O'rtacha yetkazish</span>
              <h3 class="metric-val">{{ avgDeliveryTime() }}</h3>
              <p class="metric-desc">Tezlik ko'rsatkichi</p>
            </div>
            <div class="card-icon-wrap">⚡</div>
          </div>
        </div>
      </div>

      <!-- CHARTS SECTION -->
      <section class="charts-section-premium">
        <div class="chart-card-wrap">
          <div class="chart-header">
            <h4>📈 Haftalik Buyurtmalar</h4>
            <span class="chart-subtitle">So'nggi 7 kunlik ko'rsatkichlar</span>
          </div>
          <div class="chart-canvas-container">
            <canvas id="weeklyChart"></canvas>
          </div>
        </div>
        <div class="chart-card-wrap">
          <div class="chart-header">
            <h4>📊 Buyurtmalar Holati</h4>
            <span class="chart-subtitle">Oqim taqsimoti</span>
          </div>
          <div class="chart-canvas-container">
            <canvas id="statusChart"></canvas>
          </div>
        </div>
      </section>

      <!-- PIPELINE PROGRESS BAR -->
      <div class="pipeline-section-premium">
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

      <!-- QUICK ACTIONS -->
      <section class="quick-actions-section">
        <h2 class="section-title">⚡ Tezkor Amallar</h2>
        <div class="quick-actions-grid">
          <div class="action-card" (click)="activeHelpModal.set('yangi-buyurtma')">
            <span class="act-card-icon">➕</span>
            <div class="act-card-text">
              <span class="act-card-title">Yangi buyurtma</span>
              <span class="act-card-desc">Oflayn yoki so'rov</span>
            </div>
          </div>
          <div class="action-card" routerLink="/manager/menu">
            <span class="act-card-icon">🍔</span>
            <div class="act-card-text">
              <span class="act-card-title">Menyuni boshqarish</span>
              <span class="act-card-desc">Taomlarni tahrirlash</span>
            </div>
          </div>
          <div class="action-card" routerLink="/manager/categories">
            <span class="act-card-icon">📁</span>
            <div class="act-card-text">
              <span class="act-card-title">Toifalarni sozlash</span>
              <span class="act-card-desc">Kategoriyalar</span>
            </div>
          </div>
          <div class="action-card" routerLink="/manager/profile">
            <span class="act-card-icon">🏪</span>
            <div class="act-card-text">
              <span class="act-card-title">Restoranni tahrirlash</span>
              <span class="act-card-desc">Profil sozlamalari</span>
            </div>
          </div>
          <div class="action-card" (click)="activeHelpModal.set('kuryerlar')">
            <span class="act-card-icon">🏍️</span>
            <div class="act-card-text">
              <span class="act-card-title">Kuryerlar</span>
              <span class="act-card-desc">Xizmat va to'lovlar</span>
            </div>
          </div>
          <div class="action-card" (click)="activeHelpModal.set('mijozlar')">
            <span class="act-card-icon">👥</span>
            <div class="act-card-text">
              <span class="act-card-title">Mijozlar</span>
              <span class="act-card-desc">Sodiqlik tizimi</span>
            </div>
          </div>
        </div>
      </section>

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
                              🚕 Yandex Delivery chaqirildi
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
                              🚚 Yandex kuryerga topshirildi
                            </button>
                          } @else if (order.status === 'YANDEX_COURIER_PICKED_UP') {
                            <button class="act-btn-new act-ready" (click)="changeStatus(order.id, 'DELIVERED')" [disabled]="updatingId() === order.id">
                              🏁 Buyurtmani yakunlash
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

      <!-- Help info modal -->
      @if (activeHelpModal()) {
        <div class="modal-overlay" appBodyPortal (click)="activeHelpModal.set(null)">
          <div class="modal-card animate-pop" (click)="$event.stopPropagation()">
            <div class="modal-icon">💡</div>
            <h3 class="modal-title">
              @if (activeHelpModal() === 'yangi-buyurtma') { Yangi Buyurtmalar Haqida }
              @else if (activeHelpModal() === 'kuryerlar') { Kuryerlik Xizmati }
              @else if (activeHelpModal() === 'mijozlar') { Mijozlar Ma'lumotlari }
            </h3>
            <p class="modal-desc" style="text-align: left; line-height: 1.5; color: #fff;">
              @if (activeHelpModal() === 'yangi-buyurtma') {
                Sizning restoraningizga buyurtmalar mijozlar tomonidan oziq-ovqat yetkazib berish ilovasi orqali real vaqtda joylashtiriladi. Yangi buyurtma tushganda oshxona panelida avtomatik yangilanadi va bildirishnoma beriladi.
              }
              @else if (activeHelpModal() === 'kuryerlar') {
                Tizimdagi kuryerlar ro'yxati va ularning faolligi haqida ma'lumotlar. Kuryer buyurtmani qabul qilganda kuryer to'lovi va uning masofasi real-vaqtda hisoblanadi va topshirilganda uning balansiga o'tkaziladi.
              }
              @else if (activeHelpModal() === 'mijozlar') {
                Mijozlaringiz haqida qisqacha ma'lumotlar. Buyurtmalar ro'yxatida mijoz ismlari va telefon raqamlari keltirilgan bo'lib, ular bilan bog'lanish va buyurtma holatini yetkazishda foydalanishingiz mumkin.
              }
            </p>
            <div class="modal-buttons-row">
              <button class="modal-btn btn-signin-gradient" (click)="activeHelpModal.set(null)" style="width: auto; padding: 10px 24px;">Tushunarli</button>
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
    .manager-dashboard-page {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 16px 40px 16px;
      color: #f1f5f9;
      font-family: 'Poppins', sans-serif;
    }

    /* STICKY HEADER */
    .dashboard-header-premium {
      position: sticky;
      top: 0;
      background: rgba(15, 23, 42, 0.8);
      backdrop-filter: blur(12px);
      z-index: 1000;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 0;
      margin-bottom: 24px;
      border-bottom: 1px solid #334155;
    }
    .restaurant-badge-logo {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .logo-emoji {
      font-size: 1.8rem;
      background: rgba(249, 115, 22, 0.1);
      border: 1px solid rgba(249, 115, 22, 0.2);
      padding: 6px;
      border-radius: 12px;
    }
    .restaurant-name-wrap {
      display: flex;
      flex-direction: column;
    }
    .restaurant-title {
      font-size: 1.15rem;
      font-weight: 800;
      color: #fff;
    }
    .restaurant-subtitle {
      font-size: 0.72rem;
      color: #94a3b8;
      font-weight: 500;
    }

    .header-search {
      flex: 1;
      max-width: 400px;
      margin: 0 24px;
    }
    .search-bar-wrap {
      position: relative;
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
    .search-input::placeholder {
      color: #475569;
    }

    .header-right {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .bell-container {
      position: relative;
      cursor: pointer;
    }
    .bell-btn {
      width: 40px;
      height: 40px;
      background: #1e293b;
      border: 2px solid #334155;
      color: #fff;
      font-size: 1.1rem;
      border-radius: 50%;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      transition: all 0.2s;
    }
    .bell-btn:hover {
      border-color: #f97316;
      background: rgba(249, 115, 22, 0.08);
      box-shadow: 0 0 10px rgba(249, 115, 22, 0.3);
    }
    .bell-badge {
      position: absolute;
      top: -2px;
      right: -2px;
      background: #ef4444;
      color: #fff;
      font-size: 0.65rem;
      font-weight: 800;
      min-width: 18px;
      height: 18px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      border: 2px solid #0f172a;
      padding: 0;
    }
    .notifications-dropdown {
      position: absolute;
      right: 0;
      top: 48px;
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 12px;
      width: 280px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
      z-index: 2000;
      overflow: hidden;
    }
    .dropdown-header {
      padding: 12px 16px;
      font-weight: 700;
      font-size: 0.8rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      border-bottom: 1px solid #334155;
      color: #94a3b8;
      background: rgba(0,0,0,0.1);
    }
    .dropdown-list {
      display: flex;
      flex-direction: column;
      max-height: 200px;
      overflow-y: auto;
    }
    .notification-item {
      padding: 10px 16px;
      font-size: 0.8rem;
      border-bottom: 1px solid #334155;
      color: #cbd5e1;
      text-align: left;
    }
    .notification-item:hover {
      background: rgba(255, 255, 255, 0.02);
    }
    .profile-container {
      position: relative;
      cursor: pointer;
    }
    .profile-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      color: #fff;
      font-size: 1rem;
      border: 2px solid #334155;
      transition: all 0.2s;
    }
    .profile-avatar:hover {
      border-color: #f97316;
      box-shadow: 0 0 10px rgba(249, 115, 22, 0.3);
    }
    .profile-dropdown {
      position: absolute;
      right: 0;
      top: 48px;
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 12px;
      width: 200px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
      z-index: 2000;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }
    .dropdown-link {
      padding: 12px 16px;
      font-size: 0.85rem;
      color: #cbd5e1;
      text-decoration: none;
      transition: all 0.2s;
      border: none;
      background: transparent;
      cursor: pointer;
      text-align: left;
    }
    .dropdown-link:hover {
      background: rgba(255, 255, 255, 0.02);
      color: #f97316;
    }

    /* HERO BANNER */
    .hero-banner-premium {
      background: linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%);
      border: 1px solid #334155;
      border-radius: 20px;
      padding: 32px;
      position: relative;
      overflow: hidden;
      margin-bottom: 28px;
    }
    .hero-background-effects {
      position: absolute;
      inset: 0;
      pointer-events: none;
    }
    .bg-blur-circle {
      position: absolute;
      border-radius: 50%;
      filter: blur(80px);
      opacity: 0.15;
    }
    .bg-blur-circle.c1 {
      width: 250px;
      height: 250px;
      background: #f97316;
      top: -50px;
      left: -50px;
    }
    .bg-blur-circle.c2 {
      width: 200px;
      height: 200px;
      background: #8b5cf6;
      bottom: -40px;
      right: -40px;
    }
    .hero-content {
      position: relative;
      z-index: 5;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 24px;
      text-align: left;
    }
    .hero-text-side {
      max-width: 550px;
    }
    .hero-tag {
      background: rgba(249, 115, 22, 0.12);
      color: #f97316;
      border: 1px solid rgba(249, 115, 22, 0.25);
      font-size: 0.72rem;
      font-weight: 700;
      padding: 4px 10px;
      border-radius: 50px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .hero-main-title {
      font-size: 2rem;
      font-weight: 800;
      color: #fff;
      margin: 12px 0 8px 0;
    }
    .hero-desc {
      font-size: 0.9rem;
      color: #94a3b8;
      line-height: 1.5;
    }
    .hero-stats-side {
      display: flex;
      gap: 16px;
    }
    .hero-stat-box {
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid rgba(255, 255, 255, 0.05);
      border-radius: 14px;
      padding: 16px 20px;
      text-align: center;
      min-width: 140px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.1);
    }
    .hero-stat-box .stat-num {
      display: block;
      font-size: 1.6rem;
      font-weight: 800;
      color: #f97316;
    }
    .hero-stat-box .stat-lbl {
      font-size: 0.72rem;
      color: #94a3b8;
      text-transform: uppercase;
      font-weight: 600;
      margin-top: 4px;
      display: block;
    }

    /* METRIC CARDS */
    .metrics-grid-premium {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 16px;
      margin-bottom: 28px;
    }
    .metric-card-new {
      border-radius: 16px;
      padding: 20px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
      border: 1px solid rgba(255,255,255,0.03);
      position: relative;
      overflow: hidden;
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .metric-card-new:hover {
      transform: translateY(-4px) scale(1.02);
      box-shadow: 0 8px 30px rgba(0, 0, 0, 0.3);
    }
    .gradient-orange { background: linear-gradient(135deg, #2c1a12 0%, #1e110a 100%); border-left: 4px solid #f97316; }
    .gradient-purple { background: linear-gradient(135deg, #201736 0%, #130e21 100%); border-left: 4px solid #8b5cf6; }
    .gradient-green  { background: linear-gradient(135deg, #132b20 0%, #0c1b14 100%); border-left: 4px solid #10b981; }
    .gradient-red    { background: linear-gradient(135deg, #32161b 0%, #1b0c0f 100%); border-left: 4px solid #ef4444; }
    .gradient-blue   { background: linear-gradient(135deg, #13243a 0%, #0a1421 100%); border-left: 4px solid #3b82f6; }
    .gradient-teal   { background: linear-gradient(135deg, #102e2c 0%, #0a1b1a 100%); border-left: 4px solid #14b8a6; }

    .card-inner {
      display: flex;
      justify-content: space-between;
      align-items: center;
      text-align: left;
    }
    .card-info {
      display: flex;
      flex-direction: column;
    }
    .metric-lbl {
      font-size: 0.72rem;
      font-weight: 700;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .metric-val {
      font-size: 1.4rem;
      font-weight: 800;
      color: #fff;
      margin: 6px 0 2px 0;
    }
    .metric-desc {
      font-size: 0.7rem;
      color: #64748b;
    }
    .card-icon-wrap {
      font-size: 1.6rem;
      opacity: 0.8;
    }

    /* CHARTS SECTION */
    .charts-section-premium {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(340px, 1fr));
      gap: 20px;
      margin-bottom: 28px;
    }
    .chart-card-wrap {
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 16px;
      padding: 20px;
      box-shadow: 0 4px 24px rgba(0, 0, 0, 0.2);
      text-align: left;
    }
    .chart-header {
      margin-bottom: 16px;
    }
    .chart-header h4 {
      font-size: 1rem;
      font-weight: 700;
      margin: 0;
      color: #fff;
    }
    .chart-subtitle {
      font-size: 0.75rem;
      color: #64748b;
      margin-top: 2px;
      display: block;
    }
    .chart-canvas-container {
      position: relative;
      height: 220px;
      width: 100%;
    }

    /* PIPELINE SECTION */
    .pipeline-section-premium {
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 16px;
      padding: 20px;
      margin-bottom: 28px;
      text-align: left;
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
      color: #fff;
    }
    .total-badge {
      font-size: 0.8rem;
      background: #334155;
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
      background: #334155;
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
      color: #94a3b8;
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

    /* QUICK ACTIONS */
    .quick-actions-section {
      margin-bottom: 28px;
      text-align: left;
    }
    .quick-actions-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 16px;
      margin-top: 14px;
    }
    .action-card {
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 16px;
      padding: 16px;
      display: flex;
      align-items: center;
      gap: 14px;
      cursor: pointer;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .action-card:hover {
      transform: translateY(-2px);
      border-color: #f97316;
      background: rgba(249, 115, 22, 0.03);
    }
    .act-card-icon {
      font-size: 1.6rem;
      background: rgba(255, 255, 255, 0.03);
      padding: 8px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background-color 0.2s;
    }
    .action-card:hover .act-card-icon {
      background: rgba(249, 115, 22, 0.1);
    }
    .act-card-text {
      display: flex;
      flex-direction: column;
    }
    .act-card-title {
      font-size: 0.88rem;
      font-weight: 700;
      color: #fff;
    }
    .act-card-desc {
      font-size: 0.72rem;
      color: #64748b;
      margin-top: 2px;
    }

    /* ORDERS SECTION */
    .orders-section-premium {
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 16px;
      padding: 24px;
      position: relative;
      box-shadow: 0 4px 25px rgba(0,0,0,0.15);
      text-align: left;
    }
    .orders-filter-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 16px;
      margin-bottom: 20px;
      border-bottom: 1px solid #334155;
      padding-bottom: 16px;
    }
    .filter-tabs {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
    }
    .tab-btn {
      background: rgba(255,255,255,0.02);
      border: 1px solid #334155;
      color: #cbd5e1;
      padding: 8px 16px;
      border-radius: 8px;
      font-size: 0.8rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }
    .tab-btn:hover {
      border-color: #f97316;
      color: #fff;
    }
    .tab-btn.active {
      background: #f97316;
      border-color: #f97316;
      color: #fff;
      box-shadow: 0 4px 12px rgba(249, 115, 22, 0.25);
    }

    .table-wrap-premium {
      overflow-x: auto;
      border-radius: 12px;
      border: 1px solid #334155;
    }
    .data-table-premium {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
      font-size: 0.88rem;
    }
    .data-table-premium th {
      padding: 14px 16px;
      background: rgba(0,0,0,0.2);
      border-bottom: 1px solid #334155;
      color: #94a3b8;
      font-size: 0.78rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .data-table-premium td {
      padding: 16px;
      border-bottom: 1px solid #334155;
      vertical-align: middle;
      color: #cbd5e1;
    }
    .data-table-premium tbody tr {
      transition: background-color 0.2s;
    }
    .data-table-premium tbody tr:hover {
      background: rgba(255,255,255,0.015);
    }

    .col-id {
      color: #fff;
      font-size: 0.9rem;
    }
    .client-info-cell {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .client-name {
      font-weight: 700;
      color: #fff;
    }
    .client-phone {
      font-size: 0.75rem;
      color: #64748b;
    }
    .food-list-cell {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .food-item-badge {
      font-size: 0.8rem;
      background: rgba(255,255,255,0.03);
      border: 1px solid rgba(255,255,255,0.05);
      border-radius: 6px;
      padding: 4px 8px;
      display: inline-block;
      width: fit-content;
    }
    .food-item-badge .qty {
      background: #334155;
      padding: 1px 5px;
      border-radius: 4px;
      margin-left: 4px;
      font-size: 0.72rem;
    }

    .price-info-cell {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .total-price {
      color: #fff;
      font-weight: 700;
    }
    .delivery-fee-sub {
      font-size: 0.72rem;
      color: #64748b;
    }

    .courier-pill {
      background: rgba(59, 130, 246, 0.08);
      color: #3b82f6;
      border: 1px solid rgba(59, 130, 246, 0.2);
      border-radius: 12px;
      padding: 3px 8px;
      font-size: 0.78rem;
      font-weight: 600;
      display: inline-block;
    }
    .courier-fees {
      font-size: 0.7rem;
      color: #64748b;
      margin-top: 4px;
      line-height: 1.4;
    }
    .unassigned-text {
      font-size: 0.78rem;
      color: #475569;
      font-style: italic;
    }

    /* STATUS NEW BADGES */
    .status-badge-new {
      font-size: 0.72rem;
      padding: 4px 10px;
      border-radius: 50px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.03em;
      display: inline-block;
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
      flex-wrap: wrap;
      gap: 6px;
    }
    .act-btn-new {
      padding: 6px 12px;
      font-size: 0.78rem;
      font-weight: 700;
      border-radius: 8px;
      border: none;
      cursor: pointer;
      transition: all 0.2s;
    }
    .act-btn-new:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    .act-btn-new.act-prepare {
      background: #f97316;
      color: #fff;
    }
    .act-btn-new.act-prepare:hover:not(:disabled) {
      background: #ea580c;
      transform: translateY(-1px);
    }
    .act-btn-new.act-ready {
      background: #10b981;
      color: #fff;
    }
    .act-btn-new.act-ready:hover:not(:disabled) {
      background: #059669;
      transform: translateY(-1px);
    }
    .act-btn-new.act-courier {
      background: #3b82f6;
      color: #fff;
    }
    .act-btn-new.act-courier:hover:not(:disabled) {
      background: #2563eb;
      transform: translateY(-1px);
    }
    .act-btn-new.act-cancel {
      background: rgba(239,68,68,0.1);
      color: #ef4444;
      border: 1px solid rgba(239,68,68,0.2);
    }
    .act-btn-new.act-cancel:hover:not(:disabled) {
      background: rgba(239,68,68,0.2);
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
      .dashboard-header-premium {
        display: grid;
        grid-template-areas: 
          "left right"
          "search search";
        gap: 12px;
        align-items: center;
      }
      .header-left {
        grid-area: left;
      }
      .header-right {
        grid-area: right;
        display: flex;
        justify-content: flex-end;
        align-items: center;
        gap: 12px;
      }
      .header-search {
        grid-area: search;
        margin: 0;
        max-width: 100%;
      }
      .notifications-dropdown {
        right: -10px;
        width: 260px;
      }
      .profile-dropdown {
        right: -10px;
        width: 180px;
      }
      .hero-content {
        flex-direction: column;
        align-items: stretch;
      }
      .hero-stats-side {
        justify-content: space-between;
      }
      .charts-section-premium {
        grid-template-columns: 1fr;
      }

      .data-table-premium, .data-table-premium thead, .data-table-premium tbody, .data-table-premium th, .data-table-premium td, .data-table-premium tr { display: block; }
      .data-table-premium thead { display: none; }
      .data-table-premium tr {
        border: 1px solid #334155; border-radius: 12px;
        padding: 12px; margin-bottom: 12px; background: rgba(255,255,255,0.01);
      }
      .data-table-premium td {
        display: flex; justify-content: space-between; align-items: center;
        padding: 10px 0; border-bottom: 1px dashed #334155; text-align: right;
      }
      .data-table-premium td:last-child { border-bottom: none; padding-top: 12px; justify-content: flex-end; }
      .data-table-premium td::before {
        content: attr(data-label); font-weight: 700; color: #94a3b8;
        font-size: 0.72rem; text-transform: uppercase; margin-right: 12px;
      }
    }
  `]
})
export class ManagerDashboardComponent implements OnInit, OnDestroy {
  orders       = signal<Order[]>([]);
  loading      = signal(true);
  updatingId   = signal<number | null>(null);
  cancelTarget = signal<Order | null>(null);
  cancelReason = '';
  toast        = signal<{ message: string; type: 'success' | 'error' } | null>(null);
  allStatuses  = ALL_STATUSES;

  restaurant   = signal<Restaurant | null>(null);
  searchQuery  = signal<string>('');
  statusFilter = signal<string>('ALL');
  currentPage  = signal<number>(1);
  pageSize     = 10;

  showNotifications = signal<boolean>(false);
  showUserMenu      = signal<boolean>(false);
  notifications     = signal<string[]>([]);
  activeHelpModal = signal<string | null>(null);

  private pollInterval: any;
  private toastTimer: any;
  private weeklyChart: any = null;
  private statusChart: any = null;

  // Computed metrics
  pendingOrders    = computed(() => this.orders().filter(o => o.status === 'PENDING' || o.status === 'TRANSFERRED_TO_YANDEX' || o.status === 'YANDEX_COURIER_CALLED'));
  activePrepOrders = computed(() => this.orders().filter(o => o.status === 'PREPARING' || o.status === 'READY'));
  completedCount   = computed(() => this.orders().filter(o => o.status === 'DELIVERED').length);
  canceledCount    = computed(() => this.orders().filter(o => o.status === 'CANCELED').length);
  totalRevenue     = computed(() =>
    this.orders().filter(o => o.status === 'DELIVERED').reduce((sum, o) => sum + o.totalPrice, 0)
  );
  activeOrdersCount = computed(() => 
    this.orders().filter(o => o.status !== 'DELIVERED' && o.status !== 'CANCELED').length
  );
  avgDeliveryTime = computed(() => {
    const delivered = this.orders().filter(o => o.status === 'DELIVERED');
    if (delivered.length === 0) return '0 min';
    let totalMinutes = 0;
    delivered.forEach(o => {
      const dist = o.distance || 2.5;
      totalMinutes += 12 + Math.round(dist * 3);
    });
    const avg = Math.round(totalMinutes / delivered.length);
    return `${avg} min`;
  });

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

  // Math Helper for template
  Math = Math;

  constructor(
    private orderService: OrderService,
    public auth: AuthService
  ) {
    // Close dropdowns on window click
    window.addEventListener('click', () => {
      this.showNotifications.set(false);
      this.showUserMenu.set(false);
    });
  }

  ngOnInit(): void {
    this.loadNotifications();
    this.load(true);
    // Poll stats every 5 seconds to keep data live
    this.pollInterval = setInterval(() => this.load(false), 5000);
  }

  ngOnDestroy(): void {
    if (this.pollInterval) clearInterval(this.pollInterval);
    if (this.toastTimer) clearTimeout(this.toastTimer);
    if (this.weeklyChart) this.weeklyChart.destroy();
    if (this.statusChart) this.statusChart.destroy();
  }

  load(showLoader = true): void {
    if (showLoader) this.loading.set(true);

    // Load active restaurant
    this.orderService.getManagerRestaurants().subscribe({
      next: (data) => {
        const activeId = localStorage.getItem('manager_active_restaurant_id');
        const found = data.find(r => r.id.toString() === activeId);
        if (found) {
          this.restaurant.set(found);
        } else if (data.length > 0) {
          this.restaurant.set(data[0]);
        }
      }
    });

    // Load orders
    this.orderService.getManagerOrders().subscribe({
      next: (data) => {
        this.orders.set(data);
        if (showLoader) this.loading.set(false);
        this.updateNotificationsFromOrders(data);
        this.initCharts();
      },
      error: () => { if (showLoader) this.loading.set(false); }
    });
  }

  initCharts(): void {
    setTimeout(() => {
      const ctxWeekly = document.getElementById('weeklyChart') as HTMLCanvasElement;
      const ctxStatus = document.getElementById('statusChart') as HTMLCanvasElement;

      if (ctxWeekly) {
        if (this.weeklyChart) this.weeklyChart.destroy();
        
        const weekdayCounts = [0, 0, 0, 0, 0, 0, 0];
        this.orders().forEach(o => {
          if (o.createdAt) {
            const date = new Date(o.createdAt);
            const day = date.getDay(); // 0: Sun, 1: Mon, ...
            const index = day === 0 ? 6 : day - 1;
            if (index >= 0 && index < 7) {
              weekdayCounts[index]++;
            }
          }
        });

        this.weeklyChart = new Chart(ctxWeekly, {
          type: 'bar',
          data: {
            labels: ['Dush', 'Sesh', 'Chor', 'Pay', 'Jum', 'Shan', 'Yak'],
            datasets: [{
              label: 'Buyurtmalar',
              data: weekdayCounts,
              backgroundColor: '#f97316',
              borderRadius: 6
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
              y: { grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#94a3b8' } },
              x: { grid: { display: false }, ticks: { color: '#94a3b8' } }
            }
          }
        });
      }

      if (ctxStatus) {
        if (this.statusChart) this.statusChart.destroy();
        const pending = this.pendingOrders().length;
        const prep = this.activePrepOrders().length;
        const completed = this.completedCount();
        const canceled = this.canceledCount();

        this.statusChart = new Chart(ctxStatus, {
          type: 'doughnut',
          data: {
            labels: ['Yangi', 'Tayyorlash', 'Yetkazildi', 'Bekor bo\'ldi'],
            datasets: [{
              data: [pending, prep, completed, canceled],
              backgroundColor: ['#f59e0b', '#8b5cf6', '#10b981', '#ef4444'],
              borderWidth: 0
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { position: 'bottom', labels: { color: '#94a3b8', font: { size: 10 } } }
            }
          }
        });
      }
    }, 150);
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

  copyToClipboard(text: string): void {
    navigator.clipboard.writeText(text).then(() => {
      this.showToast('📋 Koordinatalar nusxalandi', 'success');
    }).catch(() => {
      this.showToast('❌ Nusxalab bo\'lmadi', 'error');
    });
  }

  clearNotifications(event: MouseEvent): void {
    event.stopPropagation();
    this.saveNotifications([]);
    this.showToast('🧹 Bildirishnomalar tozalandi', 'success');
  }

  private showToast(message: string, type: 'success' | 'error'): void {
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toast.set({ message, type });
    this.toastTimer = setTimeout(() => this.toast.set(null), 3500);
  }

  getStatusLabel(status: string): string {
    return (ORDER_STATUS_LABELS as any)[status] || status;
  }

  getStatusPercent(status: string): number {
    const active = this.activeOrdersCount();
    if (active === 0) return 0;
    const count = this.orders().filter(o => o.status === status).length;
    return (count / active) * 100;
  }

  getOnlyPreparingCount(): number {
    return this.orders().filter(o => (o.status === 'PREPARING' || o.status === 'YANDEX_COURIER_CALLED') && !o.isReady).length;
  }

  getReadyButNotPickedCount(): number {
    return this.orders().filter(o => 
      (o.status === 'PREPARING' && o.isReady) || 
      (o.status === 'READY') ||
      (['COURIER_ACCEPTED', 'COURIER_AT_RESTAURANT'].includes(o.status) && o.isReady)
    ).length;
  }

  getDeliveringCount(): number {
    return this.orders().filter(o => ['DELIVERING', 'COURIER_AT_CLIENT', 'YANDEX_COURIER_PICKED_UP'].includes(o.status)).length;
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

  loadNotifications(): void {
    const userId = this.auth.user()?.id;
    if (!userId) return;
    const cached = localStorage.getItem(`manager_notifications_${userId}`);
    if (cached) {
      this.notifications.set(JSON.parse(cached));
    } else {
      this.notifications.set([]);
    }
  }

  saveNotifications(list: string[]): void {
    const userId = this.auth.user()?.id;
    if (!userId) return;
    localStorage.setItem(`manager_notifications_${userId}`, JSON.stringify(list));
    this.notifications.set([...list]);
  }

  updateNotificationsFromOrders(orders: Order[]): void {
    const userId = this.auth.user()?.id;
    if (!userId) return;

    const cacheKey = `manager_orders_last_status_${userId}`;
    const cachedMapStr = localStorage.getItem(cacheKey);
    const cachedMap: Record<number, string> = cachedMapStr ? JSON.parse(cachedMapStr) : {};
    let changed = false;
    const newNotifications = [...this.notifications()];

    orders.forEach(o => {
      const lastStatus = cachedMap[o.id];
      if (!lastStatus) {
        newNotifications.unshift(`Yangi buyurtma qabul qilindi! (Buyurtma #${o.id})`);
        cachedMap[o.id] = o.status;
        changed = true;
      } else if (lastStatus !== o.status) {
        const text = this.getManagerNotificationText(o.id, o.status);
        if (text) {
          newNotifications.unshift(text);
          changed = true;
        }
        cachedMap[o.id] = o.status;
      }
    });

    if (changed) {
      localStorage.setItem(cacheKey, JSON.stringify(cachedMap));
      this.saveNotifications(newNotifications.slice(0, 15));
    }
  }

  getManagerNotificationText(orderId: number, status: string): string | null {
    switch (status) {
      case 'PENDING': return `Yangi buyurtma kutilmoqda (Buyurtma #${orderId})`;
      case 'PREPARING': return `Buyurtma #${orderId} oshxonada tayyorlanmoqda.`;
      case 'COURIER_ACCEPTED': return `Kuryer buyurtma #${orderId} ni qabul qildi.`;
      case 'COURIER_AT_RESTAURANT': return `Kuryer buyurtma #${orderId} uchun restoranga yetib keldi.`;
      case 'DELIVERING': return `Kuryer buyurtma #${orderId} ni olib yo'lga chiqdi.`;
      case 'DELIVERED': return `Buyurtma #${orderId} muvaffaqiyatli yetkazildi.`;
      case 'CANCELED': return `Buyurtma #${orderId} bekor qilindi.`;
      default: return null;
    }
  }
}

