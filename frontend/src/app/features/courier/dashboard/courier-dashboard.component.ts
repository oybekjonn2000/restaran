import { Component, OnInit, OnDestroy, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { OrderService } from '../../../core/services/order.service';
import { AuthService } from '../../../core/services/auth.service';
import { Order, ORDER_STATUS_LABELS, OrderStatus } from '../../../core/models/order.model';
import { Slot, ActiveSlotResponse } from '../../../core/models/slot.model';

type TabType = 'jadval' | 'smena' | 'chatlar' | 'profil';

@Component({
  selector: 'app-courier-dashboard',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule, MatSnackBarModule],
  template: `
    <div class="courier-app">

      <!-- ===== JADVAL TAB ===== -->
      @if (activeTab() === 'jadval') {
        <div class="tab-content animate-tab">
          <div class="jadval-header">
            <h2 class="jadval-title">Mening smenalarim</h2>
          </div>

          @if (loading()) {
            <div class="center-spinner"><mat-spinner diameter="36" color="warn"></mat-spinner></div>
          } @else {

            <!-- Aktiv smena kartochkasi -->
            @if (activeSlot()) {
              <div class="my-slot-card active-my-slot" (click)="openSlotDetails(activeSlot()!)" [id]="'my-slot-' + activeSlot()!.id" style="cursor: pointer;">
                <div class="my-slot-date">
                  {{ formatSlotDate(activeSlot()!.date) }}, {{ activeSlot()!.startTime | slice:0:5 }} – {{ activeSlot()!.endTime | slice:0:5 }}
                </div>
                <div class="my-slot-meta">
                  <span class="my-slot-name">{{ activeSlot()!.name }}</span>
                  <span class="my-slot-dot">·</span>
                  <span class="my-slot-status">🟢 Faol smena</span>
                </div>
              </div>
            }

            <!-- Tanlangan (band qilingan lekin hali boshlanmagan) smenalar -->
            @for (slot of myPendingBookedSlots; track slot.id) {
              <div class="my-slot-card slot-booked-card" [class.slot-can-start]="slotCanStart(slot)" (click)="openSlotDetails(slot)" style="cursor: pointer;">
                <div class="my-slot-date">
                  {{ formatSlotDate(slot.date) }}, {{ slot.startTime | slice:0:5 }} – {{ slot.endTime | slice:0:5 }}
                </div>
                <div class="my-slot-meta">
                  <span class="my-slot-name">{{ slot.name }}</span>
                  <span class="my-slot-dot">·</span>
                  <span class="my-slot-booked-status">🔒 Band qilingan</span>
                  @if (!slotCanStart(slot)) {
                    <span class="my-slot-dot">·</span>
                    <span class="my-slot-wait">{{ timeUntilSlot(slot) }}</span>
                  } @else {
                    <span class="my-slot-dot">·</span>
                    <span class="delay-timer" style="color: #ef4444; font-weight: 600; animation: blink 1s infinite;">
                      ⚠️ Kechikish: {{ getDelayTime(slot) }}
                    </span>
                  }
                </div>
              </div>
            }

            @if (!activeSlot() && myPendingBookedSlots.length === 0) {
              <div class="empty-slots">
                <div class="empty-slots-icon">⏰</div>
                <p>Hozircha tanlangan smenangiz yo'q</p>
                <span>"Smenalar jadvalini ochish" orqali smena band qiling yoki boshlang</span>
              </div>
            }

          }

          <!-- Pastdagi tugma -->
          <div class="bottom-action-bar">
            <button class="open-schedule-btn" (click)="openScheduleModal()" id="jadval-open-schedule">
              Smenalar jadvalini ochish
            </button>
          </div>
        </div>
      }

      <!-- ===== SMENA TAB ===== -->
      @if (activeTab() === 'smena') {
        <div class="tab-content smena-tab animate-tab">
          <!-- Yandex xarita -->
          <div class="map-container">
            <div id="courier-main-map" class="main-map"></div>

            @if (activeSlot() && activeDeliveriesCount === 0) {
              <!-- Map top pill for order searching -->
              <div class="map-searching-pill">
                <span class="searching-pulse-dot"></span>
                <span class="searching-pill-text">Buyurtma qidirilmoqda</span>
              </div>

              <!-- Map menu icon -->
              <button class="map-menu-btn" (click)="openScheduleModal()">
                <span>≡</span>
              </button>

              <!-- Map Start nuqtasiga button -->
              <button class="map-start-point-btn" (click)="initMainMap()">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="margin-right: 6px;">
                  <path d="M12 2L2 22l10-6 10 6L12 2z"/>
                </svg>
                Start nuqtasiga
              </button>

              <!-- Map controls on the right -->
              <div class="map-controls-group">
                <button class="map-ctrl-btn" (click)="initMainMap()">🎯</button>
                <button class="map-ctrl-btn" (click)="initMainMap()">+</button>
                <button class="map-ctrl-btn" (click)="initMainMap()">-</button>
              </div>
            }

            @if (activeSlot() && activeDeliveriesCount > 0) {
              <button class="map-route-btn" (click)="openYandexRoute(currentDeliveries()[0])" id="map-route-btn">
                <span class="route-icon">🔄</span> Marshrutni tuzish
              </button>
            }
          </div>

          <!-- Smena info paneli / Bottom Sheet -->
          <div class="smena-info-panel" [class.bottom-sheet-searching]="activeSlot() && activeDeliveriesCount === 0">
            @if (activeSlot()) {
              @if (activeDeliveriesCount === 0) {
                <!-- Bottom sheet drag handle indicator -->
                <div class="bottom-sheet-handle"></div>

                <!-- Searching state details layout -->
                <div class="searching-details-row">
                  <div class="hourglass-icon-wrapper">
                    <span class="hourglass-emoji">⏳</span>
                  </div>
                  <div class="searching-text-block">
                    <div class="searching-title">Buyurtma qidirilmoqda...</div>
                    <div class="searching-subtitle">Start nuqtasida kuting</div>
                  </div>
                </div>

                <!-- Two columns info cards -->
                <div class="searching-cards-row">
                  <div class="searching-info-card" (click)="openEarningsModal()" style="cursor: pointer;">
                    <span class="search-card-icon">💵</span>
                    <div class="search-card-content">
                      <div class="search-card-label">Joriy balans</div>
                      <div class="search-card-value">{{ (auth.user()?.balance || 0) | number:'1.0-0' }} so'm</div>
                    </div>
                  </div>
                  
                  <div class="searching-info-card">
                    <span class="search-card-icon">🚗</span>
                    <div class="search-card-content">
                      <div class="search-card-label">Ishlayman</div>
                      <div class="search-card-value">Mashina</div>
                    </div>
                  </div>
                </div>

              } @else {
                <!-- Normal active delivery order card view -->
                <div class="smena-info-header">
                  <div>
                    <div class="smena-info-label">Smena</div>
                    <div class="smena-info-name">{{ activeSlot()!.name }}</div>
                  </div>
                  <div class="smena-info-time-badge">
                    {{ formatSlotDate(activeSlot()!.date) }}, {{ activeSlot()!.startTime | slice:0:5 }}
                  </div>
                </div>

                <div class="smena-stats-row">
                  <div class="smena-stat" (click)="openEarningsModal()" style="cursor: pointer;">
                    <span class="smena-stat-icon">💰</span>
                    <div>
                      <div class="smena-stat-val">{{ totalEarnings | number:'1.0-0' }} so'm</div>
                      <div class="smena-stat-lbl">Joriy daromad</div>
                    </div>
                  </div>
                  <div class="smena-divider"></div>
                  <div class="smena-stat">
                    <span class="smena-stat-icon">🏍️</span>
                    <div>
                      <div class="smena-stat-val">{{ deliveredCount() }} ta</div>
                      <div class="smena-stat-lbl">Topshirildi</div>
                    </div>
                  </div>
                </div>

                <!-- Faol buyurtma -->
                @for (order of currentDeliveries(); track order.id) {
                  @if (order.status !== 'DELIVERED') {
                    <div class="active-order-card" [id]="'smena-order-' + order.id">
                      <div class="active-order-top">
                        <span class="active-order-num">#{{ order.id }}</span>
                        <span class="status-pill" [class]="'pill-' + order.status.toLowerCase()">{{ statusLabel(order.status) }}</span>
                      </div>
                      <div class="active-order-restaurant" style="font-size: 0.9rem; font-weight: 700; color: #111; margin: 4px 0 2px;">🏪 {{ order.restaurant?.name || "Noma'lum restoran" }}</div>
                      <div class="active-order-addr">📍 {{ order.deliveryAddress }}</div>
                      
                      <!-- Verification Mode if "Yo'lga chiqdim" is swiped -->
                      @if (showOrderItemsVerificationId() === order.id) {
                        <div class="order-verification-box">
                          <div class="verification-title">📦 Buyurtma tarkibi:</div>
                          <div class="verification-items-list">
                            @for (item of order.items; track item.id) {
                              <div class="verification-item">
                                <span class="verification-item-qty">{{ item.quantity }}x</span>
                                <span class="verification-item-name">{{ item.food?.name }}</span>
                                <span class="verification-item-price">{{ (item.price * item.quantity) | number:'1.0-0' }} so'm</span>
                              </div>
                            }
                          </div>
                        </div>
                        
                        <div class="active-order-actions" style="margin-top: 10px;">
                          <!-- "Hammasi to'g'ri" Swipe-to-Confirm element -->
                          <div class="swipe-container verify-swipe" 
                               (mousedown)="onSwipeStart($event, order, true)" 
                               (touchstart)="onSwipeStart($event, order, true)">
                            <div class="swipe-track">
                              <div class="swipe-bg verify-swipe-bg" [style.width.%]="activeSwipingOrderId() === order.id ? swipePercent() : 0"></div>
                              <div class="swipe-handle" [style.transform]="activeSwipingOrderId() === order.id ? 'translateX(' + swipeTranslateX() + 'px)' : 'translateX(0px)'">
                                <span class="swipe-arrow" style="color: #10b981;">➔</span>
                              </div>
                              <span class="swipe-text verify-swipe-text" [style.color]="activeSwipingOrderId() === order.id && swipePercent() > 50 ? '#fff' : '#10b981'">
                                {{ order.status === 'COURIER_AT_CLIENT' ? "Hammasi topshirildi (Suring ➔)" : "Hammasi to'g'ri (Suring ➔)" }}
                              </span>
                            </div>
                          </div>
                        </div>
                      } @else {
                        <!-- Regular Swipe-to-Confirm action -->
                        <div class="active-order-actions" style="margin-top: 10px;">
                          <div class="swipe-container" 
                               (mousedown)="onSwipeStart($event, order, false)" 
                               (touchstart)="onSwipeStart($event, order, false)">
                            <div class="swipe-track">
                              <div class="swipe-bg" [style.width.%]="activeSwipingOrderId() === order.id ? swipePercent() : 0"></div>
                              <div class="swipe-handle" [style.transform]="activeSwipingOrderId() === order.id ? 'translateX(' + swipeTranslateX() + 'px)' : 'translateX(0px)'">
                                <span class="swipe-arrow">➔</span>
                              </div>
                              <span class="swipe-text" [style.color]="activeSwipingOrderId() === order.id && swipePercent() > 50 ? '#fff' : '#4b6bfb'">
                                {{ swipeText(order.status) }}
                              </span>
                            </div>
                          </div>
                        </div>
                      }
                    </div>
                  }
                }
              }

            } @else {
              <!-- Smena yo'q -->
              <div class="no-smena-info">
                <div class="no-smena-label">Smena</div>
                <div class="no-smena-text">Faol smena yo'q</div>
                <div class="no-smena-sub">Smena tanlang va buyurtma qabul qiling</div>
              </div>

              <button class="open-schedule-btn" (click)="openScheduleModal()" id="smena-open-schedule">
                Smenalar jadvalini ochish
              </button>
            }
          </div>
        </div>
      }

      <!-- ===== CHATLAR TAB ===== -->
      @if (activeTab() === 'chatlar') {
        <div class="tab-content center-tab animate-tab">
          <div class="coming-soon">
            <div class="coming-icon">💬</div>
            <h3>Chatlar</h3>
            <p>Tez orada qo'shiladi</p>
          </div>
        </div>
      }

      <!-- ===== PROFIL TAB ===== -->
      @if (activeTab() === 'profil') {
        <div class="tab-content animate-tab">
          <!-- Profil header -->
          <div class="profil-header">
            <div class="profil-avatar-wrap">
              <div class="profil-avatar">{{ initial }}</div>
            </div>
            <div class="profil-name">{{ auth.user()?.name }}</div>
            <div class="profil-phone">{{ auth.user()?.phone || auth.user()?.email }}</div>
          </div>

          <!-- Yandex Balance and Vehicle row -->
          <div class="yandex-profile-cards">
            <div class="yandex-card" (click)="openEarningsModal()" style="cursor: pointer;">
              <span class="yandex-card-icon">💵</span>
              <div class="yandex-card-info">
                <span class="yandex-card-lbl">Joriy balans</span>
                <span class="yandex-card-val">{{ (auth.user()?.balance || 0) | number:'1.0-0' }} so'm</span>
              </div>
            </div>
            <div class="yandex-card">
              <span class="yandex-card-icon">🏍️</span>
              <div class="yandex-card-info">
                <span class="yandex-card-lbl">Ishlayman</span>
                <span class="yandex-card-val">Moped</span>
              </div>
            </div>
          </div>

          <!-- Earnings card -->
          <div class="earnings-card" (click)="openEarningsModal()" style="cursor: pointer;">
            <div class="earnings-header">
              <span>Haftalik daromad <span class="arrow-right">›</span></span>
              <span class="wallet-icon">💳</span>
            </div>
            <div class="earnings-amount">{{ totalEarnings | number:'1.0-0' }} <span class="currency">so'm</span></div>
          </div>

          <!-- Menu items -->
          <div class="profil-menu">
            <div class="profil-menu-item" (click)="openEarningsModal()" style="cursor: pointer;">
              <div class="profil-menu-icon">📊</div>
              <span>Daromad</span>
              <span class="profil-chevron">›</span>
            </div>
            <div class="profil-menu-item">
              <div class="profil-menu-icon">💳</div>
              <span>Balans</span>
              <span class="profil-chevron">›</span>
            </div>
            <div class="profil-menu-item">
              <div class="profil-menu-icon">🛵</div>
              <span>Transport ijarasi</span>
              <span class="profil-chevron">›</span>
            </div>
            <div class="profil-menu-item">
              <div class="profil-menu-icon">💬</div>
              <span>Qo'llab-quvvatlash</span>
              <span class="profil-chevron">›</span>
            </div>
            <div class="profil-menu-item">
              <div class="profil-menu-icon">❓</div>
              <span>Ko'p beriladigan savollar</span>
              <span class="profil-chevron">›</span>
            </div>
            <div class="profil-menu-item">
              <div class="profil-menu-icon">🎓</div>
              <span>Bilimlar bazasi</span>
              <span class="profil-chevron">›</span>
            </div>
            <div class="profil-menu-item" (click)="auth.logout()">
              <div class="profil-menu-icon">🚪</div>
              <span style="color: #ef4444">Chiqish</span>
              <span class="profil-chevron">›</span>
            </div>
          </div>
        </div>
      }

      <!-- ===== PASTKI NAVIGATSIYA ===== -->
      <nav class="bottom-nav">
        <button class="nav-btn" [class.nav-active]="activeTab() === 'jadval'" (click)="switchTab('jadval')" id="nav-jadval">
          <span class="nav-icon-svg">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
          </span>
          <span class="nav-label">Jadval</span>
        </button>
        <button class="nav-btn" [class.nav-active]="activeTab() === 'smena'" (click)="switchToSmena()" id="nav-smena">
          <span class="nav-icon-svg">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
          </span>
          <span class="nav-label">Smena</span>
        </button>
        <button class="nav-btn" [class.nav-active]="activeTab() === 'chatlar'" (click)="switchTab('chatlar')" id="nav-chatlar">
          <span class="nav-icon-svg">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
          </span>
          <span class="nav-label">Chatlar</span>
          @if (activeRequests().length > 0) {
            <span class="nav-badge">{{ activeRequests().length }}</span>
          }
        </button>
        <button class="nav-btn" [class.nav-active]="activeTab() === 'profil'" (click)="switchTab('profil')" id="nav-profil">
          <span class="nav-icon-svg">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
            </svg>
          </span>
          <span class="nav-label">Profil</span>
        </button>
      </nav>

      <!-- ===== FULLSCREEN INCOMING ORDER MODAL ===== -->
      @if (activeRequests().length > 0) {
        <div class="incoming-order-overlay" (click)="$event.stopPropagation()">
          <div class="incoming-order-card animate-incoming" (click)="$event.stopPropagation()">
            <div class="incoming-header">
              <span class="incoming-badge">📥 Yangi buyurtma</span>
              <div class="incoming-timer" [class.countdown-critical]="getRemainingTime(activeRequests()[0]) < 30">
                ⏱️ {{ getRemainingTimeLabel(activeRequests()[0]) }}
              </div>
            </div>

            <div class="incoming-body">
              <div class="incoming-restaurant">🏪 {{ activeRequests()[0].restaurant?.name || "Noma'lum restoran" }}</div>
              <div class="incoming-address">📍 {{ activeRequests()[0].deliveryAddress }}</div>
              <div class="incoming-price">💰 {{ (activeRequests()[0].totalPrice + (activeRequests()[0].deliveryFee || 0)) | number:'1.0-0' }} so'm</div>
            </div>

            <div class="incoming-footer">
              @if (activeSlot()) {
                <button class="incoming-accept-btn" (click)="acceptOrder(activeRequests()[0].id)" [disabled]="actionLoading() === activeRequests()[0].id">
                  @if (actionLoading() === activeRequests()[0].id) {
                    <mat-spinner diameter="18" color="accent"></mat-spinner>
                  } @else {
                    Qabul qilish
                  }
                </button>
              } @else {
                <div class="need-slot-warn-modal">⚠️ Smenani faollashtiring</div>
              }
            </div>
          </div>
        </div>
      }
    </div>

    <!-- ===== EARNINGS DETAILS MODAL ===== -->
    @if (showEarningsModal()) {
      <div class="earnings-overlay" (click)="closeEarningsModal()">
        <div class="earnings-modal animate-earnings" (click)="$event.stopPropagation()">
          
          <!-- Header -->
          <div class="earnings-header">
            <button class="earnings-back-btn" (click)="closeEarningsModal()">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
              </svg>
            </button>
            <span class="earnings-title">Daromad</span>
            <button class="earnings-info-btn">
              <span>ⓘ</span>
            </button>
          </div>

          <!-- Switch Tabs (Kun, Hafta, Oy) -->
          <div class="earnings-tabs-container">
            <div class="earnings-tabs">
              <button class="earnings-tab-btn" [class.active]="earningsTab() === 'kun'" (click)="earningsTab.set('kun')">Kun</button>
              <button class="earnings-tab-btn" [class.active]="earningsTab() === 'hafta'" (click)="earningsTab.set('hafta')">Hafta</button>
              <button class="earnings-tab-btn" [class.active]="earningsTab() === 'oy'" (click)="earningsTab.set('oy')">Oy</button>
            </div>
          </div>

          <!-- Davr Navigatsiyasi (Strelkalar bilan) -->
          <div class="earnings-nav-header">
            <button class="earn-nav-btn" (click)="navigatePeriod(-1)">
              ‹
            </button>
            <span class="earn-period-title">{{ getPeriodLabel() }}</span>
            <button class="earn-nav-btn" (click)="navigatePeriod(1)">
              ›
            </button>
          </div>

          <!-- Big Earnings Value -->
          <div class="earnings-big-value-box">
            <div class="earnings-big-num" [style.color]="(filteredEarningsTotal - filteredPenaltyTotal) < 0 ? '#ef4444' : 'var(--primary)'">
              {{ (filteredEarningsTotal - filteredPenaltyTotal) | number:'1.0-0' }}
            </div>
            <div class="earnings-big-lbl">so'm (sof)</div>
            @if (filteredPenaltyTotal > 0) {
              <div class="earnings-penalty-sub">⚠️ {{ filteredPenaltyTotal | number:'1.0-0' }} so'm jarima ayirildi</div>
            }
          </div>

          <!-- Week Days Calendar Slider (Faqat 'kun' tanlanganda chiqadi) -->
          @if (earningsTab() === 'kun') {
            <div class="earnings-calendar-slider">
              @for (day of weekDays; track day.date) {
                <div class="earnings-cal-day" [class.active]="day.date === selectedDate()" (click)="selectCalendarDay(day)">
                  <span class="earnings-cal-dayNum">{{ day.dayNum }}</span>
                  <span class="earnings-cal-label">{{ day.label }}</span>
                </div>
              }
            </div>
          }

          <!-- Stats list -->
          <div class="earnings-stats-list">
            <div class="earnings-stat-item">
              <span class="stat-item-title">
                @if (earningsTab() === 'kun') { Smena uchun daromad }
                @else if (earningsTab() === 'hafta') { Haftalik smena daromadi }
                @else { Oylik smena daromadi }
              </span>
              <span class="stat-item-value">{{ filteredEarningsTotal | number:'1.0-0' }} so'm</span>
            </div>

            @if (filteredPenaltyTotal > 0) {
              <div class="earnings-stat-item">
                <span class="stat-item-title" style="color: #ef4444;">⚠️ Jarimalar (bekor qilingan smenalar)</span>
                <span class="stat-item-value" style="color: #ef4444;">-{{ filteredPenaltyTotal | number:'1.0-0' }} so'm</span>
              </div>
            }

            <div class="earnings-stat-item" style="border-top: 1px solid var(--border); padding-top: 10px; margin-top: 2px;">
              <span class="stat-item-title" style="font-weight: 700;">Sof daromad</span>
              <span class="stat-item-value" [style.color]="(filteredEarningsTotal - filteredPenaltyTotal) < 0 ? '#ef4444' : '#10b981'">
                {{ (filteredEarningsTotal - filteredPenaltyTotal) | number:'1.0-0' }} so'm
              </span>
            </div>

            <div class="earnings-stat-item">
              <span class="stat-item-title">Smenalar soni</span>
              <span class="stat-item-value-black">{{ filteredEarningsSlotsCount }} Ta</span>
            </div>

            @if (filteredCancelledSlotsCount > 0) {
              <div class="earnings-stat-item">
                <span class="stat-item-title" style="color: #ef4444;">Bekor qilingan smenalar</span>
                <span class="stat-item-value-black" style="color: #ef4444;">{{ filteredCancelledSlotsCount }} Ta</span>
              </div>
            }

            <div class="earnings-stat-item">
              <span class="stat-item-title">Yetkazilgan buyurtmalar</span>
              <span class="stat-item-value-black">{{ filteredEarningsOrders.length }} Ta</span>
            </div>
          </div>

          <!-- Bottom detailed list of slots/days -->
          <div class="earnings-details-list">
            <div class="earnings-list-header">
              @if (earningsTab() === 'kun') {
                Yakunlangan smenalar
              } @else if (earningsTab() === 'hafta') {
                Haftalik kunlik hisobotlar
              } @else {
                Oylik kunlik hisobotlar
              }
            </div>
            
            <div class="earnings-list-items">
              @for (item of groupedEarningsReport; track item.id) {
                <div class="earnings-list-row" 
                     [style.background]="item.isCancelled ? 'rgba(239,68,68,0.06)' : ''"
                     [style.border-left]="item.isCancelled ? '3px solid #ef4444' : '3px solid transparent'"
                     (click)="item.isCancelled ? null : (item.type === 'slot' ? selectedShiftDetailId.set(item.id) : selectDayFromReport(item.date))" 
                     [style.cursor]="item.isCancelled ? 'default' : 'pointer'">
                  <div class="earnings-row-left">
                    <div class="clock-circle-icon" [style.background]="item.isCancelled ? 'rgba(239,68,68,0.12)' : (item.type === 'day' ? '#eef4ff' : '#f5f5f7')">
                      <span>{{ item.isCancelled ? '🚫' : (item.type === 'day' ? '📅' : '⏰') }}</span>
                    </div>
                    <div class="earnings-row-text">
                      <div class="earnings-row-time" [style.color]="item.isCancelled ? '#ef4444' : ''">{{ item.title }}</div>
                      <div class="earnings-row-sub">{{ item.subtitle }}</div>
                    </div>
                  </div>
                  <div class="earnings-row-right">
                    <span class="earnings-row-amount" [style.color]="item.isCancelled ? '#ef4444' : (item.amount > 0 ? '#10b981' : '#777')">
                      {{ item.isCancelled ? '' : '' }}{{ item.amount | number:'1.0-0' }} so'm
                    </span>
                    @if (!item.isCancelled) {
                      <span class="chevron-right">➔</span>
                    }
                  </div>
                </div>
              } @empty {
                <div class="earnings-empty-row">
                  Ushbu davrda hech qanday ma'lumot topilmadi
                </div>
              }
            </div>
          </div>

        </div>
      </div>
    }

    <!-- ===== SHIFT DETAILS MODAL (2-RASM) ===== -->
    @if (selectedShiftDetailId()) {
      @if (selectedShiftDetail; as detail) {
        <div class="shift-detail-overlay" (click)="selectedShiftDetailId.set(null)">
          <div class="shift-detail-modal animate-shift-detail" (click)="$event.stopPropagation()">
            
            <!-- Handle bar -->
            <div class="shift-detail-handle"></div>

            <!-- Header -->
            <div class="shift-detail-header">
              <span class="shift-detail-title">Smena</span>
              <button class="shift-detail-close-btn" (click)="selectedShiftDetailId.set(null)">✕</button>
            </div>

            <!-- Content Container -->
            <div class="shift-detail-content">
              
              <!-- Tafsilotlar section -->
              <div class="detail-section-title">
                Tafsilotlar <span class="blue-chevron">▼</span>
              </div>

              <!-- 2x2 grid stats -->
              <div class="shift-detail-grid">
                <div class="grid-cell">
                  <span class="cell-label">Smena davomiyligi ⓘ</span>
                  <span class="cell-val">{{ detail.duration }}</span>
                </div>
                <div class="grid-cell">
                  <span class="cell-label">Kafolat uchun buyurtmalar ⓘ</span>
                  <span class="cell-val">{{ detail.ordersCount }}</span>
                </div>
                <div class="grid-cell">
                  <span class="cell-label">Vaqt kafolati ⓘ</span>
                  <span class="cell-val">{{ detail.guarantee | number:'1.0-0' }} so'm</span>
                </div>
                <div class="grid-cell">
                  <span class="cell-label">Buyurtmalar yetkazmasi uchun ⓘ</span>
                  <span class="cell-val">{{ detail.earnings | number:'1.0-0' }} so'm</span>
                </div>
                @if (detail.penalty && detail.penalty > 0) {
                  <div class="grid-cell" style="background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.25);">
                    <span class="cell-label" style="color: #ef4444;">⚠️ Jarima (bekor qilish)</span>
                    <span class="cell-val" style="color: #ef4444;">-{{ detail.penalty | number:'1.0-0' }} so'm</span>
                  </div>
                }
                <div class="grid-cell full-width-cell">
                  <span class="cell-label">To'lovga ⓘ</span>
                  <span class="cell-val-blue" [style.color]="detail.netEarnings < 0 ? '#ef4444' : ''">
                    {{ detail.netEarnings | number:'1.0-0' }} so'm
                  </span>
                </div>
              </div>

              <!-- Delivered Orders cards -->
              <div class="shift-orders-list">
                @for (order of detail.orders; track order.id) {
                  <div class="shift-order-card">
                    <div class="shift-order-header">
                      <span class="shift-order-id">#{{ order.id }}</span>
                      <span class="shift-order-time-pill">{{ order.time }}</span>
                    </div>
                    <div class="shift-order-restaurant">{{ order.restaurantName }}</div>
                    
                    <div class="shift-order-earned-row">
                      <span class="earned-label">Buyurtmada ishlandi ⓘ</span>
                      <span class="earned-val">{{ order.totalFee | number:'1.0-0' }} so'm</span>
                    </div>

                    <!-- Breakdown details list -->
                    <div class="shift-order-breakdown">
                      <div class="breakdown-row">
                        <span class="breakdown-lbl">Restorangacha bo'lgan masofa</span>
                        <span class="breakdown-val-black">{{ order.restDist }} м</span>
                      </div>
                      <div class="breakdown-row">
                        <span class="breakdown-lbl">Buyurtma olinganligiga</span>
                        <span class="breakdown-val-black">{{ order.pickupFee | number:'1.0-0' }} so'm</span>
                      </div>
                      <div class="breakdown-row">
                        <span class="breakdown-lbl">Restoranga kelganingiz uchun ⓘ</span>
                        <span class="breakdown-val-black">{{ order.restArrivalBonus | number:'1.0-0' }} so'm</span>
                      </div>
                      <div class="breakdown-row">
                        <span class="breakdown-lbl">Mijozgacha bo'lgan masofa</span>
                        <span class="breakdown-val-black">{{ order.clientDist }} м</span>
                      </div>
                      <div class="breakdown-row">
                        <span class="breakdown-lbl">Mijozning oldiga kelganlik uchun ⓘ</span>
                        <span class="breakdown-val-black">{{ order.clientArrivalBonus | number:'1.0-0' }} so'm</span>
                      </div>
                    </div>

                    <button class="shift-order-status-btn" disabled>Yakunlandi</button>
                  </div>
                }
              </div>

            </div>

          </div>
        </div>
      }
    }

    <!-- ===== SMENA JADVALI MODAL ===== -->
    @if (showScheduleModal()) {
      <div class="schedule-overlay" (click)="closeScheduleModal()">
        <div class="schedule-modal" (click)="$event.stopPropagation()">
          <!-- Modal header -->
          <div class="schedule-modal-header">
            <button class="modal-back" (click)="closeScheduleModal()">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
            </button>
            <span class="schedule-modal-title">Smenalar jadvali</span>
            <button class="modal-filter" id="schedule-filter">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="11" y1="18" x2="13" y2="18"/>
              </svg>
            </button>
          </div>

          <!-- Hafta navigatsiyasi va kalendari -->
          <div class="calendar-nav-header">
            <button class="cal-nav-btn" (click)="prevWeek()">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
            </button>
            <span class="cal-month-title">{{ currentWeekMonthLabel() }}</span>
            <button class="cal-nav-btn" (click)="nextWeek()">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </button>
          </div>

          <div class="week-calendar">
            @for (day of weekDays; track day.date) {
              <div class="week-day" [class.week-day-active]="day.date === selectedDate()" (click)="selectCalendarDay(day)">
                <span class="week-day-name">{{ day.label }}</span>
                <span class="week-day-num">{{ day.dayNum }}</span>
                @if (day.hasSlot) {
                  <span class="week-day-dot"></span>
                }
              </div>
            }
          </div>

          <!-- Smenalar ro'yxati -->
          <div class="schedule-slots-list">
            @if (slotLoading()) {
              <div class="center-spinner"><mat-spinner diameter="30" color="warn"></mat-spinner></div>
            } @else if (filteredAvailableSlots.length === 0) {
              <div class="schedule-empty">
                <div class="schedule-empty-text">
                  Smenalar tugadi, yangi smenalar qo'shilganligi haqida bildirishnoma keladi
                </div>
              </div>
            } @else {
              @for (slot of filteredAvailableSlots; track slot.id) {
                <div class="schedule-slot-item" [class.schedule-slot-ready]="slotCanStart(slot)" [class.schedule-slot-booked]="isBookedByMe(slot)" [id]="'sch-slot-' + slot.id">
                  <div class="schedule-slot-left">
                    <div class="schedule-slot-time">
                      {{ formatSlotDate(slot.date) }}, {{ slot.startTime | slice:0:5 }} – {{ slot.endTime | slice:0:5 }}
                    </div>
                    <div class="schedule-slot-meta">
                      <span>{{ slot.name }}</span>
                      @if (isBookedByMe(slot)) {
                        <span class="schedule-booked-tag">· 🔒 Sizniki (Band)</span>
                      } @else if (slot.courier) {
                        <span class="schedule-assigned-tag">· 👤 Band ({{ slot.courier.name }})</span>
                      } @else {
                        <span class="schedule-open-tag">· 🔓 Ochiq</span>
                      }
                    </div>
                  </div>
                  <div class="schedule-slot-right">
                    @if (isBookedByMe(slot) || slot.courier?.id === auth.userId()) {
                      <div class="schedule-btn-group">
                        @if (slotCanStart(slot) && !activeSlot()) {
                          <button class="schedule-start-btn" (click)="startSlot(slot.id)" [disabled]="slotLoading()" [id]="'sch-start-' + slot.id">
                            Boshlash
                          </button>
                        } @else if (!slot.started) {
                          <button class="schedule-cancel-btn" (click)="confirmAndCancelSlot(slot.id)" [disabled]="slotLoading()" [id]="'sch-cancel-' + slot.id">
                            Bekor qilish
                          </button>
                        } @else {
                          <span class="schedule-active-tag">Boshlangan</span>
                        }
                      </div>
                    } @else if (!slot.courier && !slot.bookedBy) {
                      <button class="schedule-book-btn" (click)="bookSlot(slot.id)" [disabled]="slotLoading()" [id]="'sch-book-' + slot.id">
                        Band qilish
                      </button>
                    }
                  </div>
                </div>
              }
            }
          </div>

          <!-- Modal pastki tugma -->
          <div class="schedule-modal-footer">
            <button class="notify-btn" id="notify-btn">
              Smenalar yangilanishi haqida
            </button>
          </div>
        </div>
      </div>
    }

    <!-- ===== CUSTOM PENALTY CONFIRM DIALOG ===== -->
    @if (showCancelConfirm() && cancelPenaltyInfo()) {
      <div class="confirm-overlay" (click)="closeCancelConfirm()">
        <div class="confirm-card animate-confirm" (click)="$event.stopPropagation()">
          <div class="confirm-icon-wrap">⚠️</div>
          <h3 class="confirm-heading">Smenani bekor qilasizmi?</h3>
          <div class="confirm-body">
            <p>Ushbu smenani bekor qilish uchun jarima qo'llaniladi:</p>
            <div class="confirm-stats-box">
              <div class="confirm-stat-item">
                <span class="confirm-stat-lbl">Smena muddati</span>
                <span class="confirm-stat-val">{{ cancelPenaltyInfo()!.hours }} soat</span>
              </div>
              <div class="confirm-stat-item">
                <span class="confirm-stat-lbl">Jarima summasi</span>
                <span class="confirm-stat-val penalty-alert">{{ cancelPenaltyInfo()!.amount | number:'1.0-0' }} so'm</span>
              </div>
            </div>
            <p class="confirm-hint">Jarima summasi balansingizdan avtomatik ravishda chegirib tashlanadi.</p>
          </div>
          <div class="confirm-actions">
            <button class="confirm-btn-no" (click)="closeCancelConfirm()">Orqaga</button>
            <button class="confirm-btn-yes" (click)="executeCancelSlot()">Bekor qilish</button>
          </div>
        </div>
      </div>
    }

    <!-- ===== SMENA DETAIL MODAL (FULL SCREEN) ===== -->
    @if (selectedDetailSlot()) {
      <div class="schedule-overlay" (click)="closeSlotDetails()">
        <div class="schedule-modal" (click)="$event.stopPropagation()">
          <!-- Modal header -->
          <div class="schedule-modal-header">
            <button class="modal-back" (click)="closeSlotDetails()">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
            </button>
            <span class="schedule-modal-title">Smena haqida</span>
            <div style="width: 36px;"></div>
          </div>

          <!-- Body -->
          <div class="slot-details-body">
            <div class="slot-details-icon">⏰</div>
            <h3 class="slot-details-name">{{ selectedDetailSlot()!.name }}</h3>
            
            <div class="slot-details-list">
              <div class="slot-details-item">
                <span class="details-lbl">Sana</span>
                <span class="details-val">{{ formatSlotDate(selectedDetailSlot()!.date) }}</span>
              </div>
              <div class="slot-details-item">
                <span class="details-lbl">Vaqt</span>
                <span class="details-val">{{ selectedDetailSlot()!.startTime | slice:0:5 }} – {{ selectedDetailSlot()!.endTime | slice:0:5 }}</span>
              </div>
              <div class="slot-details-item">
                <span class="details-lbl">Holat</span>
                <span class="details-val">
                  @if (selectedDetailSlot()!.started) {
                    <span style="color: #10b981; font-weight: 700;">🟢 Faol smena</span>
                  } @else {
                    <span style="color: #4b6bfb; font-weight: 700;">🔒 Band qilingan</span>
                  }
                </span>
              </div>
              @if (!selectedDetailSlot()!.started) {
                <div class="slot-details-item">
                  <span class="details-lbl">Boshlanishiga</span>
                  <span class="details-val" style="color: #f59e0b; font-weight: 700;">
                    {{ slotCanStart(selectedDetailSlot()!) ? 'Hozir boshlash mumkin' : timeUntilSlot(selectedDetailSlot()!) }}
                  </span>
                </div>
              }
            </div>

            @if (!selectedDetailSlot()!.started) {
              <div class="slot-cancel-warning-box">
                ⚠️ DIQQAT: Smenani bekor qilsangiz, soatiga 30,000 so'm jarima hisoblanadi.
              </div>
            }
          </div>

          <!-- Footer -->
          <div class="slot-details-footer">
            @if (!selectedDetailSlot()!.started) {
              <div style="display: flex; flex-direction: column; gap: 10px; width: 100%;">
                @if (slotCanStart(selectedDetailSlot()!) && !activeSlot()) {
                  <button class="start-slot-action-btn" (click)="startSlotFromDetails(selectedDetailSlot()!.id)">
                    ▶ Boshlash
                  </button>
                }
                <button class="cancel-slot-action-btn" (click)="cancelSlotFromDetails(selectedDetailSlot()!.id)">
                  Bekor qilish
                </button>
              </div>
            } @else {
              <div style="text-align: center; color: #777; font-size: 0.82rem; width: 100%; padding: 6px; font-weight: 500; font-family: 'Poppins', sans-serif;">
                🟢 Smena faol holatda. Uni faqat admin bekor qilishi mumkin.
              </div>
            }
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    /* ===== ASOSIY KONTEYNER ===== */
    :host {
      display: block;
      height: 100vh;
      background: var(--bg);
      font-family: 'Poppins', -apple-system, sans-serif;
    }

    .courier-app {
      height: 100%;
      display: flex;
      flex-direction: column;
      background: var(--bg);
      position: relative;
    }

    .tab-content {
      flex: 1;
      overflow-y: auto;
      padding-bottom: 80px;
    }

    .animate-tab {
      animation: fadeSlideIn 0.22s ease both;
    }
    @keyframes fadeSlideIn {
      from { opacity: 0; transform: translateY(10px); }
      to   { opacity: 1; transform: none; }
    }

    /* ===== JADVAL TAB ===== */
    .jadval-header {
      padding: 20px 16px 8px;
      background: var(--bg-card);
      border-bottom: 1px solid var(--border);
    }
    .jadval-title {
      font-size: 1.1rem;
      font-weight: 700;
      color: var(--text);
      margin: 0;
    }

    /* Smena kartochkasi (jadval) */
    .my-slot-card {
      margin: 10px 16px 0;
      background: var(--bg-card);
      border-radius: 14px;
      padding: 14px 16px;
      box-shadow: var(--shadow);
      border: 1px solid var(--border);
      position: relative;
    }
    .my-slot-card.slot-can-start {
      border-left: 3px solid var(--primary);
    }
    .my-slot-card.active-my-slot {
      border-left: 3px solid var(--success);
      background: linear-gradient(135deg, rgba(16,185,129,0.08), var(--bg-card));
    }
    .my-slot-date {
      font-size: 0.95rem;
      font-weight: 700;
      color: var(--text);
      margin-bottom: 4px;
    }
    .my-slot-meta {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.82rem;
      flex-wrap: wrap;
    }
    .my-slot-name  { color: var(--text-muted); }
    .my-slot-dot   { color: var(--border); }
    .my-slot-status { color: var(--success); font-weight: 600; }
    .my-slot-booked-status { color: var(--primary); font-weight: 600; }
    .my-slot-wait  { color: var(--warning); }

    .slot-actions-inline {
      display: flex;
      gap: 8px;
      margin-top: 10px;
    }
    .start-slot-inline {
      background: var(--primary);
      color: #fff;
      border: none;
      border-radius: 10px;
      padding: 8px 18px;
      font-family: 'Poppins', sans-serif;
      font-weight: 600;
      font-size: 0.85rem;
      cursor: pointer;
      transition: opacity 0.2s;
    }
    .cancel-slot-inline {
      background: rgba(239,68,68,0.08);
      color: var(--danger);
      border: 1px solid rgba(239,68,68,0.15);
      border-radius: 10px;
      padding: 8px 18px;
      font-family: 'Poppins', sans-serif;
      font-weight: 600;
      font-size: 0.85rem;
      cursor: pointer;
      transition: background 0.2s;
    }
    .cancel-slot-inline:hover { background: rgba(239,68,68,0.14); }

    /* Yangi buyurtmalar */
    .section-divider {
      margin: 16px 16px 4px;
      font-size: 0.78rem;
      font-weight: 700;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }
    .order-mini-card {
      margin: 8px 16px 0;
      background: var(--bg-card);
      border-radius: 14px;
      padding: 14px 16px;
      box-shadow: var(--shadow);
      border: 1px solid var(--border);
    }
    .order-mini-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 4px;
    }
    .order-countdown {
      font-size: 0.78rem;
      font-weight: 700;
      color: var(--primary);
      background: rgba(249, 115, 22, 0.1);
      padding: 3px 8px;
      border-radius: 6px;
      display: inline-flex;
      align-items: center;
      gap: 3px;
      font-family: monospace;
    }
    .countdown-critical {
      color: var(--danger) !important;
      background: rgba(239, 68, 68, 0.08) !important;
      animation: blinkText 1s infinite;
    }
    @keyframes blinkText {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.4; }
    }
    .order-mini-num  { font-weight: 700; color: var(--text); font-size: 0.9rem; }
    .order-mini-time { font-size: 0.8rem; color: var(--text-muted); }
    .order-mini-restaurant {
      font-size: 0.9rem;
      font-weight: 700;
      color: var(--text);
      margin: 6px 0 3px;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .order-mini-addr { font-size: 0.85rem; color: var(--text-muted); margin-bottom: 4px; }
    .order-mini-price { font-size: 0.85rem; color: var(--primary); font-weight: 600; margin-bottom: 10px; }

    .accept-mini-btn {
      width: 100%;
      background: var(--primary);
      color: #fff;
      border: none;
      border-radius: 10px;
      padding: 10px;
      font-family: 'Poppins', sans-serif;
      font-weight: 600;
      font-size: 0.9rem;
      cursor: pointer;
      display: flex; align-items: center; justify-content: center; gap: 6px;
      transition: opacity 0.2s;
    }
    .need-slot-warn {
      text-align: center; font-size: 0.82rem; color: var(--warning); font-weight: 500;
      background: rgba(245,158,11,0.08); border-radius: 8px; padding: 8px;
    }

    /* Bo'sh holat */
    .empty-slots {
      text-align: center;
      padding: 60px 20px 20px;
      color: var(--text-muted);
    }
    .empty-slots-icon { font-size: 3rem; margin-bottom: 12px; }
    .empty-slots p    { font-size: 0.95rem; font-weight: 600; color: var(--text); margin-bottom: 6px; }
    .empty-slots span { font-size: 0.82rem; color: var(--text-muted); }

    /* Pastki tugma */
    .bottom-action-bar {
      padding: 16px;
      position: sticky;
      bottom: 64px;
      background: transparent;
    }

    /* ===== SMENA TAB ===== */
    .smena-tab {
      padding-bottom: 80px !important;
      display: flex;
      flex-direction: column;
    }
    .map-container {
      position: relative;
      flex-shrink: 0;
    }
    .main-map {
      width: 100%;
      height: 280px;
      background: var(--bg-card2);
    }
    .map-route-btn {
      position: absolute;
      bottom: 16px;
      left: 50%;
      transform: translateX(-50%);
      background: var(--primary);
      color: #fff;
      border: none;
      border-radius: 24px;
      padding: 12px 24px;
      font-family: 'Poppins', sans-serif;
      font-weight: 700;
      font-size: 0.9rem;
      cursor: pointer;
      display: flex; align-items: center; gap: 8px;
      box-shadow: 0 4px 20px rgba(249,115,22,0.4);
      white-space: nowrap;
    }

    .smena-info-panel {
      background: var(--bg-card);
      border-radius: 20px 20px 0 0;
      margin-top: -12px;
      padding: 20px 16px;
      flex: 1;
      border: 1px solid var(--border);
      border-bottom: none;
    }
    .smena-info-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 16px;
    }
    .smena-info-label {
      font-size: 0.75rem;
      color: var(--text-muted);
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 2px;
    }
    .smena-info-name {
      font-size: 1.1rem;
      font-weight: 700;
      color: var(--text);
    }
    .smena-info-time-badge {
      background: var(--bg-card2);
      border-radius: 10px;
      padding: 6px 12px;
      font-size: 0.82rem;
      color: var(--text);
      font-weight: 600;
      white-space: nowrap;
      border: 1px solid var(--border);
    }
    .smena-stats-row {
      display: flex;
      align-items: center;
      gap: 16px;
      background: var(--bg-card2);
      border-radius: 14px;
      padding: 14px 16px;
      margin-bottom: 16px;
      border: 1px solid var(--border);
    }
    .smena-stat { display: flex; align-items: center; gap: 10px; flex: 1; }
    .smena-stat-icon { font-size: 1.4rem; }
    .smena-stat-val { font-size: 0.92rem; font-weight: 700; color: var(--text); }
    .smena-stat-lbl { font-size: 0.75rem; color: var(--text-muted); margin-top: 1px; }
    .smena-divider { width: 1px; height: 36px; background: var(--border); flex-shrink: 0; }

    .active-order-card {
      background: var(--bg-card2);
      border-radius: 14px;
      padding: 14px;
      margin-bottom: 14px;
      border-left: 3px solid var(--primary);
      border-top: 1px solid var(--border);
      border-right: 1px solid var(--border);
      border-bottom: 1px solid var(--border);
    }
    .active-order-top {
      display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;
    }
    .active-order-num { font-weight: 700; color: var(--text); font-size: 0.9rem; }
    .active-order-addr { font-size: 0.85rem; color: var(--text-muted); margin-bottom: 12px; }
    .active-order-actions { display: flex; gap: 8px; }

    .status-pill {
      font-size: 0.72rem; font-weight: 600; padding: 3px 10px; border-radius: 20px;
    }
    .pill-courier_accepted    { background: rgba(249,115,22,0.12); color: var(--primary); }
    .pill-courier_at_restaurant { background: rgba(245,158,11,0.12); color: var(--warning); }
    .pill-delivering          { background: rgba(16,185,129,0.12); color: var(--success); }
    .pill-courier_at_client   { background: rgba(99,102,241,0.12); color: #818cf8; }
    .pill-delivered           { background: rgba(16,185,129,0.12); color: var(--success); }

    .action-pill-btn {
      flex: 1;
      background: var(--primary);
      color: #fff;
      border: none;
      border-radius: 12px;
      padding: 10px 12px;
      font-family: 'Poppins', sans-serif;
      font-weight: 600;
      font-size: 0.82rem;
      cursor: pointer;
    }
    .success-pill { background: var(--success) !important; }

    .end-slot-btn {
      width: 100%;
      background: rgba(239,68,68,0.08);
      border: 1.5px solid rgba(239,68,68,0.3);
      color: var(--danger);
      border-radius: 14px;
      padding: 14px;
      font-family: 'Poppins', sans-serif;
      font-weight: 700;
      font-size: 0.9rem;
      cursor: pointer;
      display: flex; align-items: center; justify-content: center; gap: 8px;
      margin-top: 8px;
    }

    .no-smena-info {
      text-align: center;
      padding: 20px 0 24px;
    }
    .no-smena-label { font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; }
    .no-smena-text  { font-size: 1.2rem; font-weight: 700; color: var(--text); margin: 6px 0 4px; }
    .no-smena-sub   { font-size: 0.85rem; color: var(--text-muted); }

    /* ===== PROFIL TAB ===== */
    .profil-header {
      background: var(--bg-card);
      padding: 28px 16px 20px;
      text-align: center;
      border-bottom: 1px solid var(--border);
    }
    .profil-avatar-wrap { display: flex; justify-content: center; margin-bottom: 12px; }
    .profil-avatar {
      width: 72px; height: 72px; border-radius: 50%;
      background: linear-gradient(135deg, var(--primary), var(--primary-dark));
      display: flex; align-items: center; justify-content: center;
      font-size: 1.8rem; font-weight: 800; color: #fff;
    }
    .profil-name  { font-size: 1.05rem; font-weight: 800; color: var(--text); margin-bottom: 2px; }
    .profil-phone { font-size: 0.85rem; color: var(--text-muted); }

    .yandex-profile-cards {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin: 14px 16px 0;
    }
    .yandex-card {
      background: var(--bg-card);
      border-radius: 16px;
      padding: 14px 16px;
      display: flex;
      align-items: center;
      gap: 10px;
      box-shadow: var(--shadow);
      border: 1px solid var(--border);
      text-align: left;
    }
    .yandex-card-icon {
      font-size: 1.6rem;
    }
    .yandex-card-info {
      display: flex;
      flex-direction: column;
    }
    .yandex-card-lbl {
      font-size: 0.72rem;
      color: var(--text-muted);
      font-weight: 500;
    }
    .yandex-card-val {
      font-size: 0.88rem;
      font-weight: 700;
      color: var(--text);
      margin-top: 1px;
    }


    .earnings-card {
      margin: 14px 16px 0;
      background: var(--bg-card2);
      border-radius: 18px;
      padding: 20px;
      color: var(--text);
      border: 1px solid var(--border);
    }
    .earnings-header {
      display: flex; justify-content: space-between; align-items: center;
      font-size: 0.9rem; color: var(--text-muted); margin-bottom: 10px;
    }
    .earnings-amount { font-size: 2rem; font-weight: 800; color: var(--text); }

    .profil-stats-row {
      display: grid; grid-template-columns: repeat(3,1fr); gap: 10px;
      margin: 12px 16px 0;
    }
    .profil-stat-card {
      background: var(--bg-card); border-radius: 14px; padding: 14px 10px;
      text-align: center; box-shadow: var(--shadow); border: 1px solid var(--border);
    }
    .profil-stat-icon { font-size: 1.3rem; margin-bottom: 6px; }
    .profil-stat-val  { font-size: 0.82rem; font-weight: 700; color: var(--text); margin-bottom: 2px; }
    .profil-stat-lbl  { font-size: 0.7rem; color: var(--text-muted); }

    .profil-menu {
      margin: 14px 16px 0;
      background: var(--bg-card);
      border-radius: 14px;
      overflow: hidden;
      border: 1px solid var(--border);
    }
    .profil-menu-item {
      display: flex; align-items: center; gap: 12px;
      padding: 15px 16px;
      cursor: pointer;
      border-bottom: 1px solid var(--border);
    }
    .profil-menu-icon { font-size: 1.1rem; width: 28px; text-align: center; }
    .profil-menu-item span:nth-child(2) { flex: 1; font-size: 0.92rem; font-weight: 500; color: var(--text); }
    .profil-chevron { font-size: 1.1rem; color: var(--text-muted); }

    /* ===== PASTKI NAVIGATSIYA ===== */
    .bottom-nav {
      position: fixed;
      bottom: 0; left: 0; right: 0;
      height: 64px;
      background: var(--bg-card);
      border-top: 1px solid var(--border);
      display: flex;
      z-index: 100;
      box-shadow: 0 -2px 16px rgba(0,0,0,0.3);
    }
    .nav-btn {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 3px;
      background: none;
      border: none;
      cursor: pointer;
      color: var(--text-muted);
      position: relative;
    }
    .nav-btn.nav-active { color: var(--primary); }
    .nav-icon-svg { display: flex; }
    .nav-label { font-size: 0.68rem; font-weight: 600; }
    .nav-badge {
      position: absolute;
      top: 6px; right: calc(50% - 18px);
      background: var(--danger);
      color: #fff;
      font-size: 0.6rem;
      font-weight: 700;
      width: 16px; height: 16px;
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
    }

    /* Modal trigger button */
    .open-schedule-btn {
      width: 100%;
      background: var(--primary);
      color: #fff;
      border: none;
      border-radius: 14px;
      padding: 16px;
      font-family: 'Poppins', sans-serif;
      font-weight: 700;
      font-size: 0.95rem;
      cursor: pointer;
      box-shadow: 0 4px 16px rgba(249,115,22,0.3);
    }

    .center-spinner { display: flex; justify-content: center; padding: 40px; }
    .center-tab { display: flex; align-items: center; justify-content: center; }
    .coming-soon { text-align: center; color: var(--text-muted); }
    .coming-icon { font-size: 3rem; margin-bottom: 12px; }

    /* ===== JADVAL MODAL (FULL SCREEN) ===== */
    .schedule-overlay {
      position: fixed; inset: 0;
      background: var(--bg);
      z-index: 1000;
      display: flex;
      align-items: stretch;
      justify-content: stretch;
    }

    .schedule-modal {
      width: 100%;
      height: 100vh;
      background: var(--bg);
      display: flex;
      flex-direction: column;
      animation: slideUpModal 0.25s ease-out;
    }

    @keyframes slideUpModal {
      from { transform: translateY(100%); }
      to   { transform: translateY(0); }
    }

    .schedule-modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 16px 12px;
      border-bottom: 1px solid var(--border);
    }
    .schedule-modal-title {
      font-size: 1rem;
      font-weight: 700;
      color: var(--text);
    }
    .modal-back, .modal-filter {
      background: none; border: none; cursor: pointer; color: var(--text);
      width: 36px; height: 36px;
      display: flex; align-items: center; justify-content: center;
      border-radius: 10px;
    }
    .modal-back:hover, .modal-filter:hover { background: var(--bg-card2); }

    .calendar-nav-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 16px 2px;
    }
    .cal-nav-btn {
      background: none; border: none; cursor: pointer; color: var(--primary);
      width: 32px; height: 32px;
      display: flex; align-items: center; justify-content: center;
      border-radius: 8px;
    }
    .cal-nav-btn:hover { background: rgba(249, 115, 22, 0.08); }
    .cal-month-title {
      font-size: 0.9rem;
      font-weight: 800;
      color: var(--text);
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .week-calendar {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      padding: 12px 8px 4px;
      gap: 4px;
    }
    .week-day {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      padding: 8px 4px;
      border-radius: 12px;
      cursor: pointer;
      position: relative;
    }
    .week-day:hover { background: var(--bg-card2); }
    .week-day-active { background: var(--primary) !important; }
    .week-day-active .week-day-name,
    .week-day-active .week-day-num { color: #fff !important; }
    .week-day-name { font-size: 0.68rem; font-weight: 600; color: var(--text-muted); }
    .week-day-num  { font-size: 0.9rem; font-weight: 700; color: var(--text); }
    .week-day-dot  {
      width: 5px; height: 5px; border-radius: 50%;
      background: var(--primary);
      position: absolute;
      bottom: 4px;
    }
    .week-day-active .week-day-dot { background: #fff; }

    .schedule-slots-list {
      flex: 1;
      overflow-y: auto;
      padding: 8px 0;
    }
    .schedule-empty {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 48px 32px;
    }
    .schedule-empty-text {
      text-align: center;
      font-size: 0.95rem;
      font-weight: 600;
      color: var(--text-muted);
      line-height: 1.5;
    }

    .schedule-slot-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 14px 16px;
      border-bottom: 1px solid var(--border);
      gap: 12px;
    }
    .schedule-slot-item:hover { background: var(--bg-card2); }
    .schedule-slot-item.schedule-slot-booked {
      border-left: 3px solid var(--primary);
      background: rgba(249, 115, 22, 0.03);
    }
    .schedule-slot-left { flex: 1; }
    .schedule-slot-time {
      font-size: 0.92rem;
      font-weight: 700;
      color: var(--text);
      margin-bottom: 3px;
    }
    .schedule-slot-meta {
      font-size: 0.8rem;
      color: var(--text-muted);
      display: flex; gap: 4px; flex-wrap: wrap;
    }
    .schedule-booked-tag { color: var(--primary); font-weight: 600; }
    .schedule-assigned-tag { color: var(--warning); font-weight: 500; }
    .schedule-open-tag { color: var(--success); font-weight: 500; }

    .schedule-slot-right { flex-shrink: 0; }
    .schedule-btn-group { display: flex; gap: 8px; }
    .schedule-start-btn {
      background: var(--primary);
      color: #fff;
      border: none;
      border-radius: 10px;
      padding: 8px 16px;
      font-family: 'Poppins', sans-serif;
      font-weight: 700;
      font-size: 0.82rem;
      cursor: pointer;
    }
    .schedule-cancel-btn {
      background: rgba(239,68,68,0.08);
      color: var(--danger);
      border: 1px solid rgba(239,68,68,0.15);
      border-radius: 10px;
      padding: 8px 16px;
      font-family: 'Poppins', sans-serif;
      font-weight: 700;
      font-size: 0.82rem;
      cursor: pointer;
    }
    .schedule-book-btn {
      background: var(--primary);
      color: #fff;
      border: none;
      border-radius: 10px;
      padding: 8px 16px;
      font-family: 'Poppins', sans-serif;
      font-weight: 700;
      font-size: 0.82rem;
      cursor: pointer;
    }
    .schedule-wait-tag   { font-size: 0.78rem; color: var(--warning); font-weight: 600; }
    .schedule-active-tag { font-size: 0.78rem; color: var(--success); font-weight: 600; }

    .schedule-modal-footer {
      padding: 12px 16px;
      border-top: 1px solid var(--border);
    }
    .notify-btn {
      width: 100%;
      background: var(--bg-card2);
      color: var(--primary);
      border: none;
      border-radius: 14px;
      padding: 16px;
      font-family: 'Poppins', sans-serif;
      font-weight: 700;
      font-size: 0.95rem;
      cursor: pointer;
      border: 1px solid var(--border);
    }

    /* ===== CUSTOM CONFIRM DIALOG ===== */
    .confirm-overlay {
      position: fixed; inset: 0;
      background: rgba(0, 0, 0, 0.7);
      backdrop-filter: blur(4px);
      z-index: 2000;
      display: flex; align-items: center; justify-content: center;
      padding: 24px;
      animation: overlayFadeIn 0.2s ease;
    }
    .confirm-card {
      background: var(--bg-card);
      border-radius: 20px;
      width: 100%;
      max-width: 340px;
      padding: 24px 20px;
      box-shadow: var(--shadow-lg);
      border: 1px solid var(--border);
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
    }
    .animate-confirm {
      animation: scaleUpConfirm 0.25s cubic-bezier(0.34, 1.3, 0.64, 1);
    }
    @keyframes scaleUpConfirm {
      from { transform: scale(0.85); opacity: 0; }
      to   { transform: scale(1); opacity: 1; }
    }
    .confirm-icon-wrap {
      width: 48px; height: 48px;
      border-radius: 50%;
      background: rgba(245, 158, 11, 0.1);
      color: var(--warning);
      font-size: 1.5rem;
      display: flex; align-items: center; justify-content: center;
      margin-bottom: 12px;
    }
    .confirm-heading {
      font-size: 1.05rem;
      font-weight: 800;
      color: var(--text);
      margin: 0 0 8px;
    }
    .confirm-body {
      font-size: 0.85rem;
      color: var(--text-muted);
      line-height: 1.5;
      width: 100%;
    }
    .confirm-stats-box {
      background: var(--bg-card2);
      border-radius: 12px;
      padding: 10px 14px;
      margin: 12px 0;
      display: flex;
      flex-direction: column;
      gap: 6px;
      border: 1px solid var(--border);
    }
    .confirm-stat-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .confirm-stat-lbl { color: var(--text-muted); font-weight: 500; }
    .confirm-stat-val { font-weight: 700; color: var(--text); }
    .confirm-stat-val.penalty-alert { color: var(--danger); }
    .confirm-hint {
      font-size: 0.76rem;
      color: var(--text-muted);
      margin: 0;
    }
    .confirm-actions {
      display: flex;
      flex-direction: column;
      gap: 8px;
      width: 100%;
      margin-top: 18px;
    }
    .confirm-btn-yes {
      background: var(--danger);
      color: #fff;
      border: none;
      border-radius: 12px;
      padding: 12px;
      font-family: 'Poppins', sans-serif;
      font-weight: 700;
      font-size: 0.88rem;
      cursor: pointer;
      width: 100%;
      transition: opacity 0.2s;
    }
    .confirm-btn-yes:hover { opacity: 0.9; }
    .confirm-btn-no {
      background: var(--bg-card2);
      color: var(--primary);
      border: none;
      border-radius: 12px;
      padding: 12px;
      font-family: 'Poppins', sans-serif;
      font-weight: 700;
      font-size: 0.88rem;
      cursor: pointer;
      width: 100%;
      transition: opacity 0.2s;
      border: 1px solid var(--border);
    }
    .confirm-btn-no:hover { opacity: 0.9; }

    /* ===== SLOT DETAILS MODAL ===== */
    .slot-details-body {
      padding: 30px 24px;
      display: flex;
      flex-direction: column;
      align-items: center;
      flex: 1;
      overflow-y: auto;
    }
    .slot-details-icon {
      font-size: 3.5rem;
      margin-bottom: 16px;
    }
    .slot-details-name {
      font-size: 1.25rem;
      font-weight: 800;
      color: var(--text);
      margin: 0 0 24px;
    }
    .slot-details-list {
      width: 100%;
      background: var(--bg-card2);
      border-radius: 16px;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-bottom: 20px;
      border: 1px solid var(--border);
    }
    .slot-details-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.88rem;
    }
    .details-lbl { color: var(--text-muted); font-weight: 500; }
    .details-val { color: var(--text); font-weight: 700; text-align: right; }
    
    .slot-cancel-warning-box {
      background: rgba(239, 68, 68, 0.05);
      border: 1px solid rgba(239, 68, 68, 0.1);
      border-radius: 12px;
      padding: 12px 16px;
      font-size: 0.78rem;
      color: var(--danger);
      line-height: 1.45;
      text-align: center;
      width: 100%;
    }

    .slot-details-footer {
      padding: 16px 20px;
      border-top: 1px solid var(--border);
      display: flex;
      justify-content: center;
      width: 100%;
      box-sizing: border-box;
    }

    .end-slot-action-btn {
      width: 100%;
      background: rgba(239,68,68,0.08);
      border: 1.5px solid rgba(239,68,68,0.3);
      color: var(--danger);
      border-radius: 14px;
      padding: 14px;
      font-family: 'Poppins', sans-serif;
      font-weight: 700;
      font-size: 0.95rem;
      cursor: pointer;
    }

    .start-slot-action-btn {
      width: 100%;
      background: var(--primary);
      color: #fff;
      border: none;
      border-radius: 14px;
      padding: 14px;
      font-family: 'Poppins', sans-serif;
      font-weight: 700;
      font-size: 0.95rem;
      cursor: pointer;
    }

    .cancel-slot-action-btn {
      width: 100%;
      background: rgba(239,68,68,0.08);
      color: var(--danger);
      border: 1px solid rgba(239,68,68,0.15);
      border-radius: 14px;
      padding: 14px;
      font-family: 'Poppins', sans-serif;
      font-weight: 700;
      font-size: 0.95rem;
      cursor: pointer;
    }

    /* ===== SWIPE BUTTON ===== */
    .swipe-container {
      width: 100%;
      height: 52px;
      background: var(--bg-card2);
      border-radius: 26px;
      position: relative;
      overflow: hidden;
      display: flex;
      align-items: center;
      cursor: pointer;
      user-select: none;
      box-shadow: inset 0 1px 3px rgba(0,0,0,0.2);
      border: 1px solid var(--border);
    }
    .swipe-track {
      width: 100%;
      height: 100%;
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .swipe-bg {
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      background: linear-gradient(90deg, var(--primary), var(--primary-dark));
      border-radius: 26px;
      transition: width 0.1s ease-out;
    }
    .swipe-handle {
      position: absolute;
      left: 2px;
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: var(--text);
      box-shadow: 0 2px 8px rgba(0,0,0,0.4);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 2;
      transition: transform 0.05s ease-out;
    }
    .swipe-arrow {
      font-size: 1.1rem;
      color: var(--primary);
      font-weight: 700;
    }
    .swipe-text {
      position: relative;
      font-size: 0.86rem;
      font-weight: 700;
      color: var(--primary);
      z-index: 1;
      pointer-events: none;
      transition: color 0.1s ease-out;
      font-family: 'Poppins', sans-serif;
    }

    /* ===== SEARCHING LAYOUT SYSTEM ===== */
    .map-searching-pill {
      position: absolute;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: var(--bg-card);
      border-radius: 20px;
      padding: 8px 16px;
      display: flex;
      align-items: center;
      gap: 8px;
      box-shadow: var(--shadow);
      z-index: 10;
      border: 1px solid var(--border);
    }
    .searching-pulse-dot {
      width: 8px;
      height: 8px;
      background-color: var(--success);
      border-radius: 50%;
      display: inline-block;
      animation: pulseSearching 1.5s infinite;
    }
    @keyframes pulseSearching {
      0% { transform: scale(0.9); opacity: 1; box-shadow: 0 0 0 0 rgba(16,185,129,0.7); }
      70% { transform: scale(1.1); opacity: 0.8; box-shadow: 0 0 0 8px rgba(16,185,129,0); }
      100% { transform: scale(0.9); opacity: 1; box-shadow: 0 0 0 0 rgba(16,185,129,0); }
    }
    .searching-pill-text {
      font-size: 0.82rem;
      font-weight: 700;
      color: var(--text);
      font-family: 'Poppins', sans-serif;
    }
    .map-menu-btn {
      position: absolute;
      top: 20px;
      right: 20px;
      width: 38px;
      height: 38px;
      background: var(--bg-card);
      border-radius: 50%;
      border: 1px solid var(--border);
      box-shadow: var(--shadow);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.25rem;
      font-weight: bold;
      color: var(--text);
      cursor: pointer;
      z-index: 10;
      transition: background 0.1s;
    }
    .map-menu-btn:active {
      background: var(--bg-card2);
    }
    .map-start-point-btn {
      position: absolute;
      bottom: 20px;
      left: 20px;
      background: var(--primary);
      color: #fff;
      border-radius: 20px;
      padding: 10px 16px;
      display: flex;
      align-items: center;
      font-size: 0.84rem;
      font-weight: 700;
      border: none;
      box-shadow: 0 4px 15px rgba(249, 115, 22, 0.3);
      cursor: pointer;
      z-index: 10;
      font-family: 'Poppins', sans-serif;
      transition: transform 0.1s;
    }
    .map-start-point-btn:active {
      transform: scale(0.96);
    }
    .map-controls-group {
      position: absolute;
      bottom: 20px;
      right: 20px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      z-index: 10;
    }
    .map-ctrl-btn {
      width: 36px;
      height: 36px;
      background: var(--bg-card);
      border-radius: 50%;
      border: 1px solid var(--border);
      box-shadow: var(--shadow);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.95rem;
      cursor: pointer;
      font-weight: 700;
      color: var(--text);
      transition: background 0.1s;
    }
    .map-ctrl-btn:active {
      background: var(--bg-card2);
    }
    .bottom-sheet-searching {
      border-radius: 28px 28px 0 0 !important;
      padding: 12px 20px 24px !important;
      background: var(--bg-card) !important;
      box-shadow: var(--shadow) !important;
      border: 1px solid var(--border) !important;
      border-bottom: none !important;
    }
    .bottom-sheet-handle {
      width: 40px;
      height: 4px;
      background: var(--border);
      border-radius: 2px;
      margin: 0 auto 18px;
    }
    .searching-details-row {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 20px;
      text-align: left;
    }
    .hourglass-icon-wrapper {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: var(--bg-card2);
      border: 1px solid var(--border);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .hourglass-emoji {
      font-size: 1.3rem;
    }
    .searching-text-block {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .searching-title {
      font-size: 1.15rem;
      font-weight: 800;
      color: var(--text);
      font-family: 'Poppins', sans-serif;
    }
    .searching-subtitle {
      font-size: 0.84rem;
      color: var(--text-muted);
      font-weight: 500;
      font-family: 'Poppins', sans-serif;
    }
    .searching-cards-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-bottom: 16px;
    }
    .searching-info-card {
      background: var(--bg-card2);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 14px;
      display: flex;
      align-items: center;
      gap: 10px;
      text-align: left;
    }
    .search-card-icon {
      font-size: 1.25rem;
    }
    .search-card-content {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .search-card-label {
      font-size: 0.72rem;
      font-weight: 700;
      color: var(--text-muted);
      font-family: 'Poppins', sans-serif;
    }
    .search-card-value {
      font-size: 0.86rem;
      font-weight: 800;
      color: var(--text);
      font-family: 'Poppins', sans-serif;
    }
    .smena-end-inline-btn {
      width: 100%;
      background: var(--bg-card2);
      border: 1px solid var(--border);
      border-radius: 14px;
      padding: 12px;
      font-weight: 700;
      font-size: 0.85rem;
      color: var(--text);
      cursor: pointer;
      margin-top: 6px;
      font-family: 'Poppins', sans-serif;
      transition: background 0.1s;
    }
    .smena-end-inline-btn:hover {
      background: #f3f3f3;
    }

    /* ===== VERIFICATION BOX ===== */
    .order-verification-box {
      background: #f8f8fb;
      border: 1.5px dashed #e5e5e5;
      border-radius: 14px;
      padding: 12px 14px;
      margin-top: 10px;
      text-align: left;
    }
    .verification-title {
      font-size: 0.76rem;
      font-weight: 700;
      color: #666;
      margin-bottom: 8px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .verification-items-list {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .verification-item {
      display: flex;
      align-items: center;
      font-size: 0.84rem;
      color: #111;
    }
    .verification-item-qty {
      font-weight: 700;
      color: #4b6bfb;
      margin-right: 8px;
      background: rgba(75,107,251,0.06);
      padding: 2px 6px;
      border-radius: 4px;
    }
    .verification-item-name {
      flex: 1;
      font-weight: 500;
    }
    .verification-item-price {
      color: #666;
      font-weight: 600;
    }
    
    /* Green verify swipe styles */
    .verify-swipe {
      background: #f0fdf4 !important;
      box-shadow: inset 0 1px 3px rgba(16,185,129,0.1) !important;
    }
    .verify-swipe-bg {
      background: linear-gradient(90deg, #10b981, #059669) !important;
    }
    .verify-swipe-text {
      color: #10b981 !important;
    }

    /* ===== INCOMING FULLSCREEN OVERLAY ===== */
    .incoming-order-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.65);
      backdrop-filter: blur(10px);
      z-index: 9999;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .incoming-order-card {
      background: #fff;
      border-radius: 28px;
      width: 100%;
      max-width: 350px;
      padding: 24px;
      box-shadow: 0 20px 50px rgba(0,0,0,0.3);
      display: flex;
      flex-direction: column;
      gap: 16px;
      border: 1px solid rgba(255,255,255,0.1);
      box-sizing: border-box;
    }
    .animate-incoming {
      animation: scaleUpIncoming 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    }
    @keyframes scaleUpIncoming {
      from { transform: scale(0.85); opacity: 0; }
      to   { transform: scale(1); opacity: 1; }
    }
    .incoming-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .incoming-badge {
      font-size: 0.74rem;
      font-weight: 800;
      color: #ff9800;
      background: rgba(255, 152, 0, 0.1);
      padding: 4px 10px;
      border-radius: 6px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .incoming-timer {
      font-size: 0.95rem;
      font-weight: 800;
      color: #4b6bfb;
      background: rgba(75, 107, 251, 0.08);
      padding: 4px 10px;
      border-radius: 8px;
      font-family: monospace;
    }
    .incoming-body {
      display: flex;
      flex-direction: column;
      gap: 8px;
      text-align: left;
    }
    .incoming-restaurant {
      font-size: 1.15rem;
      font-weight: 800;
      color: #111;
    }
    .incoming-address {
      font-size: 0.9rem;
      color: #555;
      line-height: 1.4;
    }
    .incoming-price {
      font-size: 1.1rem;
      color: #4b6bfb;
      font-weight: 700;
      margin-top: 4px;
    }
    .incoming-accept-btn {
      width: 100%;
      background: #4b6bfb;
      color: #fff;
      border: none;
      border-radius: 18px;
      padding: 16px;
      font-family: 'Poppins', sans-serif;
      font-weight: 700;
      font-size: 1rem;
      cursor: pointer;
      box-shadow: 0 6px 20px rgba(75, 107, 251, 0.35);
      transition: transform 0.1s;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .incoming-accept-btn:active {
      transform: scale(0.97);
    }
    .need-slot-warn-modal {
      text-align: center;
      background: rgba(239, 68, 68, 0.08);
      color: #ef4444;
      text-align: center;
      background: rgba(239, 68, 68, 0.08);
      color: #ef4444;
      font-weight: 700;
      font-size: 0.9rem;
      padding: 14px;
      border-radius: 16px;
    }

    /* ===== EARNINGS DETAILS SYSTEM ===== */
    .earnings-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.7);
      backdrop-filter: blur(8px);
      z-index: 1000;
      display: flex;
      align-items: stretch;
      justify-content: stretch;
    }
    .earnings-modal {
      width: 100%;
      height: 100vh;
      background: var(--bg);
      display: flex;
      flex-direction: column;
      overflow-y: auto;
    }
    .animate-earnings {
      animation: slideUpEarnings 0.28s cubic-bezier(0.32, 0.94, 0.6, 1);
    }
    @keyframes slideUpEarnings {
      from { transform: translateY(100%); }
      to   { transform: translateY(0); }
    }
    .earnings-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px;
      border-bottom: 1px solid var(--border);
    }
    .earnings-back-btn, .earnings-info-btn {
      background: none; border: none; cursor: pointer; color: var(--text);
      width: 36px; height: 36px;
      display: flex; align-items: center; justify-content: center;
      border-radius: 50%;
      transition: background 0.1s;
    }
    .earnings-back-btn:active, .earnings-info-btn:active {
      background: var(--bg-card2);
    }
    .earnings-title {
      font-size: 1.1rem;
      font-weight: 800;
      color: var(--text);
      font-family: 'Poppins', sans-serif;
    }
    .earnings-info-btn span {
      font-size: 1.2rem;
      font-weight: 700;
    }
    .earnings-tabs-container {
      display: flex;
      justify-content: center;
      margin: 20px 0 10px;
    }
    .earnings-tabs {
      background: var(--bg-card);
      border-radius: 12px;
      padding: 2px;
      display: flex;
      gap: 2px;
      border: 1px solid var(--border);
    }
    .earnings-tab-btn {
      background: none; border: none; border-radius: 10px;
      padding: 8px 24px;
      font-size: 0.86rem;
      font-weight: 700;
      color: var(--text-muted);
      cursor: pointer;
      font-family: 'Poppins', sans-serif;
      transition: background 0.15s, color 0.15s;
    }
    .earnings-tab-btn.active {
      background: var(--bg-card2);
      color: var(--text);
      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
      border: 1px solid var(--border);
    }
    .earnings-big-value-box {
      display: flex;
      flex-direction: column;
      align-items: center;
      margin: 12px 0 16px;
    }
    .earnings-big-num {
      font-size: 2.8rem;
      font-weight: 800;
      color: var(--text);
      line-height: 1;
      letter-spacing: -0.02em;
      font-family: 'Poppins', sans-serif;
    }
    .earnings-big-lbl {
      font-size: 0.95rem;
      color: var(--text-muted);
      font-weight: 600;
      margin-top: 6px;
      font-family: 'Poppins', sans-serif;
    }
    .earnings-nav-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 6px 20px 2px;
    }
    .earn-nav-btn {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: 10px;
      width: 34px;
      height: 34px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.4rem;
      font-weight: 700;
      color: var(--primary);
      cursor: pointer;
      transition: background 0.15s;
    }
    .earn-nav-btn:active { background: var(--bg-card2); }
    .earn-period-title {
      font-size: 0.85rem;
      font-weight: 700;
      color: var(--text);
      font-family: 'Poppins', sans-serif;
      flex: 1;
      text-align: center;
    }
    .earnings-calendar-slider {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      gap: 6px;
      padding: 8px 16px;
      background: var(--bg-card);
      border-radius: 16px;
      margin: 0 16px 20px;
      border: 1px solid var(--border);
    }
    .earnings-cal-day {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 8px 4px;
      border-radius: 12px;
      cursor: pointer;
      transition: background 0.15s;
    }
    .earnings-cal-day.active {
      background: var(--primary) !important;
    }
    .earnings-cal-day.active .earnings-cal-dayNum,
    .earnings-cal-day.active .earnings-cal-label {
      color: #fff !important;
    }
    .earnings-cal-dayNum {
      font-size: 0.9rem;
      font-weight: 800;
      color: var(--text);
      font-family: 'Poppins', sans-serif;
    }
    .earnings-cal-label {
      font-size: 0.65rem;
      color: var(--text-muted);
      font-weight: 700;
      margin-top: 2px;
      font-family: 'Poppins', sans-serif;
    }
    .earnings-stats-list {
      display: flex;
      flex-direction: column;
      padding: 0 16px;
      margin-bottom: 24px;
    }
    .earnings-stat-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 0;
      border-bottom: 1px solid var(--border);
    }
    .earnings-stat-left {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .arrow-down-icon {
      font-size: 0.75rem;
      color: var(--text-muted);
    }
    .stat-item-title {
      font-size: 0.9rem;
      font-weight: 600;
      color: var(--text-muted);
      font-family: 'Poppins', sans-serif;
    }
    .stat-item-value {
      font-size: 0.95rem;
      font-weight: 800;
      color: var(--primary);
      font-family: 'Poppins', sans-serif;
    }
    .stat-item-value-black {
      font-size: 0.95rem;
      font-weight: 800;
      color: var(--text);
      font-family: 'Poppins', sans-serif;
    }
    .earnings-details-list {
      background: var(--bg-card);
      flex: 1;
      border-radius: 28px 28px 0 0;
      padding: 20px 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      border-top: 1px solid var(--border);
    }
    .earnings-list-header {
      font-size: 0.95rem;
      font-weight: 800;
      color: var(--text);
      text-align: left;
      padding-left: 4px;
      font-family: 'Poppins', sans-serif;
    }
    .earnings-list-items {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .earnings-list-row {
      background: var(--bg-card2);
      border-radius: 18px;
      padding: 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-shadow: var(--shadow);
      border: 1px solid var(--border);
    }
    .earnings-row-left {
      display: flex;
      align-items: center;
      gap: 12px;
      text-align: left;
    }
    .clock-circle-icon {
      width: 38px;
      height: 38px;
      border-radius: 50%;
      background: var(--bg-card);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.15rem;
    }
    .earnings-row-text {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .earnings-row-time {
      font-size: 0.92rem;
      font-weight: 800;
      color: var(--text);
      font-family: 'Poppins', sans-serif;
    }
    .earnings-row-sub {
      font-size: 0.76rem;
      color: var(--text-muted);
      font-weight: 600;
      font-family: 'Poppins', sans-serif;
    }
    .earnings-row-right {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .earnings-row-amount {
      font-size: 0.92rem;
      font-weight: 800;
      color: var(--text);
      font-family: 'Poppins', sans-serif;
    }
    .chevron-right {
      font-size: 0.8rem;
      color: var(--text-muted);
    }
    .earnings-empty-row {
      font-size: 0.86rem;
      color: var(--text-muted);
      text-align: center;
      padding: 24px;
      font-weight: 500;
      font-family: 'Poppins', sans-serif;
    }

    /* ===== SHIFT DETAILS LAYOUT ===== */
    .shift-detail-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.7);
      backdrop-filter: blur(8px);
      z-index: 1100;
      display: flex;
      align-items: flex-end;
      justify-content: center;
    }
    .shift-detail-modal {
      width: 100%;
      max-width: 480px;
      max-height: 85vh;
      background: var(--bg-card);
      border-radius: 24px 24px 0 0;
      display: flex;
      flex-direction: column;
      overflow-y: auto;
      box-shadow: var(--shadow-lg);
      border: 1px solid var(--border);
      border-bottom: none;
    }
    .animate-shift-detail {
      animation: slideUpShiftDetail 0.28s cubic-bezier(0.32, 0.94, 0.6, 1);
    }
    @keyframes slideUpShiftDetail {
      from { transform: translateY(100%); }
      to   { transform: translateY(0); }
    }
    .shift-detail-handle {
      width: 36px;
      height: 4px;
      background: var(--border);
      border-radius: 2px;
      margin: 8px auto 0;
    }
    .shift-detail-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 18px;
      border-bottom: 1px solid var(--border);
    }
    .shift-detail-title {
      font-size: 1.15rem;
      font-weight: 800;
      color: var(--text);
      font-family: 'Poppins', sans-serif;
    }
    .shift-detail-close-btn {
      background: var(--bg-card2);
      border: 1px solid var(--border);
      border-radius: 50%;
      width: 30px;
      height: 30px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.85rem;
      font-weight: 700;
      color: var(--text);
      cursor: pointer;
    }
    .shift-detail-content {
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .detail-section-title {
      font-size: 1.05rem;
      font-weight: 800;
      color: var(--text);
      text-align: left;
      display: flex;
      align-items: center;
      gap: 6px;
      font-family: 'Poppins', sans-serif;
    }
    .blue-chevron {
      color: var(--primary);
      font-size: 0.75rem;
    }
    .shift-detail-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 14px;
      border-bottom: 1px solid var(--border);
      padding-bottom: 16px;
    }
    .grid-cell {
      display: flex;
      flex-direction: column;
      gap: 4px;
      text-align: left;
    }
    .full-width-cell {
      grid-column: span 2;
    }
    .cell-label {
      font-size: 0.8rem;
      color: var(--text-muted);
      font-weight: 600;
      font-family: 'Poppins', sans-serif;
    }
    .grid-cell .cell-val {
      font-size: 0.98rem;
      font-weight: 800;
      color: var(--text);
      font-family: 'Poppins', sans-serif;
    }
    .cell-val-blue {
      font-size: 0.98rem;
      font-weight: 800;
      color: var(--primary);
      font-family: 'Poppins', sans-serif;
    }
    .shift-orders-list {
      display: flex;
      flex-direction: column;
      gap: 14px;
    }
    .shift-order-card {
      background: var(--bg-card2);
      border-radius: 20px;
      padding: 16px;
      border: 1px solid var(--border);
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .shift-order-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .shift-order-id {
      font-size: 1.05rem;
      font-weight: 800;
      color: var(--text);
      font-family: 'Poppins', sans-serif;
    }
    .shift-order-time-pill {
      background: rgba(249, 115, 22, 0.1);
      color: var(--primary);
      font-size: 0.74rem;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 6px;
    }
    .shift-order-restaurant {
      font-size: 0.84rem;
      color: var(--text-muted);
      font-weight: 600;
      text-align: left;
      font-family: 'Poppins', sans-serif;
    }
    .shift-order-earned-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid var(--border);
      padding-bottom: 8px;
    }
    .earned-label {
      font-size: 0.86rem;
      color: var(--text);
      font-weight: 700;
      font-family: 'Poppins', sans-serif;
    }
    .earned-val {
      font-size: 0.92rem;
      font-weight: 800;
      color: var(--text);
      font-family: 'Poppins', sans-serif;
    }
    .shift-order-breakdown {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .breakdown-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .breakdown-lbl {
      font-size: 0.78rem;
      color: var(--text-muted);
      font-weight: 600;
      font-family: 'Poppins', sans-serif;
    }
    .breakdown-val-black {
      font-size: 0.8rem;
      color: var(--text);
      font-weight: 800;
      font-family: 'Poppins', sans-serif;
    }
    .shift-order-status-btn {
      width: 100%;
      background: rgba(249, 115, 22, 0.1);
      color: var(--primary);
      border: 1px solid rgba(249, 115, 22, 0.2);
      border-radius: 12px;
      padding: 10px;
      font-size: 0.84rem;
      font-weight: 800;
      font-family: 'Poppins', sans-serif;
    }
    @keyframes blink {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.3; }
    }
  `]
})
export class CourierDashboardComponent implements OnInit, OnDestroy {
  activeTab = signal<TabType>('jadval');
  showScheduleModal = signal(false);
  selectedDate = signal<string>(this.toLocalDateStr(new Date()));
  currentWeekMonday = signal<Date>(new Date());

