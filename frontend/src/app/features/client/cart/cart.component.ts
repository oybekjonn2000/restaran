import { Component, OnInit, signal, NgZone, AfterViewInit, HostListener } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CartService } from '../../../core/services/cart.service';
import { OrderService } from '../../../core/services/order.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-client-cart',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MatSnackBarModule, MatProgressSpinnerModule],
  template: `
    <div class="cart-page animate-in">
      <!-- Header -->
      <header class="cart-header">
        <button class="back-btn-round" (click)="goBack()" title="Orqaga">
          <span class="back-arrow">←</span>
        </button>
        <h1 class="page-title">Savat</h1>
        <div style="width: 42px;"></div> <!-- balance gap -->
      </header>

      <!-- Empty state -->
      @if (cart.isEmpty()) {
        <div class="empty-state-wrapper">
          <div class="empty-glow-box">
            <!-- Sleek SVG Illustration of empty basket with neon elements -->
            <svg class="empty-svg animate-bounce-slow" viewBox="0 0 200 200" width="160" height="160">
              <defs>
                <linearGradient id="neonGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stop-color="var(--primary)" />
                  <stop offset="100%" stop-color="#ec4899" />
                </linearGradient>
                <filter id="neonGlow">
                  <feGaussianBlur stdDeviation="8" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>
              <!-- Basket base -->
              <path d="M40 80 L160 80 L145 150 L55 150 Z" fill="none" stroke="url(#neonGrad)" stroke-width="6" filter="url(#neonGlow)" stroke-linejoin="round" />
              <!-- Basket handles -->
              <path d="M70 80 C 70 30, 130 30, 130 80" fill="none" stroke="url(#neonGrad)" stroke-width="4" stroke-linecap="round" />
              <!-- Food icons floating -->
              <circle cx="70" cy="115" r="10" fill="var(--primary)" opacity="0.15" />
              <circle cx="130" cy="115" r="15" fill="#ec4899" opacity="0.15" />
              <!-- Questions / marks -->
              <text x="90" y="115" font-size="28" fill="url(#neonGrad)" font-weight="800" text-anchor="middle" filter="url(#neonGlow)">?</text>
            </svg>
          </div>
          <h2 class="empty-title">Bo'm-bo'sh</h2>
          <p class="empty-subtitle">Bu yerda siz buyurtmaga qo'shgan mazali taomlar chiqadi</p>
          <button routerLink="/client/restaurants" class="btn btn-primary btn-lg go-back-btn">
            Restoranlarga o'tish
          </button>
        </div>
      }

      <!-- Cart content (loaded state) -->
      @if (!cart.isEmpty()) {
        <div class="cart-grid">
          <!-- Left Column: Items list -->
          <div class="cart-left">
            <h2 class="section-title">🛍️ Buyurtma tarkibi</h2>
            <div class="cart-items-card">
              @for (item of cart.items(); track item.food.id) {
                <div class="cart-item">
                  <img [src]="item.food.imageUrl" [alt]="item.food.name"
                       class="item-img" (error)="onImgError($event)">
                  <div class="item-info">
                    <span class="item-name">{{ item.food.name }}</span>
                    <span class="item-price">{{ item.food.price | number:'1.0-0' }} so'm</span>
                  </div>
                  <div class="qty-controls">
                    <button class="qty-btn" (click)="cart.updateQuantity(item.food.id, item.quantity - 1)"
                            [id]="'qty-minus-' + item.food.id">−</button>
                    <span class="qty-num">{{ item.quantity }}</span>
                    <button class="qty-btn" (click)="cart.updateQuantity(item.food.id, item.quantity + 1)"
                            [id]="'qty-plus-' + item.food.id">+</button>
                  </div>
                  <button class="remove-btn" (click)="cart.removeItem(item.food.id)"
                          [id]="'remove-' + item.food.id" title="O'chirish">🗑️</button>
                </div>
              }
            </div>

            <!-- Note section -->
            <div class="card note-card" style="margin-top: 16px;">
              <h3 class="form-section-title">✍️ Buyurtma uchun izoh</h3>
              <textarea
                [(ngModel)]="note"
                class="form-control"
                placeholder="Masalan: Uy raqami, kirish kodi yoki kuryer uchun maxsus eslatmalar..."
                rows="3"
                id="order-note"></textarea>
            </div>
          </div>

          <!-- Right Column: Map & Address & Summary -->
          <div class="cart-right">
            <!-- Map & Address Card -->
            <div class="card map-card">
              <h3 class="form-section-title">📍 Yetkazib berish manzili</h3>

              @if (hasSavedAddress && !isEditingAddress) {
                <div class="saved-address-view">
                  <div class="saved-address-content">
                    <span class="saved-address-icon">🏡</span>
                    <span class="saved-address-text">{{ deliveryAddress }}</span>
                  </div>
                  <button type="button" class="btn btn-outline btn-sm change-address-btn" (click)="enableAddressEdit()">
                    🔄 Manzilni o'zgartirish
                  </button>
                </div>
              } @else {
                <div class="search-input-wrapper">
                  <span class="search-icon">🔍</span>
                  <input
                    type="text"
                    [(ngModel)]="deliveryAddress"
                    (input)="onAddressInput($event)"
                    class="search-address-input"
                    placeholder="Manzilni kiriting (masalan: Qarshi...)"
                    id="delivery-address" />
                  @if (deliveryAddress) {
                    <button class="clear-input-btn" (click)="clearAddress()" title="Tozalash">✕</button>
                  }
                </div>

                <!-- Suggestions Dropdown -->
                @if (suggestions().length > 0) {
                  <div class="suggestions-list">
                    @for (sug of suggestions(); track sug.value) {
                      <div class="suggestion-item" (click)="selectSuggestion(sug)">
                        <span class="sug-icon">📍</span>
                        <div class="sug-info">
                          <span class="sug-title">{{ sug.title }}</span>
                          <span class="sug-subtitle">{{ sug.subtitle }}</span>
                        </div>
                      </div>
                    }
                  </div>
                }

                <div class="map-container-wrap">
                  <div id="yandex-map" class="y-map"></div>
                  <button type="button" class="locate-me-btn" (click)="locateMe()" id="locate-me-btn">
                    📍 Joylashuvni aniqlash
                  </button>
                </div>
              }
            </div>

            <!-- Summary Card -->
            <div class="card summary-card" style="margin-top: 16px;">
              <h3 class="form-section-title">💳 To'lov tafsilotlari</h3>
              <div class="summary-details">
                <div class="summary-row">
                  <span class="s-label">Taomlar summasi:</span>
                  <span class="s-value">{{ cart.totalPrice() | number:'1.0-0' }} so'm</span>
                </div>
                @if (courierActive) {
                  <div class="summary-row">
                    <span class="s-label">Yetkazib berish ({{ distance }} km):</span>
                    <span class="s-value fee-highlight">{{ deliveryFee | number:'1.0-0' }} so'm</span>
                  </div>
                  <div class="summary-row total">
                    <span class="s-label">Jami summa:</span>
                    <span class="s-value price">{{ (cart.totalPrice() + deliveryFee) | number:'1.0-0' }} so'm</span>
                  </div>
                } @else {
                  <div class="summary-row yandex-fee-row">
                    <span class="s-label">Yetkazib berish:</span>
                    <span class="s-value yandex-label">🚕 Kuryer topilmadi, buyurtma Yandex orqali yetkaziladi (summasini haydovchining telefonida)</span>
                  </div>
                  <div class="summary-row total">
                    <span class="s-label">Jami summa:</span>
                    <span class="s-value price">{{ cart.totalPrice() | number:'1.0-0' }} so'm + <span class="yandex-inline">Yandex</span></span>
                  </div>
                }
              </div>

              <!-- Action buttons -->
              <div class="summary-actions">
                <button class="btn btn-outline" (click)="cart.clear()" id="cart-clear-btn">
                  🗑️ Savatni tozalash
                </button>
                <button
                  class="btn btn-primary"
                  (click)="placeOrder()"
                  [disabled]="ordering() || !deliveryAddress"
                  id="place-order-btn">
                  @if (ordering()) {
                    <mat-spinner diameter="18" color="accent"></mat-spinner>
                  }
                  🎯 Buyurtma berish
                </button>
              </div>
              @if (!deliveryAddress) {
                <p class="address-hint">⚠️ Iltimos, yetkazib berish manzilini kiriting yoki xaritadan tanlang!</p>
              }
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .cart-page {
      max-width: 1200px;
      margin: 0 auto;
      padding: 24px 20px 80px;
      min-height: 80vh;
    }

    .cart-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 24px;
      padding-bottom: 16px;
      border-bottom: 1px solid var(--border);
    }

    .page-title {
      font-size: 1.8rem;
      font-weight: 800;
      letter-spacing: -0.02em;
      margin: 0;
      background: linear-gradient(135deg, var(--text), var(--text-muted));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .back-btn-round {
      width: 42px;
      height: 42px;
      border-radius: 50%;
      background: var(--bg-card);
      border: 1px solid var(--border);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      color: var(--text);
      transition: var(--transition);
      box-shadow: var(--shadow-sm);
    }
    .back-btn-round:hover {
      background: var(--primary);
      color: white;
      border-color: var(--primary);
      transform: translateX(-3px);
    }
    .back-arrow {
      font-size: 1.2rem;
      font-weight: 700;
    }

    /* Empty state */
    .empty-state-wrapper {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 60px 20px;
      text-align: center;
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-md);
      margin-top: 20px;
    }

    .empty-glow-box {
      position: relative;
      margin-bottom: 24px;
      background: rgba(249,115,22,0.03);
      padding: 24px;
      border-radius: 50%;
      border: 1px dashed rgba(249,115,22,0.15);
      box-shadow: 0 0 40px rgba(249,115,22,0.05);
    }

    .empty-svg {
      display: block;
    }

    .animate-bounce-slow {
      animation: float 4s ease-in-out infinite;
    }

    @keyframes float {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-10px); }
    }

    .empty-title {
      font-size: 1.8rem;
      font-weight: 800;
      margin-bottom: 12px;
      color: var(--text);
      letter-spacing: -0.01em;
    }

    .empty-subtitle {
      font-size: 1rem;
      color: var(--text-muted);
      max-width: 400px;
      margin-bottom: 30px;
      line-height: 1.5;
    }

    .go-back-btn {
      padding: 14px 36px;
      font-size: 1rem;
      border-radius: 30px;
      box-shadow: 0 4px 18px rgba(249,115,22,0.3);
    }

    /* Grid layout */
    .cart-grid {
      display: grid;
      grid-template-columns: 1.2fr 0.8fr;
      gap: 24px;
      align-items: start;
    }

    .section-title {
      font-size: 1.2rem;
      font-weight: 700;
      margin: 0 0 16px;
      color: var(--text);
    }

    .card {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      padding: 20px;
      box-shadow: var(--shadow-sm);
    }

    .cart-items-card {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      padding: 12px;
      box-shadow: var(--shadow-sm);
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .cart-item {
      display: flex;
      align-items: center;
      gap: 16px;
      background: var(--bg-card2);
      border-radius: var(--radius);
      padding: 14px;
      border: 1px solid var(--border);
      transition: var(--transition);
    }
    .cart-item:hover {
      border-color: rgba(249,115,22,0.3);
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }

    .item-img {
      width: 60px;
      height: 60px;
      border-radius: 10px;
      object-fit: cover;
      flex-shrink: 0;
      border: 1px solid var(--border);
    }

    .item-info {
      flex: 1;
      min-width: 0;
    }

    .item-name {
      display: block;
      font-size: 0.95rem;
      font-weight: 700;
      color: var(--text);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      margin-bottom: 4px;
    }

    .item-price {
      font-size: 0.88rem;
      color: var(--primary);
      font-weight: 700;
    }

    .qty-controls {
      display: flex;
      align-items: center;
      gap: 8px;
      background: var(--bg-card);
      border: 1px solid var(--border);
      padding: 4px;
      border-radius: 10px;
    }

    .qty-btn {
      width: 30px;
      height: 30px;
      border-radius: 8px;
      border: none;
      background: var(--bg-card2);
      color: var(--text);
      cursor: pointer;
      font-size: 1.1rem;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: var(--transition);
      font-weight: 700;
    }
    .qty-btn:hover {
      background: var(--primary);
      color: white;
    }

    .qty-num {
      min-width: 24px;
      text-align: center;
      font-weight: 800;
      font-size: 0.95rem;
      color: var(--text);
    }

    .remove-btn {
      background: none;
      border: none;
      cursor: pointer;
      font-size: 1.1rem;
      padding: 8px;
      transition: var(--transition);
      border-radius: 8px;
    }
    .remove-btn:hover {
      background: rgba(239,68,68,0.1);
      transform: scale(1.1);
    }

    .form-section-title {
      font-size: 1rem;
      font-weight: 700;
      margin: 0 0 14px;
      color: var(--text);
      border-bottom: 1px solid var(--border);
      padding-bottom: 8px;
    }

    .address-textarea {
      font-family: inherit;
      resize: none;
    }

    .map-container-wrap {
      position: relative;
      margin-top: 12px;
      border-radius: var(--radius);
      border: 1px solid var(--border);
      overflow: hidden;
    }

    .y-map {
      width: 100%;
      height: 250px;
    }

    .locate-me-btn {
      position: absolute;
      bottom: 12px;
      right: 12px;
      z-index: 10;
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 8px 14px;
      font-size: 0.8rem;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
      color: var(--text);
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      transition: var(--transition);
      font-family: inherit;
    }
    .locate-me-btn:hover {
      background: var(--primary);
      color: white;
      border-color: var(--primary);
    }

    /* Summary Details */
    .summary-details {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-bottom: 20px;
    }

    .summary-row {
      display: flex;
      justify-content: space-between;
      font-size: 0.92rem;
    }
    .summary-row.total {
      font-weight: 800;
      font-size: 1.1rem;
      border-top: 1px dashed var(--border);
      padding-top: 14px;
      margin-top: 8px;
    }

    .s-label { color: var(--text-muted); }
    .s-value { color: var(--text); font-weight: 600; }
    .s-value.price { color: var(--primary); }

    .fee-highlight {
      color: var(--primary);
      font-weight: 700;
    }

    .summary-actions {
      display: flex;
      gap: 12px;
    }
    .summary-actions .btn {
      flex: 1;
      padding: 14px;
      border-radius: var(--radius);
      font-weight: 700;
      justify-content: center;
      gap: 8px;
    }

    .address-hint {
      text-align: center;
      font-size: 0.8rem;
      color: var(--warning);
      margin-top: 12px;
      font-weight: 500;
    }

    .yandex-label {
      color: #f59e0b;
      font-weight: 700;
    }
    .yandex-inline {
      color: #f59e0b;
      font-weight: 800;
    }

    .saved-address-view {
      display: flex;
      flex-direction: column;
      gap: 16px;
      padding: 12px 0;
    }
    .saved-address-content {
      display: flex;
      align-items: center;
      gap: 12px;
      background: var(--bg-card2);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 16px;
    }
    .saved-address-icon {
      font-size: 1.5rem;
    }
    .saved-address-text {
      font-size: 0.95rem;
      font-weight: 500;
      color: var(--text);
      line-height: 1.5;
    }
    .change-address-btn {
      align-self: flex-start;
      padding: 8px 16px;
      font-size: 0.85rem;
      font-weight: 600;
    }

    .map-card {
      position: relative;
    }
    .search-input-wrapper {
      position: relative;
      display: flex;
      align-items: center;
      margin-bottom: 12px;
    }
    .search-icon {
      position: absolute;
      left: 14px;
      color: var(--text-muted);
      font-size: 1rem;
      pointer-events: none;
    }
    .search-address-input {
      width: 100%;
      padding: 12px 40px 12px 38px;
      background: var(--bg-card2);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      color: var(--text);
      font-family: inherit;
      font-size: 0.95rem;
      transition: var(--transition);
    }
    .search-address-input:focus {
      border-color: var(--primary);
      box-shadow: 0 0 10px rgba(249,115,22,0.15);
      outline: none;
    }
    .clear-input-btn {
      position: absolute;
      right: 12px;
      background: none;
      border: none;
      color: var(--text-muted);
      cursor: pointer;
      font-size: 1.1rem;
      padding: 4px;
      transition: var(--transition);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .clear-input-btn:hover {
      color: var(--text);
    }
    .suggestions-list {
      position: absolute;
      top: 92px;
      left: 20px;
      right: 20px;
      background: var(--bg-card2);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      z-index: 100;
      max-height: 220px;
      overflow-y: auto;
      box-shadow: 0 10px 25px rgba(0,0,0,0.45);
      backdrop-filter: blur(8px);
    }
    .suggestion-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 14px;
      cursor: pointer;
      transition: var(--transition);
      border-bottom: 1px solid rgba(255,255,255,0.03);
    }
    .suggestion-item:last-child {
      border-bottom: none;
    }
    .suggestion-item:hover {
      background: rgba(249,115,22,0.12);
    }
    .sug-icon {
      font-size: 1.1rem;
      color: var(--primary);
    }
    .sug-info {
      display: flex;
      flex-direction: column;
      min-width: 0;
    }
    .sug-title {
      font-size: 0.9rem;
      font-weight: 700;
      color: var(--text);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .sug-subtitle {
      font-size: 0.75rem;
      color: var(--text-muted);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    @media (max-width: 900px) {
      .cart-grid {
        grid-template-columns: 1fr;
        gap: 20px;
      }
      .cart-page {
        padding: 16px 12px 100px;
      }
      .y-map {
        height: 220px;
      }
    }

    @media (max-width: 600px) {
      .page-title {
        font-size: 1.4rem;
      }
      .cart-header {
        margin-bottom: 16px;
        padding-bottom: 12px;
      }
      .back-btn-round {
        width: 36px;
        height: 36px;
      }
      .back-arrow {
        font-size: 1rem;
      }
      
      .cart-item {
        padding: 10px;
        gap: 10px;
        position: relative;
      }
      .item-img {
        width: 50px;
        height: 50px;
        border-radius: 8px;
      }
      .item-name {
        font-size: 0.88rem;
        max-width: 140px;
      }
      .item-price {
        font-size: 0.8rem;
      }
      .qty-controls {
        gap: 4px;
        padding: 2px;
      }
      .qty-btn {
        width: 26px;
        height: 26px;
        font-size: 0.9rem;
      }
      .qty-num {
        font-size: 0.85rem;
        min-width: 20px;
      }
      .remove-btn {
        font-size: 0.95rem;
        padding: 6px;
      }

      .card, .cart-items-card {
        padding: 14px;
      }
      .form-section-title {
        font-size: 0.9rem;
        margin-bottom: 10px;
      }
      
      .summary-actions {
        flex-direction: column-reverse;
        gap: 10px;
      }
      .summary-actions .btn {
        width: 100%;
        padding: 12px;
      }
      
      .empty-state-wrapper {
        padding: 40px 16px;
      }
      .empty-title {
        font-size: 1.5rem;
      }
      .empty-subtitle {
        font-size: 0.9rem;
        margin-bottom: 20px;
      }
      .go-back-btn {
        padding: 12px 28px;
        font-size: 0.9rem;
      }
    }

    @media (max-width: 380px) {
      .cart-item {
        flex-wrap: wrap;
      }
      .qty-controls {
        margin-left: auto;
      }
      .remove-btn {
        position: absolute;
        top: 6px;
        right: 6px;
      }
    }
  `]
})
export class CartComponent implements OnInit, AfterViewInit {
  deliveryAddress = '';
  note = '';
  ordering = signal(false);