  // Swipe-to-Confirm uchun o'zgaruvchilar va signallar
  swipePercent = signal<number>(0);
  swipeTranslateX = signal<number>(0);
  activeSwipingOrderId = signal<number | null>(null);
  showOrderItemsVerificationId = signal<number | null>(null);
  private startX = 0;
  private isSwiping = false;
  private isVerifySwipe = false;

  // Jarima confirm oynasi uchun signallar
  showCancelConfirm = signal(false);
  slotToCancel = signal<number | null>(null);
  cancelPenaltyInfo = signal<{ hours: number; amount: number } | null>(null);
  selectedDetailSlot = signal<Slot | null>(null);

  // Teskari sanoq va bildirishnoma signallari
  timeTick = signal<number>(0);
  private countdownInterval: any;
  private audioContext: any;

  allOrders   = signal<Order[]>([]);
  loading     = signal(true);
  actionLoading = signal<number | null>(null);

  activeRequests    = signal<Order[]>([]);
  currentDeliveries = signal<Order[]>([]);
  deliveredCount    = signal<number>(0);

  activeSlot     = signal<Slot | null>(null);
  myBookedSlots  = signal<Slot[]>([]);
  availableSlots = signal<Slot[]>([]);
  slotLoading    = signal(false);

  // Detailed Earnings modal signals and getters
  showEarningsModal = signal(false);
  earningsTab = signal<'kun' | 'hafta' | 'oy'>('kun');

  get filteredEarningsOrders(): Order[] {
    const tab = this.earningsTab();
    const selDate = new Date(this.selectedDate());
    const orders = this.allOrders().filter(o => o.status === 'DELIVERED');
    
    if (tab === 'kun') {
      const targetStr = this.selectedDate();
      return orders.filter(o => o.createdAt.startsWith(targetStr));
    } else if (tab === 'hafta') {
      const mon = new Date(this.currentWeekMonday());
      const sun = new Date(mon);
      sun.setDate(mon.getDate() + 6);
      
      const monStr = this.toLocalDateStr(mon);
      const sunStr = this.toLocalDateStr(sun);
      
      return orders.filter(o => {
        const dStr = o.createdAt.split('T')[0];
        return dStr >= monStr && dStr <= sunStr;
      });
    } else { // 'oy'
      const year = selDate.getFullYear();
      const month = selDate.getMonth();
      
      return orders.filter(o => {
        const d = new Date(o.createdAt);
        return d.getFullYear() === year && d.getMonth() === month;
      });
    }
  }

  get filteredEarningsTotal(): number {
    return this.filteredEarningsOrders.reduce((s, o) => s + (o.deliveryFee || 0), 0);
  }

  get filteredEarningsSlotsCount(): number {
    const tab = this.earningsTab();
    const selDate = new Date(this.selectedDate());
    const slots = this.myBookedSlots().filter(s => s.finished);
    
    if (tab === 'kun') {
      const targetStr = this.selectedDate();
      return slots.filter(s => s.date === targetStr).length;
    } else if (tab === 'hafta') {
      const mon = new Date(this.currentWeekMonday());
      const sun = new Date(mon);
      sun.setDate(mon.getDate() + 6);
      const monStr = this.toLocalDateStr(mon);
      const sunStr = this.toLocalDateStr(sun);
      return slots.filter(s => s.date >= monStr && s.date <= sunStr).length;
    } else { // 'oy'
      const year = selDate.getFullYear();
      const month = selDate.getMonth();
      return slots.filter(s => {
        const d = new Date(s.date);
        return d.getFullYear() === year && d.getMonth() === month;
      }).length;
    }
  }