  hasSavedAddress = false;
  isEditingAddress = false;

  latitude = 38.866127;
  longitude = 65.816309;
  map: any;
  placemark: any;
  restaurantPlacemark: any;

  distance = 0;
  deliveryFee = 10000;
  courierActive = true;

  suggestions = signal<any[]>([]);
  private suggestTimeout: any;

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.map-card')) {
      this.suggestions.set([]);
    }
  }

  constructor(
    public cart: CartService,
    private orderService: OrderService,
    public auth: AuthService,
    private snack: MatSnackBar,
    private ngZone: NgZone,
    private router: Router,
    private http: HttpClient
  ) {
    const user = this.auth.user();
    if (user?.address) {
      this.deliveryAddress = user.address;
      this.hasSavedAddress = true;
      this.isEditingAddress = false;
    } else {
      this.hasSavedAddress = false;
      this.isEditingAddress = true;
    }
  }

  ngOnInit(): void {
    this.checkCourierActive();
  }

  ngAfterViewInit(): void {
    if (!this.cart.isEmpty()) {
      setTimeout(() => this.initMap(), 400);
    }
  }

  goBack(): void {
    window.history.back();
  }

  enableAddressEdit(): void {
    this.isEditingAddress = true;
    setTimeout(() => {
      this.initMap();
    }, 100);
  }

  checkCourierActive(): void {
    this.orderService.isCourierActive().subscribe({
      next: (res) => {
        this.ngZone.run(() => {
          this.courierActive = res.active;
        });
      },
      error: () => {
        this.courierActive = true;
      }
    });
  }

  locateMe(): void {
    if (!navigator.geolocation) {
      this.snack.open('⚠️ Geolokatsiya brauzeringiz tomonidan qo\'llab-quvvatlanmaydi', 'Yopish', { duration: 3000 });
      return;
    }

    this.snack.open('🔍 Joylashuvingiz aniqlanmoqda...', 'Yopish', { duration: 2000 });

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const coords = [lat, lng];

        this.ngZone.run(() => {
          if (this.map) {
            this.map.setCenter(coords, 15);
            this.setMarker(coords);
            this.snack.open('✅ Joylashuv aniqlandi!', 'Yopish', { duration: 2000 });
          }
        });
      },
      (error) => {
        let msg = '⚠️ Joylashuvni aniqlab bo\'lmadi';
        if (error.code === error.PERMISSION_DENIED) {
          msg = '⚠️ Geolokatsiya uchun ruxsat berilmadi';
        }
        this.snack.open(msg, 'Yopish', { duration: 3000 });
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }

  initMap(): void {
    const ymaps = (window as any).ymaps;
    if (!ymaps) {
      console.warn('Yandex Maps API is not loaded');
      return;
    }

    ymaps.ready(() => {
      let restLat = 38.866127;
      let restLng = 65.816309;
      let restName = 'Restoran';
      const items = this.cart.items();
      if (items.length > 0 && items[0].food.restaurant) {
        const rest = items[0].food.restaurant;
        if (rest.latitude && rest.longitude) {
          restLat = rest.latitude;
          restLng = rest.longitude;
        }
        if (rest.name) restName = rest.name;
      }

      const restCoords = [restLat, restLng];
      const mapContainer = document.getElementById('yandex-map');
      if (!mapContainer) return;

      mapContainer.innerHTML = '';

      this.map = new ymaps.Map('yandex-map', {
        center: restCoords,
        zoom: 13,
        controls: ['zoomControl']
      });

      this.map.events.add('click', (e: any) => {
        const coords = e.get('coords');
        this.ngZone.run(() => {
          this.setMarker(coords);
        });
      });

      this.addRestaurantMarker(restCoords, restName);
      this.setMarker(restCoords);
    });
  }

  addRestaurantMarker(coords: number[], name: string): void {
    const ymaps = (window as any).ymaps;
    if (!ymaps || !this.map) return;

    if (this.restaurantPlacemark) {
      this.map.geoObjects.remove(this.restaurantPlacemark);
    }

    this.restaurantPlacemark = new ymaps.Placemark(
      coords,
      {
        balloonContentHeader: `🍽️ ${name}`,
        balloonContentBody: 'Buyurtmangiz shu restorandan tayyorlanadi',
        hintContent: `🍽️ ${name}`
      },
      {
        preset: 'islands#redFoodIcon',
        iconColor: '#ff4444'
      }
    );

    this.map.geoObjects.add(this.restaurantPlacemark);
  }

  setMarker(coords: number[]): void {
    const ymaps = (window as any).ymaps;
    if (!ymaps || !this.map) return;

    this.latitude = coords[0];
    this.longitude = coords[1];

    if (this.placemark) {
      this.placemark.geometry.setCoordinates(coords);
    } else {
      this.placemark = new ymaps.Placemark(coords, {}, {
        preset: 'islands#violetDotIconWithCaption',
        draggable: true
      });

      this.placemark.events.add('dragend', () => {
        const newCoords = this.placemark.geometry.getCoordinates();
        this.ngZone.run(() => {
          this.latitude = newCoords[0];
          this.longitude = newCoords[1];
          this.geocode(newCoords);
          this.calculateYandexDistance(newCoords);
        });
      });

      this.map.geoObjects.add(this.placemark);
    }

    this.geocode(coords);
    this.calculateYandexDistance(coords);
  }

  geocode(coords: number[]): void {
    const ymaps = (window as any).ymaps;
    this.deliveryAddress = 'Manzil aniqlanmoqda...';

    if (ymaps) {
      ymaps.geocode(coords).then((res: any) => {
        const firstGeoObject = res.geoObjects.get(0);
        if (firstGeoObject) {
          const meta = firstGeoObject.properties.get('metaDataProperty.GeocoderMetaData');
          const components = meta?.Address?.Components || [];
          
          let province = '';
          let area = '';
          let locality = '';
          let street = '';
          let house = '';

          for (const comp of components) {
            if (comp.kind === 'province') {
              province = comp.name;
            } else if (comp.kind === 'area') {
              area = comp.name;
            } else if (comp.kind === 'locality') {
              locality = comp.name;
            } else if (comp.kind === 'street') {
              street = comp.name;
            } else if (comp.kind === 'house') {
              house = comp.name;
            }
          }

          let formattedAddress = '';
          const cityOrTown = locality || area || province;
          if (cityOrTown) {
            formattedAddress += cityOrTown;
          }
          if (street) {
            formattedAddress += (formattedAddress ? ', ' : '') + street;
          }
          if (house) {
            formattedAddress += (formattedAddress ? ', ' : '') + house + '-uy';
          }

          if (!formattedAddress) {
            formattedAddress = firstGeoObject.getAddressLine();
          }

          this.ngZone.run(() => {
            this.deliveryAddress = formattedAddress;
          });
        } else {
          this.geocodeOSM(coords);
        }
      }, (err: any) => {
        console.warn('Yandex geocoder failed, trying OpenStreetMap Nominatim...', err);
        this.geocodeOSM(coords);
      });
    } else {
      this.geocodeOSM(coords);
    }
  }

  geocodeOSM(coords: number[]): void {
    const lat = coords[0];
    const lon = coords[1];
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&accept-language=uz`;

    fetch(url, {
      headers: {
        'User-Agent': 'FoodDeliveryApp/1.0'
      }
    })
      .then(res => {
        if (!res.ok) throw new Error('OSM request failed');
        return res.json();
      })
      .then(data => {
        if (data && data.address) {
          const addr = data.address;
          const cityOrTown = addr.city || addr.town || addr.village || addr.hamlet || addr.county || addr.state;
          const street = addr.road || addr.street;
          const house = addr.house_number;

          let formattedAddress = '';
          if (cityOrTown) formattedAddress += cityOrTown;
          if (street) formattedAddress += (formattedAddress ? ', ' : '') + street;
          if (house) formattedAddress += (formattedAddress ? ', ' : '') + house + '-uy';

          if (!formattedAddress) formattedAddress = data.display_name;

          this.ngZone.run(() => {
            this.deliveryAddress = formattedAddress;
          });
        } else if (data && data.display_name) {
          this.ngZone.run(() => {
            this.deliveryAddress = data.display_name;
          });
        } else {
          this.ngZone.run(() => {
            this.deliveryAddress = `Koordinata: ${lat.toFixed(6)}, ${lon.toFixed(6)}`;
          });
        }
      })
      .catch(err => {
        console.error('OSM geocoding failed:', err);
        this.ngZone.run(() => {
          this.deliveryAddress = `Koordinata: ${lat.toFixed(6)}, ${lon.toFixed(6)}`;
        });
      });
  }

  calculateHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2); 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    return R * c;
  }

  calculateYandexDistance(coords: number[]): void {
    const ymaps = (window as any).ymaps;
    let restLat = 38.866127;
    let restLng = 65.816309;
    const items = this.cart.items();
    if (items.length > 0 && items[0].food.restaurant) {
      const rest = items[0].food.restaurant;
      if (rest.latitude && rest.longitude) {
        restLat = rest.latitude;
        restLng = rest.longitude;
      }
    }

    const restCoords = [restLat, restLng];

    if (!ymaps) {
      this.fallbackToHaversine(restLat, restLng, coords[0], coords[1]);
      return;
    }

    ymaps.route([restCoords, coords]).then((route: any) => {
      const distanceInMeters = route.getLength();
      const distanceInKm = distanceInMeters / 1000;
      
      this.ngZone.run(() => {
        this.distance = Math.round(distanceInKm * 10) / 10;
        this.deliveryFee = 10000 + (this.distance * 1800);
        this.deliveryFee = Math.round(this.deliveryFee / 100) * 100;
      });
    }, (err: any) => {
      console.warn('Error calculating Yandex route distance, fallback to Haversine', err);
      this.fallbackToHaversine(restLat, restLng, coords[0], coords[1]);
    });
  }

  private fallbackToHaversine(restLat: number, restLng: number, targetLat: number, targetLng: number): void {
    const straightDistance = this.calculateHaversineDistance(restLat, restLng, targetLat, targetLng);
    const estimatedDrivingDistance = straightDistance * 1.35;
    
    this.ngZone.run(() => {
      this.distance = Math.round(estimatedDrivingDistance * 10) / 10;
      if (this.distance < 0.1) {
        this.distance = 0;
        this.deliveryFee = 10000;
      } else {
        this.deliveryFee = 10000 + (this.distance * 1800);
        this.deliveryFee = Math.round(this.deliveryFee / 100) * 100;
      }
    });
  }

  placeOrder(): void {
    if (!this.deliveryAddress || this.cart.isEmpty()) return;

    if (!this.auth.isLoggedIn()) {
      this.snack.open('⚠️ Buyurtma berish uchun avval tizimga kiring!', 'Yopish', { duration: 4000 });
      this.router.navigate(['/auth/login']);
      return;
    }

    this.ordering.set(true);
    const restId = this.cart.getRestaurantId();

    this.orderService.createOrder({
      deliveryAddress: this.deliveryAddress,
      latitude: this.latitude,
      longitude: this.longitude,
      distance: this.distance,
      deliveryFee: this.deliveryFee,
      restaurantId: restId || undefined,
      note: this.note || undefined,
      items: this.cart.getOrderItems()
    }).subscribe({
      next: (order) => {
        this.auth.fetchMe().subscribe();
        this.ordering.set(false);
        this.cart.clear();
        this.note = '';
        this.snack.open(
          `🎉 Buyurtma #${order.id} muvaffaqiyatli berildi!`,
          'Yopish',
          { duration: 4000, panelClass: ['success-snack'] }
        );
        this.router.navigate(['/client/orders']);
      },
      error: (err) => {
        this.ordering.set(false);
        this.snack.open(
          `❌ Xatolik: ${err.error?.message || 'Buyurtma berilib bo\'lmadi'}`,
          'Yopish',
          { duration: 4000 }
        );
      }
    });
  }

  onAddressInput(event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    if (!val || val.length < 3) {
      this.suggestions.set([]);
      return;
    }

    clearTimeout(this.suggestTimeout);
    this.suggestTimeout = setTimeout(() => {
      const ymaps = (window as any).ymaps;
      if (ymaps) {
        // Search restricted or prioritized to Uzbekistan bounds
        ymaps.suggest(val, {
          boundedBy: [[37.0, 60.0], [45.0, 73.0]],
          strictBounds: false
        }).then((items: any[]) => {
          if (items && items.length > 0) {
            const mapped = items.map(item => {
              const parts = item.displayName.split(',');
              const title = parts[0]?.trim() || item.displayName;
              const subtitle = parts.slice(1).join(',').trim();
              return {
                title,
                subtitle,
                value: item.value
              };
            });
            this.ngZone.run(() => {
              this.suggestions.set(mapped);
            });
          } else {
            this.queryOSMSuggestions(val);
          }
        }, (err: any) => {
          console.warn('Yandex suggest failed, trying OSM...', err);
          this.queryOSMSuggestions(val);
        });
      } else {
        this.queryOSMSuggestions(val);
      }
    }, 300);
  }

  private queryOSMSuggestions(val: string): void {
    // Querying OpenStreetMap Nominatim for clean local search suggestions in Uzbekistan
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(val)}&accept-language=uz&addressdetails=1&limit=6&countrycodes=uz`;
    this.http.get<any[]>(url).subscribe({
      next: (items) => {
        if (!items || items.length === 0) {
          this.ngZone.run(() => this.suggestions.set([]));
          return;
        }
        const mapped = items.map(item => {
          const addr = item.address || {};
          const title = addr.city || addr.town || addr.village || addr.hamlet || addr.suburb || item.display_name.split(',')[0];
          const subtitle = item.display_name.split(',').slice(1).join(',').trim();
          return {
            title,
            subtitle,
            value: item.display_name,
            osmCoords: [parseFloat(item.lat), parseFloat(item.lon)]
          };
        });
        this.ngZone.run(() => {
          this.suggestions.set(mapped);
        });
      },
      error: (err) => {
        console.error('OSM suggestion search failed:', err);
        this.ngZone.run(() => this.suggestions.set([]));
      }
    });
  }

  selectSuggestion(sug: any): void {
    this.suggestions.set([]);
    this.deliveryAddress = sug.value;

    const useCoords = (coords: number[]) => {
      this.latitude = coords[0];
      this.longitude = coords[1];
      
      if (this.placemark) {
        this.placemark.geometry.setCoordinates(coords);
      }
      if (this.map) {
        this.map.setCenter(coords, 15);
      }
      this.calculateYandexDistance(coords);
    };

    if (sug.osmCoords) {
      useCoords(sug.osmCoords);
    } else {
      const ymaps = (window as any).ymaps;
      if (ymaps) {
        ymaps.geocode(sug.value).then((res: any) => {
          const firstGeoObject = res.geoObjects.get(0);
          if (firstGeoObject) {
            const coords = firstGeoObject.geometry.getCoordinates();
            useCoords(coords);
          }
        }, (err: any) => {
          console.warn('Yandex geocoding suggestion failed:', err);
        });
      }
    }
  }

  clearAddress(): void {
    this.deliveryAddress = '';
    this.suggestions.set([]);
  }

  onImgError(e: Event): void {
    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=100';
  }
}