  get filteredPenaltyTotal(): number {
    const tab = this.earningsTab();
    const selDate = new Date(this.selectedDate());
    const cancelled = this.myBookedSlots().filter(s => s.penaltyApplied && s.penaltyAmount && s.penaltyAmount > 0);
    if (tab === 'kun') {
      return cancelled.filter(s => s.date === this.selectedDate()).reduce((sum, s) => sum + (s.penaltyAmount || 0), 0);
    } else if (tab === 'hafta') {
      const mon = new Date(this.currentWeekMonday());
      const sun = new Date(mon);
      sun.setDate(mon.getDate() + 6);
      const monStr = this.toLocalDateStr(mon);
      const sunStr = this.toLocalDateStr(sun);
      return cancelled.filter(s => s.date >= monStr && s.date <= sunStr).reduce((sum, s) => sum + (s.penaltyAmount || 0), 0);
    } else {
      const year = selDate.getFullYear();
      const month = selDate.getMonth();
      return cancelled.filter(s => { const d = new Date(s.date); return d.getFullYear() === year && d.getMonth() === month; }).reduce((sum, s) => sum + (s.penaltyAmount || 0), 0);
    }
  }

  get filteredCancelledSlotsCount(): number {
    const tab = this.earningsTab();
    const selDate = new Date(this.selectedDate());
    const cancelled = this.myBookedSlots().filter(s => s.penaltyApplied && s.penaltyAmount && s.penaltyAmount > 0);
    if (tab === 'kun') {
      return cancelled.filter(s => s.date === this.selectedDate()).length;
    } else if (tab === 'hafta') {
      const mon = new Date(this.currentWeekMonday());
      const sun = new Date(mon);
      sun.setDate(mon.getDate() + 6);
      const monStr = this.toLocalDateStr(mon);
      const sunStr = this.toLocalDateStr(sun);
      return cancelled.filter(s => s.date >= monStr && s.date <= sunStr).length;
    } else {
      const year = selDate.getFullYear();
      const month = selDate.getMonth();
      return cancelled.filter(s => { const d = new Date(s.date); return d.getFullYear() === year && d.getMonth() === month; }).length;
    }
  }

  get filteredEarningsSlotsList() {
    const tab = this.earningsTab();
    const selDate = new Date(this.selectedDate());
    const slots = this.myBookedSlots().filter(s => s.finished || s.started);
    
    let filteredSlots = [];
    if (tab === 'kun') {
      const targetStr = this.selectedDate();
      filteredSlots = slots.filter(s => s.date === targetStr);
    } else if (tab === 'hafta') {
      const mon = new Date(this.currentWeekMonday());
      const sun = new Date(mon);
      sun.setDate(mon.getDate() + 6);
      const monStr = this.toLocalDateStr(mon);
      const sunStr = this.toLocalDateStr(sun);
      filteredSlots = slots.filter(s => s.date >= monStr && s.date <= sunStr);
    } else {
      const year = selDate.getFullYear();
      const month = selDate.getMonth();
      filteredSlots = slots.filter(s => {
        const d = new Date(s.date);
        return d.getFullYear() === year && d.getMonth() === month;
      });
    }
    
    return filteredSlots.map(s => {
      const dayOrders = this.allOrders().filter(o => o.status === 'DELIVERED' && o.createdAt.startsWith(s.date));
      const slotEarnings = dayOrders.reduce((sum, o) => sum + (o.deliveryFee || 0), 0);
      return {
        id: s.id,
        name: s.name,
        date: s.date,
        timeRange: `${s.startTime.toString().substring(0, 5)} - ${s.endTime.toString().substring(0, 5)}`,
        earnings: slotEarnings
      };
    });
  }

  get groupedEarningsReport() {
    const tab = this.earningsTab();
    const orders = this.allOrders().filter(o => o.status === 'DELIVERED');
    // Yakunlangan va boshlangan smenalar
    const completedSlots = this.myBookedSlots().filter(s => s.finished || s.started);
    // Bekor qilingan (jarima bilan) smenalar
    const cancelledSlots = this.myBookedSlots().filter(s => s.penaltyApplied && s.penaltyAmount && s.penaltyAmount > 0);

    if (tab === 'kun') {
      const targetStr = this.selectedDate();
      const targetSlots = completedSlots.filter(s => s.date === targetStr);
      const targetCancelled = cancelledSlots.filter(s => s.date === targetStr);
      const result = [
        ...targetSlots.map(s => {
          const dayOrders = orders.filter(o => o.createdAt.startsWith(s.date));
          const slotOrders = dayOrders.filter(o => {
            const oTime = o.createdAt.split('T')[1]?.substring(0, 5);
            return oTime >= s.startTime.substring(0, 5) && oTime <= s.endTime.substring(0, 5);
          });
          const slotEarnings = slotOrders.reduce((sum, o) => sum + (o.deliveryFee || 0), 0);
          return { type: 'slot', id: s.id, title: s.name, subtitle: `${s.startTime.substring(0, 5)} - ${s.endTime.substring(0, 5)}`, amount: slotEarnings, ordersCount: slotOrders.length, date: s.date, isCancelled: false };
        }),
        ...targetCancelled.map(s => ({
          type: 'slot-cancelled', id: s.id,
          title: `🚫 ${s.name} (bekor)`,
          subtitle: `${s.startTime.substring(0, 5)} - ${s.endTime.substring(0, 5)} · Jarima`,
          amount: -(s.penaltyAmount || 0), ordersCount: 0, date: s.date, isCancelled: true
        }))
      ];
      return result;
    }

    // Hafta va Oy uchun — yakunlangan + bekor qilingan smenalar ro'yxati
    let filteredSlots: typeof completedSlots = [];
    let filteredCancelled: typeof cancelledSlots = [];
    if (tab === 'hafta') {
      const mon = new Date(this.currentWeekMonday());
      const sun = new Date(mon);
      sun.setDate(mon.getDate() + 6);
      const monStr = this.toLocalDateStr(mon);
      const sunStr = this.toLocalDateStr(sun);
      filteredSlots = completedSlots.filter(s => s.date >= monStr && s.date <= sunStr);
      filteredCancelled = cancelledSlots.filter(s => s.date >= monStr && s.date <= sunStr);
    } else { // oy
      const selDate = new Date(this.selectedDate());
      const year = selDate.getFullYear();
      const month = selDate.getMonth();
      filteredSlots = completedSlots.filter(s => {
        const d = new Date(s.date);
        return d.getFullYear() === year && d.getMonth() === month;
      });
      filteredCancelled = cancelledSlots.filter(s => {
        const d = new Date(s.date);
        return d.getFullYear() === year && d.getMonth() === month;
      });
    }

    // Sanasi bo'yicha eng yangi smenadan eski smenaga tartibda
    filteredSlots = [...filteredSlots].sort((a, b) => b.date.localeCompare(a.date) || b.startTime.localeCompare(a.startTime));

    const monthsShort = ['yan','fev','mar','apr','may','iyn','iyl','avg','sen','okt','noy','dek'];
    const weekdayShort = ['Yak','Dush','Sesh','Chor','Pay','Jum','Shan'];

    const completedItems = filteredSlots.map(s => {
      const dayOrders = orders.filter(o => o.createdAt.startsWith(s.date));
      const slotOrders = dayOrders.filter(o => {
        const oTime = o.createdAt.split('T')[1]?.substring(0, 5);
        return oTime >= s.startTime.substring(0, 5) && oTime <= s.endTime.substring(0, 5);
      });
      const slotEarnings = slotOrders.reduce((sum, o) => sum + (o.deliveryFee || 0), 0);
      const d = new Date(s.date);
      const dateLabel = `${weekdayShort[d.getDay()]}, ${d.getDate()}-${monthsShort[d.getMonth()]}`;
      return { type: 'slot', id: s.id, title: s.name, subtitle: `${dateLabel} · ${s.startTime.substring(0, 5)} - ${s.endTime.substring(0, 5)}`, amount: slotEarnings, ordersCount: slotOrders.length, date: s.date, isCancelled: false };
    });

    const cancelledItems = filteredCancelled.map(s => {
      const d = new Date(s.date);
      const dateLabel = `${weekdayShort[d.getDay()]}, ${d.getDate()}-${monthsShort[d.getMonth()]}`;
      return { type: 'slot-cancelled', id: s.id, title: `🚫 ${s.name} (bekor)`, subtitle: `${dateLabel} · ${s.startTime.substring(0, 5)} - ${s.endTime.substring(0, 5)} · Jarima`, amount: -(s.penaltyAmount || 0), ordersCount: 0, date: s.date, isCancelled: true };
    });

    return [...completedItems, ...cancelledItems].sort((a, b) => b.date.localeCompare(a.date));
  }

  navigatePeriod(dir: number): void {
    const tab = this.earningsTab();
    if (tab === 'kun' || tab === 'hafta') {
      const mon = new Date(this.currentWeekMonday());
      mon.setDate(mon.getDate() + (dir * 7));
      this.currentWeekMonday.set(mon);
      this.buildWeekDays();
      if (tab === 'kun') {
        this.selectedDate.set(this.toLocalDateStr(mon));
      }
    } else if (tab === 'oy') {
      const selDate = new Date(this.selectedDate());
      selDate.setMonth(selDate.getMonth() + dir);
      this.selectedDate.set(this.toLocalDateStr(selDate));
    }
  }

  getPeriodLabel(): string {
    const tab = this.earningsTab();
    const months = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'];
    if (tab === 'kun') {
      const d = new Date(this.selectedDate());
      return `${d.getDate()}-${months[d.getMonth()]} ${d.getFullYear()}-yil`;
    } else if (tab === 'hafta') {
      const mon = new Date(this.currentWeekMonday());
      const sun = new Date(mon);
      sun.setDate(mon.getDate() + 6);
      return `${mon.getDate()}-${months[mon.getMonth()].substring(0, 3)} – ${sun.getDate()}-${months[sun.getMonth()]} ${sun.getFullYear()}`;
    } else { // 'oy'
      const d = new Date(this.selectedDate());
      return `${months[d.getMonth()]} ${d.getFullYear()}`;
    }
  }

  selectDayFromReport(dateStr: string): void {
    this.selectedDate.set(dateStr);
    this.earningsTab.set('kun');
    const d = new Date(dateStr);
    
    const dayOfWeek = d.getDay() === 0 ? 6 : d.getDay() - 1;
    const monday = new Date(d);
    monday.setDate(d.getDate() - dayOfWeek);
    this.currentWeekMonday.set(monday);
    this.buildWeekDays();
  }

  openEarningsModal(): void {
    this.showEarningsModal.set(true);
  }

  closeEarningsModal(): void {
    this.showEarningsModal.set(false);
  }

  selectedShiftDetailId = signal<number | null>(null);

  getShiftDuration(startTime: string, endTime: string): string {
    if (!startTime || !endTime) return '00:00';
    const [sh, sm] = startTime.split(':').map(Number);
    const [eh, em] = endTime.split(':').map(Number);
    let diff = (eh * 60 + em) - (sh * 60 + sm);
    if (diff < 0) diff += 24 * 60;
    const h = Math.floor(diff / 60);
    const m = diff % 60;
    return `${h < 10 ? '0' : ''}${h}:${m < 10 ? '0' : ''}${m}`;
  }

  getShiftGuarantee(startTime: string, endTime: string): number {
    if (!startTime || !endTime) return 0;
    const [sh, sm] = startTime.split(':').map(Number);
    const [eh, em] = endTime.split(':').map(Number);
    let diff = (eh * 60 + em) - (sh * 60 + sm);
    if (diff < 0) diff += 24 * 60;
    const hours = diff / 60;
    return Math.round(hours * 8000); // 8,000 UZS hourly guarantee
  }

  get selectedShiftDetail() {
    const id = this.selectedShiftDetailId();
    if (!id) return null;
    const s = this.myBookedSlots().find(slot => slot.id === id);
    if (!s) return null;
    
    // Delivered orders for this slot
    const dayOrders = this.allOrders().filter(o => o.status === 'DELIVERED' && o.createdAt.startsWith(s.date));
    
    const duration = this.getShiftDuration(s.startTime, s.endTime);
    const guarantee = this.getShiftGuarantee(s.startTime, s.endTime);
    const orderEarnings = dayOrders.reduce((sum, o) => sum + (o.deliveryFee || 0), 0);
    const penalty = s.penaltyAmount || 0;
    const netEarnings = orderEarnings - penalty;
    
    const mappedOrders = dayOrders.map(o => {
      const orderTime = new Date(o.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
      
      const totalFee = o.deliveryFee || 15000;
      const basePickup = 7000;
      const restDist = Math.floor((o.distance || 3) * 350) + 1200;
      const restArrivalBonus = Math.floor(restDist * 1.5);
      const clientDist = Math.floor((o.distance || 3) * 650) + 1800;
      const clientArrivalBonus = Math.max(0, totalFee - basePickup - restArrivalBonus);
      
      return {
        id: o.id,
        restaurantName: o.restaurant?.name || "Noma'lum restoran",
        time: orderTime,
        totalFee: totalFee,
        restDist: restDist,
        pickupFee: basePickup,
        restArrivalBonus: restArrivalBonus,
        clientDist: clientDist,
        clientArrivalBonus: clientArrivalBonus
      };
    });
    
    return {
      id: s.id,
      name: s.name,
      date: s.date,
      duration: duration,
      guarantee: guarantee,
      ordersCount: dayOrders.length,
      earnings: orderEarnings,
      penalty: penalty,
      netEarnings: netEarnings,
      orders: mappedOrders
    };
  }

  openFirstShiftDetail(): void {
    const list = this.filteredEarningsSlotsList;
    if (list.length > 0) {
      this.selectedShiftDetailId.set(list[0].id);
    }
  }

  get myPendingBookedSlots(): Slot[] {
    return this.myBookedSlots().filter(s => !s.started && !s.cancelled);
  }

  get filteredAvailableSlots(): Slot[] {
    const selDate = this.selectedDate();
    return this.availableSlots().filter(s => s.date === selDate);
  }

  weekDays: { label: string; dayNum: number; date: string; isToday: boolean; hasSlot: boolean }[] = [];

  get initial(): string {
    return (this.auth.user()?.name?.[0] ?? 'K').toUpperCase();
  }

  get activeDeliveriesCount(): number {
    return this.currentDeliveries().filter(o => o.status !== 'DELIVERED').length;
  }

  get totalEarnings(): number {
    return this.allOrders()
      .filter(o => o.status === 'DELIVERED')
      .reduce((s, o) => s + (o.deliveryFee || 0), 0);
  }

  get totalDistance(): number {
    return this.allOrders()
      .filter(o => o.status === 'DELIVERED')
      .reduce((s, o) => s + (o.distance || 0), 0);
  }

  private pollInterval: any;
  private mapsInitialized = new Set<string>();
  private courierStartCoords = [38.870000, 65.810000];

  constructor(
    private orderService: OrderService,
    public auth: AuthService,
    private snack: MatSnackBar
  ) {
    effect(() => {
      const deliveries = this.currentDeliveries();
      if (deliveries.length > 0) {
        setTimeout(() => {
          deliveries.forEach(order => {
            let restLat = 38.866127, restLng = 65.816309;
            if (order.restaurant?.latitude) { restLat = order.restaurant.latitude; restLng = order.restaurant.longitude!; }
            const restCoords = [restLat, restLng];
            if (order.status === 'COURIER_ACCEPTED') {
              const id = `map-restaurant-${order.id}`;
              if (!this.mapsInitialized.has(id)) this.initRouteMap(order.id, this.courierStartCoords, restCoords, id);
            } else if (order.status === 'DELIVERING') {
              const id = `map-client-${order.id}`;
              if (!this.mapsInitialized.has(id)) {
                const clientCoords = [order.latitude || 41.3111, order.longitude || 69.2797];
                this.initRouteMap(order.id, restCoords, clientCoords, id);
              }
            }
          });
        }, 500);
      }
    });
  }

  ngOnInit(): void {
    const today = new Date();
    const dayOfWeek = today.getDay() === 0 ? 6 : today.getDay() - 1;
    const monday = new Date(today);
    monday.setDate(today.getDate() - dayOfWeek);
    this.currentWeekMonday.set(monday);

    this.buildWeekDays();
    this.loadAll(true);
    this.loadSlots();
    this.auth.fetchMe().subscribe();
    this.pollInterval = setInterval(() => { 
      this.loadAll(false); 
      this.loadSlots(); 
      if (this.activeTab() === 'profil') {
        this.auth.fetchMe().subscribe();
      }
    }, 8000);

    // 1 soniyalik teskari sanoq va qo'ng'iroq ovozi timer
    this.countdownInterval = setInterval(() => {
      this.timeTick.update(v => v + 1);
      
      // Yangi buyurtmalar kutayotgan bo'lsa ovozli bildirishnoma berish
      if (this.activeRequests().length > 0) {
        if (this.timeTick() % 3 === 0) {
          this.playNotificationSound();
        }
      }
    }, 1000);
  }

  ngOnDestroy(): void {
    if (this.pollInterval) clearInterval(this.pollInterval);
    if (this.countdownInterval) clearInterval(this.countdownInterval);
  }

  switchTab(tab: TabType): void {
    this.activeTab.set(tab);
    if (tab === 'profil') {
      this.auth.fetchMe().subscribe();
    }
  }

  switchToSmena(): void {
    this.switchTab('smena');
    setTimeout(() => this.initMainMap(), 300);
  }

  buildWeekDays(): void {
    const monday = this.currentWeekMonday();
    const today = new Date();
    const labels = ['Dush', 'Sesh', 'Chor', 'Pay', 'Jum', 'Shan', 'Yak'];
    this.weekDays = labels.map((label, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return {
        label,
        dayNum: d.getDate(),
        date: this.toLocalDateStr(d),
        isToday: d.toDateString() === today.toDateString(),
        hasSlot: false
      };
    });
  }

  prevWeek(): void {
    const mon = new Date(this.currentWeekMonday());
    mon.setDate(mon.getDate() - 7);
    this.currentWeekMonday.set(mon);
    this.buildWeekDays();
    this.selectedDate.set(this.toLocalDateStr(mon));
  }

  nextWeek(): void {
    const mon = new Date(this.currentWeekMonday());
    mon.setDate(mon.getDate() + 7);
    this.currentWeekMonday.set(mon);
    this.buildWeekDays();
    this.selectedDate.set(this.toLocalDateStr(mon));
  }

  currentWeekMonthLabel(): string {
    const mon = this.currentWeekMonday();
    const months = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'];
    return `${months[mon.getMonth()]} ${mon.getFullYear()}`;
  }

  /** Date obyektidan mahalliy (local) sana stringini qaytaradi: YYYY-MM-DD */
  toLocalDateStr(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  selectCalendarDay(day: { date: string; isToday: boolean }): void {
    this.selectedDate.set(day.date);
  }

  loadAll(showLoader = true): void {
    if (showLoader) this.loading.set(true);
    this.orderService.getMyCourierOrders().subscribe({
      next: (orders) => {
        this.allOrders.set(orders);
        this.activeRequests.set(orders.filter(o => o.status === 'PREPARING'));
        this.currentDeliveries.set(orders.filter(o =>
          ['COURIER_ACCEPTED','COURIER_AT_RESTAURANT','DELIVERING','COURIER_AT_CLIENT','DELIVERED'].includes(o.status)
        ));
        this.deliveredCount.set(orders.filter(o => o.status === 'DELIVERED').length);
        if (showLoader) this.loading.set(false);
        if (this.activeTab() === 'smena') {
          setTimeout(() => this.initMainMap(), 200);
        }
      },
      error: () => { if (showLoader) this.loading.set(false); }
    });
  }

  loadSlots(): void {
    this.orderService.getCourierActiveSlot().subscribe({
      next: (res) => {
        this.activeSlot.set(res.hasActiveSlot && res.slot ? res.slot : null);
        this.loadMyBookedSlots();
        this.loadAvailableSlots();
      }
    });
  }

  loadMyBookedSlots(): void {
    this.orderService.getCourierAllSlots().subscribe({
      next: (slots: Slot[]) => this.myBookedSlots.set(slots)
    });
  }

  loadAvailableSlots(): void {
    this.orderService.getCourierAvailableSlots().subscribe({
      next: (slots) => this.availableSlots.set(slots.filter(s => !s.finished && !s.started && !s.cancelled))
    });
  }

  openSlotDetails(slot: Slot): void {
    this.selectedDetailSlot.set(slot);
  }

  closeSlotDetails(): void {
    this.selectedDetailSlot.set(null);
  }

  swipeText(status: string): string {
    switch (status) {
      case 'COURIER_ACCEPTED':
        return 'Restorandaman (Suring ➔)';
      case 'COURIER_AT_RESTAURANT':
        return 'Yo\'lga chiqdim (Suring ➔)';
      case 'DELIVERING':
        return 'Mijoz manzilidaman (Suring ➔)';
      case 'COURIER_AT_CLIENT':
        return 'Topshirdim (Suring ➔)';
      default:
        return 'Suring (Suring ➔)';
    }
  }

  onSwipeStart(event: MouseEvent | TouchEvent, order: Order, isVerifyStep = false): void {
    if (this.actionLoading() === order.id) return;
    this.isSwiping = true;
    this.isVerifySwipe = isVerifyStep;
    this.activeSwipingOrderId.set(order.id);
    this.startX = 'touches' in event ? event.touches[0].clientX : event.clientX;
    this.swipePercent.set(0);
    this.swipeTranslateX.set(0);

    const moveHandler = (e: MouseEvent | TouchEvent) => this.onSwipeMove(e);
    const endHandler = () => {
      this.onSwipeEnd(order);
      window.removeEventListener('mousemove', moveHandler);
      window.removeEventListener('mouseup', endHandler);
      window.removeEventListener('touchmove', moveHandler);
      window.removeEventListener('touchend', endHandler);
    };

    window.addEventListener('mousemove', moveHandler);
    window.addEventListener('mouseup', endHandler);
    window.addEventListener('touchmove', moveHandler, { passive: false });
    window.addEventListener('touchend', endHandler);
  }

  onSwipeMove(event: MouseEvent | TouchEvent): void {
    if (!this.isSwiping) return;
    const currentX = 'touches' in event ? event.touches[0].clientX : event.clientX;
    const diffX = currentX - this.startX;

    if (diffX < 0) {
      this.swipeTranslateX.set(0);
      this.swipePercent.set(0);
      return;
    }

    const maxDrag = 210;
    const dragVal = Math.min(diffX, maxDrag);
    const percent = Math.round((dragVal / maxDrag) * 100);

    this.swipeTranslateX.set(dragVal);
    this.swipePercent.set(percent);

    if ('touches' in event) {
      event.preventDefault();
    }
  }

  onSwipeEnd(order: Order): void {
    this.isSwiping = false;
    
    if (this.swipePercent() >= 90) {
      const isVerificationRequired = (order.status === 'COURIER_AT_RESTAURANT' || order.status === 'COURIER_AT_CLIENT');
      if (isVerificationRequired && !this.isVerifySwipe) {
        // Yo'lga chiqdim yoki Topshirdim surilganda buyurtma tarkibini ko'rsatamiz va statusni hali o'zgartirmaymiz
        this.showOrderItemsVerificationId.set(order.id);
      } else {
        // Boshqa barcha holatlarda (yoki Hammasi to'g'ri/topshirildi surilganda) amalni bajaramiz
        this.executeOrderAction(order);
      }
    }
    
    this.swipeTranslateX.set(0);
    this.swipePercent.set(0);
    this.activeSwipingOrderId.set(null);
  }

  executeOrderAction(order: Order): void {
    if (order.status === 'COURIER_ACCEPTED') {
      this.arriveAtRestaurant(order.id);
    } else if (order.status === 'COURIER_AT_RESTAURANT') {
      this.pickupFood(order.id);
      this.showOrderItemsVerificationId.set(null); // verification o'chirildi
    } else if (order.status === 'DELIVERING') {
      this.arriveAtClient(order.id);
    } else if (order.status === 'COURIER_AT_CLIENT') {
      this.deliverOrder(order.id);
      this.showOrderItemsVerificationId.set(null);
    }
  }

  cancelSlotFromDetails(slotId: number): void {
    this.closeSlotDetails();
    this.confirmAndCancelSlot(slotId);
  }

  startSlotFromDetails(slotId: number): void {
    this.closeSlotDetails();
    this.startSlot(slotId);
  }

  endSlotFromDetails(slotId: number): void {
    this.closeSlotDetails();
    this.endCurrentSlot();
  }

  openScheduleModal(): void { this.showScheduleModal.set(true); }
  closeScheduleModal(): void { this.showScheduleModal.set(false); }

  slotCanStart(slot: Slot): boolean {
    const now = new Date();
    // Sanani solishtirish
    const todayStr = now.getFullYear() + '-' + 
      String(now.getMonth() + 1).padStart(2, '0') + '-' + 
      String(now.getDate()).padStart(2, '0');
    
    if (slot.date !== todayStr) {
      return false;
    }

    const nowMin = now.getHours() * 60 + now.getMinutes();
    const [sh, sm] = slot.startTime.split(':').map(Number);
    const [eh, em] = slot.endTime.split(':').map(Number);
    return nowMin >= sh * 60 + sm && nowMin < eh * 60 + em;
  }

  getDelayTime(slot: Slot): string {
    this.timeTick(); // dynamic reactivity uchun
    const now = new Date();
    const [sh, sm] = slot.startTime.split(':').map(Number);
    const start = new Date(slot.date);
    start.setHours(sh, sm, 0, 0);

    const diffMs = now.getTime() - start.getTime();
    if (diffMs <= 0) return '00:00';

    const totalSeconds = Math.floor(diffMs / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    const pad = (num: number) => num < 10 ? '0' + num : num;
    return `${pad(minutes)}:${pad(seconds)}`;
  }

  timeUntilSlot(slot: Slot): string {
    const now = new Date();
    const nowMin = now.getHours() * 60 + now.getMinutes();
    const [sh, sm] = slot.startTime.split(':').map(Number);
    const diff = sh * 60 + sm - nowMin;
    if (diff <= 0) return '';
    if (diff < 60) return `${diff} daqiqadan keyin`;
    const h = Math.floor(diff / 60), m = diff % 60;
    return m > 0 ? `${h} soat ${m} daqiqadan keyin` : `${h} soatdan keyin`;
  }

  formatSlotDate(date: string): string {
    if (!date) return '';
    const d = new Date(date);
    const months = ['yan','fev','mar','apr','may','iyn','iyl','avg','sen','okt','noy','dek'];
    return `${d.getDate()} ${months[d.getMonth()]}`;
  }

  isBookedByMe(slot: Slot): boolean {
    return slot.bookedBy?.id === this.auth.userId();
  }

  getRemainingTime(order: Order): number {
    this.timeTick(); // dependency trigger
    if (!order.assignedAt) return 120;
    // Safari and older browsers might fail parsing ISO format with timezone sometimes, replace T and Z just in case
    let assignedStr = order.assignedAt;
    const assignedTime = new Date(assignedStr).getTime();
    const now = new Date().getTime();
    const diffSeconds = Math.floor((now - assignedTime) / 1000);
    const remaining = 120 - diffSeconds;
    return remaining > 0 ? remaining : 0;
  }

  getRemainingTimeLabel(order: Order): string {
    const remaining = this.getRemainingTime(order);
    const m = Math.floor(remaining / 60);
    const s = remaining % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  }

  playNotificationSound(): void {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      if (!this.audioContext) {
        this.audioContext = new AudioCtx();
      }
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume();
      }
      
      const ctx = this.audioContext;
      
      // Double beep sound effect
      const playBeep = (freq: number, startDelay: number, duration: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + startDelay);
        gain.gain.setValueAtTime(0.18, ctx.currentTime + startDelay);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + startDelay + duration);
        osc.start(ctx.currentTime + startDelay);
        osc.stop(ctx.currentTime + startDelay + duration);
      };
      
      playBeep(880, 0, 0.12);
      playBeep(1200, 0.15, 0.18);
    } catch (e) {
      console.warn('Audio feedback blocked by browser policies:', e);
    }
  }

  /** Smenani band qilish */
  bookSlot(slotId: number): void {
    this.slotLoading.set(true);
    this.orderService.bookSlot(slotId).subscribe({
      next: (slot) => {
        this.slotLoading.set(false);
        this.snack.open('✅ Smena muvaffaqiyatli band qilindi!', '', { duration: 3000 });
        this.loadSlots();
      },
      error: (err) => {
        this.slotLoading.set(false);
        this.snack.open(`❌ Xatolik: ${err.error?.message || 'Band qilib bo\'lmadi'}`, '', { duration: 4000 });
      }
    });
  }

  /** Smenani bekor qilish (Jarima ogohlantirishi bilan) */
  confirmAndCancelSlot(slotId: number): void {
    const slot = this.availableSlots().find(s => s.id === slotId) || this.myBookedSlots().find(s => s.id === slotId);
    if (!slot) return;

    const [sh, sm] = slot.startTime.split(':').map(Number);
    const [eh, em] = slot.endTime.split(':').map(Number);
    const minutes = (eh * 60 + em) - (sh * 60 + sm);
    const hours = Math.ceil(minutes / 60.0);
    const penaltyAmount = hours * 30000;

    this.slotToCancel.set(slotId);
    this.cancelPenaltyInfo.set({ hours, amount: penaltyAmount });
    this.showCancelConfirm.set(true);
  }

  executeCancelSlot(): void {
    const slotId = this.slotToCancel();
    if (!slotId) return;

    this.showCancelConfirm.set(false);
    this.slotLoading.set(true);

    this.orderService.cancelSlot(slotId).subscribe({
      next: (res) => {
        this.slotLoading.set(false);
        this.snack.open(`🔴 Smena bekor qilindi. Jarima: ${res.penaltyAmount.toLocaleString()} so'm`, '', { duration: 4500 });
        this.loadSlots();
        this.slotToCancel.set(null);
        this.cancelPenaltyInfo.set(null);
      },
      error: (err) => {
        this.slotLoading.set(false);
        this.snack.open(`❌ Xatolik: ${err.error?.message || 'Bekor qilib bo\'lmadi'}`, '', { duration: 4000 });
        this.slotToCancel.set(null);
        this.cancelPenaltyInfo.set(null);
      }
    });
  }

  closeCancelConfirm(): void {
    this.showCancelConfirm.set(false);
    this.slotToCancel.set(null);
    this.cancelPenaltyInfo.set(null);
  }

  startSlot(slotId: number): void {
    this.slotLoading.set(true);
    this.orderService.startSlot(slotId).subscribe({
      next: (slot) => {
        this.slotLoading.set(false);
        this.activeSlot.set(slot);
        this.showScheduleModal.set(false);
        this.snack.open('✅ Smena boshlandi! Buyurtma qabul qilishingiz mumkin.', '', { duration: 3500 });
        this.loadSlots();
      },
      error: (err) => {
        this.slotLoading.set(false);
        this.snack.open(`❌ ${err.error?.message || 'Smena boshlanmadi'}`, '', { duration: 4000 });
      }
    });
  }

  endCurrentSlot(): void {
    const slot = this.activeSlot();
    if (!slot) return;
    this.slotLoading.set(true);
    this.orderService.endSlot(slot.id).subscribe({
      next: () => {
        this.slotLoading.set(false);
        this.activeSlot.set(null);
        this.snack.open('🔴 Smena tugatildi. Yaxshi dam oling!', '', { duration: 3500 });
        this.loadSlots();
      },
      error: (err) => {
        this.slotLoading.set(false);
        this.snack.open(`❌ ${err.error?.message || 'Smena tugatilmadi'}`, '', { duration: 4000 });
      }
    });
  }

  acceptOrder(id: number): void {
    this.actionLoading.set(id);
    this.orderService.acceptOrder(id).subscribe({
      next: () => {
        this.actionLoading.set(null);
        this.snack.open('🏍️ Buyurtma qabul qilindi!', '', { duration: 3000 });
        this.loadAll(false);
      },
      error: (err) => {
        this.actionLoading.set(null);
        this.snack.open(`❌ ${err.error?.message || 'Qabul qilib bo\'lmadi'}`, '', { duration: 3000 });
      }
    });
  }

  arriveAtRestaurant(id: number): void {
    this.actionLoading.set(id);
    this.orderService.arriveRestaurant(id).subscribe({
      next: () => { this.actionLoading.set(null); this.snack.open('🏪 Restorandasiz!', '', { duration: 3000 }); this.loadAll(false); },
      error: () => this.actionLoading.set(null)
    });
  }

  pickupFood(id: number): void {
    this.actionLoading.set(id);
    this.orderService.pickupOrder(id).subscribe({
      next: () => { this.actionLoading.set(null); this.snack.open('🚗 Yo\'lga chiqdingiz!', '', { duration: 3000 }); this.loadAll(false); },
      error: () => this.actionLoading.set(null)
    });
  }

  arriveAtClient(id: number): void {
    this.actionLoading.set(id);
    this.orderService.arriveClient(id).subscribe({
      next: () => { this.actionLoading.set(null); this.snack.open('📍 Mijoz manzilidisiz!', '', { duration: 3000 }); this.loadAll(false); },
      error: () => this.actionLoading.set(null)
    });
  }

  deliverOrder(id: number): void {
    this.actionLoading.set(id);
    this.orderService.deliverOrder(id).subscribe({
      next: () => { this.actionLoading.set(null); this.snack.open('🎉 Topshirildi!', '', { duration: 3500 }); this.loadAll(false); },
      error: () => this.actionLoading.set(null)
    });
  }

  openYandexRoute(order?: Order): void {
    if (!order) return;
    let rLat = 38.866127, rLng = 65.816309;
    if (order.restaurant?.latitude) { rLat = order.restaurant.latitude; rLng = order.restaurant.longitude!; }
    const restCoords = [rLat, rLng];

    let url = '';
    const isToRestaurant = (order.status === 'COURIER_ACCEPTED' || order.status === 'COURIER_AT_RESTAURANT');
    
    if (isToRestaurant) {
      // Kuryerdan restorangacha marshrut
      url = `https://yandex.ru/maps/?rtext=${this.courierStartCoords[0]},${this.courierStartCoords[1]}~${restCoords[0]},${restCoords[1]}&rtt=auto`;
    } else {
      // Restorandan mijozgacha marshrut
      url = `https://yandex.ru/maps/?rtext=${restCoords[0]},${restCoords[1]}~${order.latitude || 41.3111},${order.longitude || 69.2797}&rtt=auto`;
    }
    window.open(url, '_blank');
  }

  initMainMap(): void {
    const ymaps = (window as any).ymaps;
    if (!ymaps) return;
    ymaps.ready(() => {
      const el = document.getElementById('courier-main-map');
      if (!el) return;
      el.innerHTML = ''; // Eski xaritani tozalaymiz
      
      const activeDeliveries = this.currentDeliveries().filter(o => o.status !== 'DELIVERED');
      if (activeDeliveries.length > 0) {
        const order = activeDeliveries[0];
        let rLat = 38.866127, rLng = 65.816309;
        if (order.restaurant?.latitude) { rLat = order.restaurant.latitude; rLng = order.restaurant.longitude!; }
        const restCoords = [rLat, rLng];

        const map = new ymaps.Map('courier-main-map', { center: this.courierStartCoords, zoom: 13, controls: ['zoomControl'] });
        
        let startCoords = this.courierStartCoords;
        let endCoords = restCoords;
        
        const isToRestaurant = (order.status === 'COURIER_ACCEPTED' || order.status === 'COURIER_AT_RESTAURANT');
        if (!isToRestaurant) {
          startCoords = restCoords;
          endCoords = [order.latitude || 41.3111, order.longitude || 69.2797];
        }

        map.geoObjects.add(new ymaps.multiRouter.MultiRoute(
          { referencePoints: [startCoords, endCoords], params: { routingMode: 'auto' } },
          { boundsAutoApply: true }
        ));
      } else {
        new ymaps.Map('courier-main-map', { center: [38.866127, 65.816309], zoom: 13, controls: ['zoomControl'] });
      }
    });
  }

  initRouteMap(orderId: number, start: number[], end: number[], containerId: string): void {
    const ymaps = (window as any).ymaps;
    if (!ymaps) return;
    this.mapsInitialized.add(containerId);
    ymaps.ready(() => {
      const el = document.getElementById(containerId);
      if (!el) return;
      el.innerHTML = '';
      const map = new ymaps.Map(containerId, { center: start, zoom: 13, controls: ['zoomControl'] });
      map.geoObjects.add(new ymaps.multiRouter.MultiRoute(
        { referencePoints: [start, end], params: { routingMode: 'auto' } },
        { boundsAutoApply: true }
      ));
    });
  }

  statusLabel(status: OrderStatus): string {
    return ORDER_STATUS_LABELS[status] ?? status;
  }
}
