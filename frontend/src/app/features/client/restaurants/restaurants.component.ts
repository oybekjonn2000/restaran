import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { OrderService } from '../../../core/services/order.service';
import { Restaurant } from '../../../core/models/restaurant.model';
import { Food } from '../../../core/models/food.model';
import { Order } from '../../../core/models/order.model';
import { CartService } from '../../../core/services/cart.service';
import { AuthService } from '../../../core/services/auth.service';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { API_BASE } from '../../../core/config';

@Component({
  selector: 'app-restaurants',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, MatProgressSpinnerModule, MatSnackBarModule],
  template: `
    <div class="restaurants-page animate-in">
      
      <!-- ACTIVE ORDER ALERT BOX -->
      @if (activeOrders().length > 0) {
        <div class="active-orders-banner">
          @for (order of activeOrders(); track order.id) {
            <div class="active-order-alert-card animate-pop">
              <div class="alert-left-side">
                <span class="pulse-dot"></span>
                <div class="alert-info-text">
                  <span class="alert-title">Buyurtmangiz yo'lda! Holati: <strong>{{ getStatusLabel(order.status) }}</strong></span>
                  <span class="alert-desc">Buyurtma: #{{ order.id }} • {{ order.items.length }} ta taom</span>
                </div>
              </div>
              <div class="alert-right-side">
                <a routerLink="/client/orders" class="alert-track-btn">Jonli kuzatish 🔍</a>
              </div>
            </div>
          }
        </div>
      }

      <!-- PROMO CAROUSEL SLIDER -->
      <section class="promo-slider-section">
        <div class="promo-slider-container">
          @for (slide of promoSlides; track $index) {
            <div class="promo-slide" 
                 [class.active]="currentSlideIndex() === $index"
                 [style.background]="slide.color">
              <div class="slide-content">
                <span class="slide-badge">{{ slide.badge }}</span>
                <h2 class="slide-title">{{ slide.title }}</h2>
                <p class="slide-desc">{{ slide.desc }}</p>
              </div>
              <div class="slide-action">
                <button class="slide-btn">{{ slide.btnText }} ➡️</button>
              </div>
            </div>
          }
          
          <!-- Slide Navigation Indicators -->
          <div class="slider-dots">
            @for (slide of promoSlides; track $index) {
              <button class="slider-dot" 
                      [class.active]="currentSlideIndex() === $index"
                      (click)="setSlide($index)"></button>
            }
          </div>
        </div>
      </section>

      @if (loading()) {
        <div class="spinner-overlay" style="padding: 40px 0; text-align: center;">
          <mat-spinner diameter="40" color="accent" style="margin: 0 auto;"></mat-spinner>
          <p style="color: #94a3b8; margin-top: 12px; font-size: 0.88rem;">Restoran va taomlar yuklanmoqda...</p>
        </div>
      }

      @if (!loading()) {
        <!-- SINGLE ACTIVE RESTAURANT DIRECT MENU VIEW -->
        @if (restaurants().length === 1 && singleRestaurant()) {
          <section class="single-restaurant-section">
            <div class="single-rest-header">
              <div class="rest-title-area">
                <h1 class="single-rest-name">🏪 {{ singleRestaurant()?.name }}</h1>
                <p class="single-rest-addr">📍 {{ singleRestaurant()?.address || 'Qarshi shahri' }}</p>
              </div>
              <div class="rest-search-box">
                <span class="search-icon">🔍</span>
                <input
                  [(ngModel)]="searchQuery"
                  type="text"
                  placeholder="Taom qidiring..."
                  class="search-input-new"
                  id="single-food-search">
              </div>
            </div>

            <!-- CATEGORIES HORIZONTAL CHIPS SCROLL -->
            <section class="categories-section" style="margin-top: 20px;">
              <h2 class="section-title-new">🍕 Taom Kategoriyalari</h2>
              <div class="categories-chips-scroll">
                @for (cat of categoriesList; track cat.id) {
                  <button 
                    class="category-chip-new" 
                    [class.active]="selectedCategory() === cat.id"
                    (click)="selectCategory(cat.id)">
                    <span class="cat-emoji">{{ cat.emoji }}</span>
                    <span>{{ cat.name }}</span>
                  </button>
                }
              </div>
            </section>

            <!-- SINGLE RESTAURANT FOODS GRID -->
            <section class="single-foods-section" style="margin-top: 24px;">
              <h2 class="section-title-new">🍽️ Menyudagi Taomlar ({{ filteredSingleFoods().length }})</h2>

              @if (filteredSingleFoods().length > 0) {
                <div class="foods-grid-new">
                  @for (food of filteredSingleFoods(); track food.id) {
                    <div class="food-card-new">
                      <div class="food-img-wrap">
                        <img 
                          [src]="getFullUrl(food.imageUrl) || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80'" 
                          [alt]="food.name" 
                          class="food-img"
                          (error)="onImgError($event)">
                        <button 
                          class="fav-heart-btn" 
                          [class.active]="favorites().includes(food.id)" 
                          (click)="toggleFavorite(food.id, $event)">
                          ❤️
                        </button>
                        <span class="food-rating-tag">⭐ 4.8</span>
                      </div>
                      <div class="food-content-new">
                        <span class="food-cat-badge">{{ food.category?.name || 'Taom' }}</span>
                        <h4 class="food-title-new">{{ food.name }}</h4>
                        <p class="food-desc-new">{{ food.description || 'Mazali va toyimli taom.' }}</p>
                        <div class="food-footer-new">
                          <span class="food-price-new">{{ food.price | number:'1.0-0' }} so'm</span>
                          <button class="food-add-btn-new" (click)="addToCart(food)">
                            <span>+</span> Savatga
                          </button>
                        </div>
                      </div>
                    </div>
                  }
                </div>
              } @else {
                <div class="empty-state-new">
                  <div class="empty-icon">🍽️</div>
                  <h3>Taomlar topilmadi</h3>
                  <p>Qidiruv shartini o'zgartiring yoki boshqa kategoriyani tanlang</p>
                </div>
              }
            </section>
          </section>

        } @else if (restaurants().length > 1) {
          <!-- MULTIPLE RESTAURANTS VIEW -->
          <section class="categories-section">
            <h2 class="section-title-new">🍕 Taom Kategoriyalari</h2>
            <div class="categories-chips-scroll">
              @for (cat of categoriesList; track cat.id) {
                <button 
                  class="category-chip-new" 
                  [class.active]="selectedCategory() === cat.id"
                  (click)="selectCategory(cat.id)">
                  <span class="cat-emoji">{{ cat.emoji }}</span>
                  <span>{{ cat.name }}</span>
                </button>
              }
            </div>
          </section>

          <section class="restaurants-section-new" style="margin-top: 24px;">
            <h2 class="section-title-new">🏪 Hamkor Restoranlar</h2>
            
            <div class="restaurants-grid-new">
              @for (r of filteredRestaurants(); track r.id) {
                <div class="restaurant-card-new" [routerLink]="['/client/menu', r.id]">
                  <div class="card-img-wrap-new">
                    <img 
                      [src]="getFullUrl(r.imageUrl) || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=500'" 
                      [alt]="r.name" 
                      class="card-img-new"
                      (error)="onImgError($event)">
                    <span class="open-status-badge">OPEN</span>
                    <div class="rating-badge-new">⭐ 4.8</div>
                  </div>
                  <div class="card-content-new">
                    <h3 class="rest-name-new">{{ r.name }}</h3>
                    <p class="rest-desc-new">📍 {{ r.address || 'Qarshi shahri' }}</p>
                    <div class="rest-info-row-new">
                      <span class="info-item-new">⏰ 20-30 daqiqa</span>
                      <span class="info-item-new">🚚 9,000 so'm</span>
                      <span class="info-item-new">🍔 Min: 30,000 so'm</span>
                    </div>
                  </div>
                </div>
              }
            </div>

            @if (filteredRestaurants().length === 0) {
              <div class="empty-state-new">
                <div class="empty-icon">🏪</div>
                <h3>Mos restoranlar topilmadi</h3>
                <p>Qidiruv shartlarini o'zgartirib ko'ring</p>
              </div>
            }
          </section>

        } @else {
          <!-- ZERO ACTIVE RESTAURANTS -->
          <div class="empty-state-new" style="padding: 60px 0;">
            <div class="empty-icon">🏪</div>
            <h3>Hozircha faol restoran mavjud emas.</h3>
            <p style="color: #94a3b8; margin-top: 8px;">Tez orada yangi restoranlar qo'shiladi!</p>
          </div>
        }
      }

      <!-- Reusable Clear Cart Confirmation Modal -->
      @if (showConfirmDialog()) {
        <div class="modal-overlay" (click)="closeConfirm()">
          <div class="modal-card animate-pop" (click)="$event.stopPropagation()">
            <div class="modal-icon">⚠️</div>
            <h3 class="modal-title">Savatingiz tozalansinmi?</h3>
            <p class="modal-desc">Sizning savatingizda boshqa restoranning taomlari bor. Yangi restorandan buyurtma berish uchun savatni tozalash zarur.</p>
            <p style="color: #f97316; font-weight: 700; margin-bottom: 20px;">Hozirgi savat tozalanib, ushbu taom qo'shilsinmi?</p>
            <div class="modal-buttons-row">
              <button class="modal-btn btn-back" (click)="closeConfirm()">Bekor qilish</button>
              <button class="modal-btn btn-signin-gradient" (click)="confirmClearAndAdd()">Savatni tozalash</button>
            </div>
          </div>
        </div>
      }

    </div>
  `,
  styles: [`
    .restaurants-page {
      max-width: 1200px;
      margin: 0 auto;
      padding-bottom: 60px;
      font-family: 'Poppins', sans-serif;
      color: #f1f5f9;
      background: #0f172a;
    }

    /* ACTIVE ORDER BANNER */
    .active-orders-banner {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-bottom: 24px;
    }
    .active-order-alert-card {
      background: linear-gradient(135deg, rgba(249, 115, 22, 0.15) 0%, rgba(239, 68, 68, 0.1) 100%);
      border: 1px solid rgba(249, 115, 22, 0.3);
      border-radius: 16px;
      padding: 16px 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 16px;
      box-shadow: 0 8px 32px rgba(249, 115, 22, 0.15);
    }
    .alert-left-side {
      display: flex;
      align-items: center;
      gap: 14px;
    }
    .pulse-dot {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background: #10b981;
      box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7);
      animation: pulse 1.6s infinite;
    }
    @keyframes pulse {
      0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
      70% { transform: scale(1); box-shadow: 0 0 0 10px rgba(16, 185, 129, 0); }
      100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
    }
    .alert-info-text {
      display: flex;
      flex-direction: column;
      text-align: left;
    }
    .alert-title {
      font-size: 0.94rem;
      font-weight: 700;
      color: #fff;
    }
    .alert-desc {
      font-size: 0.8rem;
      color: #94a3b8;
      margin-top: 2px;
    }
    .alert-track-btn {
      background: #f97316;
      color: #fff;
      font-size: 0.85rem;
      font-weight: 700;
      padding: 10px 18px;
      border-radius: 12px;
      text-decoration: none;
      box-shadow: 0 4px 14px rgba(249, 115, 22, 0.3);
      transition: all 0.2s;
    }
    .alert-track-btn:hover {
      transform: translateY(-1px);
      box-shadow: 0 6px 18px rgba(249, 115, 22, 0.4);
    }

    /* PROMO CAROUSEL SLIDER */
    .promo-slider-section {
      margin-bottom: 28px;
      position: relative;
    }
    .promo-slider-container {
      position: relative;
      height: 165px;
      border-radius: 20px;
      overflow: hidden;
      border: 1px solid #334155;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
    }
    .promo-slide {
      position: absolute;
      inset: 0;
      padding: 24px 32px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.6s ease, transform 0.6s ease;
      transform: scale(0.98);
      gap: 20px;
    }
    .promo-slide.active {
      opacity: 1;
      pointer-events: auto;
      transform: scale(1);
    }
    .slide-badge {
      display: inline-block;
      background: rgba(249, 115, 22, 0.25);
      color: #f97316;
      border: 1px solid rgba(249, 115, 22, 0.4);
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 0.72rem;
      font-weight: 800;
      letter-spacing: 0.5px;
      margin-bottom: 8px;
    }
    .slide-title {
      font-size: 1.35rem;
      font-weight: 800;
      color: #fff;
      margin: 0 0 6px 0;
    }
    .slide-desc {
      font-size: 0.84rem;
      color: #cbd5e1;
      margin: 0;
      max-width: 500px;
      line-height: 1.4;
    }
    .slide-btn {
      background: #f97316;
      color: #fff;
      border: none;
      padding: 10px 20px;
      border-radius: 12px;
      font-weight: 700;
      font-size: 0.88rem;
      cursor: pointer;
      box-shadow: 0 6px 16px rgba(249, 115, 22, 0.4);
      transition: all 0.2s;
    }
    .slide-btn:hover {
      transform: translateX(4px);
      box-shadow: 0 8px 20px rgba(249, 115, 22, 0.5);
    }
    .slider-dots {
      position: absolute;
      bottom: 12px;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      gap: 6px;
      z-index: 5;
    }
    .slider-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.3);
      border: none;
      cursor: pointer;
      padding: 0;
      transition: all 0.3s ease;
    }
    .slider-dot.active {
      width: 24px;
      border-radius: 4px;
      background: #f97316;
    }

    /* SINGLE RESTAURANT HEADER STYLES */
    .single-rest-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 16px;
      background: #1e293b;
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 20px;
      padding: 20px 24px;
      box-shadow: 0 10px 25px rgba(0,0,0,0.3);
    }
    .single-rest-name {
      font-size: 1.5rem;
      font-weight: 800;
      color: #fff;
      margin: 0;
    }
    .single-rest-addr {
      font-size: 0.88rem;
      color: #94a3b8;
      margin: 4px 0 0 0;
    }
    .rest-search-box {
      display: flex;
      align-items: center;
      background: rgba(15, 23, 42, 0.7);
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 14px;
      padding: 8px 14px;
      width: 100%;
      max-width: 320px;
    }
    .search-input-new {
      background: none;
      border: none;
      outline: none;
      color: #fff;
      font-size: 0.88rem;
      width: 100%;
      margin-left: 8px;
    }

    /* CATEGORIES CHIPS SCROLL */
    .categories-section {
      margin-bottom: 24px;
    }
    .section-title-new {
      font-size: 1.15rem;
      font-weight: 800;
      color: #fff;
      margin-bottom: 14px;
    }
    .categories-chips-scroll {
      display: flex;
      gap: 10px;
      overflow-x: auto;
      padding-bottom: 8px;
      scrollbar-width: thin;
      scrollbar-color: #334155 transparent;
    }
    .category-chip-new {
      display: flex;
      align-items: center;
      gap: 8px;
      background: #1e293b;
      border: 1px solid #334155;
      padding: 8px 16px;
      border-radius: 20px;
      color: #cbd5e1;
      font-size: 0.86rem;
      font-weight: 600;
      cursor: pointer;
      white-space: nowrap;
      transition: all 0.2s ease;
    }
    .category-chip-new:hover {
      background: #334155;
      color: #fff;
    }
    .category-chip-new.active {
      background: #f97316;
      border-color: #f97316;
      color: #fff;
      box-shadow: 0 4px 14px rgba(249, 115, 22, 0.4);
    }
    .cat-emoji { font-size: 1.05rem; }

    /* RESTAURANTS GRID */
    .restaurants-grid-new {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
      gap: 20px;
    }
    .restaurant-card-new {
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 18px;
      overflow: hidden;
      cursor: pointer;
      transition: all 0.3s ease;
    }
    .restaurant-card-new:hover {
      transform: translateY(-4px);
      box-shadow: 0 12px 28px rgba(0, 0, 0, 0.4);
      border-color: #f97316;
    }
    .card-img-wrap-new {
      position: relative;
      height: 140px;
      overflow: hidden;
    }
    .card-img-new {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.4s ease;
    }
    .restaurant-card-new:hover .card-img-new {
      transform: scale(1.05);
    }
    .open-status-badge {
      position: absolute;
      top: 10px;
      left: 10px;
      background: #10b981;
      color: #fff;
      font-size: 0.68rem;
      font-weight: 800;
      padding: 3px 8px;
      border-radius: 6px;
    }
    .rating-badge-new {
      position: absolute;
      bottom: 10px;
      right: 10px;
      background: rgba(15, 23, 42, 0.85);
      backdrop-filter: blur(4px);
      color: #fbbf24;
      font-size: 0.78rem;
      font-weight: 700;
      padding: 4px 10px;
      border-radius: 20px;
      border: 1px solid rgba(255, 255, 255, 0.1);
    }
    .card-content-new {
      padding: 16px;
    }
    .rest-name-new {
      font-size: 1.05rem;
      font-weight: 700;
      color: #fff;
      margin: 0 0 4px 0;
    }
    .rest-desc-new {
      font-size: 0.8rem;
      color: #94a3b8;
      margin: 0 0 12px 0;
    }
    .rest-info-row-new {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }
    .info-item-new {
      background: rgba(255, 255, 255, 0.05);
      color: #cbd5e1;
      font-size: 0.72rem;
      padding: 3px 8px;
      border-radius: 6px;

    }

    /* FOODS GRID */
    .foods-grid-new {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
      gap: 20px;
    }
    .food-card-new {
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 18px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      transition: all 0.3s ease;
    }
    .food-card-new:hover {
      transform: translateY(-4px);
      box-shadow: 0 12px 28px rgba(0,0,0,0.4);
      border-color: rgba(249, 115, 22, 0.5);
    }
    .food-img-wrap {
      position: relative;
      height: 140px;
      overflow: hidden;
    }
    .food-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .fav-heart-btn {
      position: absolute;
      top: 8px;
      right: 8px;
      background: rgba(15, 23, 42, 0.7);
      border: none;
      border-radius: 50%;
      width: 32px;
      height: 32px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.9rem;
      opacity: 0.7;
      transition: all 0.2s;
    }
    .fav-heart-btn.active, .fav-heart-btn:hover {
      opacity: 1;
      transform: scale(1.1);
    }
    .food-rating-tag {
      position: absolute;
      bottom: 8px;
      left: 8px;
      background: rgba(15, 23, 42, 0.8);
      color: #fbbf24;
      font-size: 0.72rem;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 12px;
    }
    .food-content-new {
      padding: 14px;
      display: flex;
      flex-direction: column;
      flex: 1;
    }
    .food-cat-badge {
      font-size: 0.7rem;
      color: #f97316;
      font-weight: 700;
      text-transform: uppercase;
      margin-bottom: 4px;
    }
    .food-title-new {
      font-size: 0.98rem;
      font-weight: 700;
      color: #fff;
      margin: 0 0 6px 0;
    }
    .food-desc-new {
      font-size: 0.78rem;
      color: #94a3b8;
      margin: 0 0 12px 0;
      line-height: 1.35;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      flex: 1;
    }
    .food-footer-new {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: auto;
    }
    .food-price-new {
      font-size: 0.96rem;
      font-weight: 800;
      color: #34d399;
    }
    .food-add-btn-new {
      background: #f97316;
      color: #fff;
      border: none;
      padding: 6px 14px;
      border-radius: 10px;
      font-size: 0.8rem;
      font-weight: 700;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 4px;
      transition: all 0.2s;
    }
    .food-add-btn-new:hover {
      background: #ea580c;
      transform: scale(1.05);
    }

    .empty-state-new {
      text-align: center;
      padding: 40px 20px;
      background: #1e293b;
      border-radius: 18px;
      border: 1px dashed #334155;
    }
    .empty-icon { font-size: 2.5rem; margin-bottom: 12px; }

    /* CONFIRM MODAL */
    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.7);
      backdrop-filter: blur(4px);
      z-index: 1000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .modal-card {
      background: #0f172a;
      border: 1px solid #334155;
      border-radius: 24px;
      padding: 28px;
      max-width: 440px;
      width: 100%;
      text-align: center;
      box-shadow: 0 20px 50px rgba(0,0,0,0.6);
    }
    .modal-icon { font-size: 2.8rem; margin-bottom: 12px; }
    .modal-title { font-size: 1.2rem; font-weight: 800; color: #fff; margin-bottom: 10px; }
    .modal-desc { font-size: 0.86rem; color: #94a3b8; line-height: 1.5; margin-bottom: 12px; }
    .modal-buttons-row { display: flex; gap: 12px; }
    .modal-btn {
      flex: 1;
      padding: 12px;
      border-radius: 12px;
      font-weight: 700;
      font-size: 0.88rem;
      cursor: pointer;
      border: none;
    }
    .btn-back { background: #334155; color: #fff; }
    .btn-signin-gradient { background: #f97316; color: #fff; }

    @media (max-width: 640px) {
      .restaurants-grid-new { grid-template-columns: 1fr; }
      .foods-grid-new { grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); }
      .food-img-wrap { height: 120px; }
    }
  `]
})
export class RestaurantsComponent implements OnInit, OnDestroy {
  restaurants = signal<Restaurant[]>([]);
  singleRestaurant = signal<Restaurant | null>(null);
  singleFoods = signal<Food[]>([]);
  loading = signal(true);
  searchQuery = '';

  activeOrders = signal<Order[]>([]);
  selectedCategory = signal<string>('all');
  favorites = signal<number[]>([]);

  // Cart confirmation states
  showConfirmDialog = signal(false);
  pendingFood: Food | null = null;

  // Promo Slider States
  promoSlides = [
    {
      badge: 'AKSIYA',
      title: 'Pitsalarga 20% Chegirma! 🍕',
      desc: 'Ushbu haftada barcha pitsalar va kalzonlar uchun narxlar 20% ga tushirildi. Promo kod: PIZZA20',
      color: 'linear-gradient(135deg, #1e1b4b 0%, #311042 100%)',
      btnText: "Buyurtma berish"
    },
    {
      badge: 'TEKIN YETKAZISH',
      title: 'Yetkazib berish mutlaqo tekin! 🚚',
      desc: '50,000 so\'mdan yuqori bo\'lgan barcha buyurtmalar uchun bepul yetkazib berish xizmati. Promo kod: BEPUL',
      color: 'linear-gradient(135deg, #064e3b 0%, #0f172a 100%)',
      btnText: "Ko'rish"
    },
    {
      badge: 'BONUS',
      title: 'Sovg\'aga Pepsi-Cola! 🥤',
      desc: '100,000 so\'mdan ortiq har bir buyurtma bilan 1 litr Pepsi bepul qo\'shib beriladi. Promo kod: PEPSI',
      color: 'linear-gradient(135deg, #1e3a8a 0%, #1e1b4b 100%)',
      btnText: "Batafsil"
    }
  ];
  currentSlideIndex = signal(0);
  private promoIntervalId: any;

  categoriesList = [
    { id: 'all', name: 'Barchasi', emoji: '🌟' },
    { id: 'pizza', name: 'Pizza', emoji: '🍕' },
    { id: 'burger', name: 'Burger', emoji: '🍔' },
    { id: 'lavash', name: 'Lavash', emoji: '🍗' },
    { id: 'drinks', name: 'Ichimliklar', emoji: '🥤' },
    { id: 'sweets', name: 'Shirinliklar', emoji: '🍰' },
    { id: 'salads', name: 'Salatlar', emoji: '🥗' },
    { id: 'fastfood', name: 'Fast Food', emoji: '🍟' }
  ];

  constructor(
    private orderService: OrderService,
    private cart: CartService,
    private auth: AuthService,
    private snack: MatSnackBar,
    private router: Router
  ) {}

  getFullUrl(url: string | null | undefined): string {
    if (!url) return '';
    if (url.startsWith('/uploads')) {
      return `${API_BASE}${url}`;
    }
    return url;
  }

  ngOnInit(): void {
    window.scrollTo(0, 0);
    this.loadData();
    this.startPromoTimer();
  }

  ngOnDestroy(): void {
    this.stopPromoTimer();
  }

  startPromoTimer(): void {
    this.stopPromoTimer();
    this.promoIntervalId = setInterval(() => {
      this.currentSlideIndex.set((this.currentSlideIndex() + 1) % this.promoSlides.length);
    }, 5000);
  }

  stopPromoTimer(): void {
    if (this.promoIntervalId) {
      clearInterval(this.promoIntervalId);
    }
  }

  setSlide(index: number): void {
    this.currentSlideIndex.set(index);
    this.startPromoTimer();
  }

  loadData(): void {
    this.loading.set(true);

    // Fetch active orders if client is logged in
    if (this.auth.isLoggedIn()) {
      this.orderService.getMyOrders().subscribe({
        next: (orders) => {
          const actives = orders.filter(o => o.status !== 'DELIVERED' && o.status !== 'CANCELED');
          this.activeOrders.set(actives);
        }
      });
    }

    // Fetch active restaurants
    this.orderService.getRestaurants().subscribe({
      next: (data) => {
        this.restaurants.set(data);
        
        // Agar faqat 1 ta aktiv restoran bo'lsa, uning taomlarini yuklaymiz
        if (data.length === 1) {
          const activeRest = data[0];
          this.singleRestaurant.set(activeRest);
          this.orderService.getRestaurantFoods(activeRest.id).subscribe({
            next: (foods) => {
              this.singleFoods.set(foods);
              this.loading.set(false);
            },
            error: () => this.loading.set(false)
          });
        } else {
          this.singleRestaurant.set(null);
          this.singleFoods.set([]);
          this.loading.set(false);
        }
      },
      error: () => this.loading.set(false)
    });
  }

  filteredRestaurants() {
    const query = this.searchQuery.toLowerCase().trim();
    if (!query) return this.restaurants();
    return this.restaurants().filter(r => r.name.toLowerCase().includes(query));
  }

  filteredSingleFoods(): Food[] {
    let foods = this.singleFoods();
    const query = this.searchQuery.toLowerCase().trim();
    const cat = this.selectedCategory();

    if (cat !== 'all') {
      foods = foods.filter(f => this.getFoodCategoryKey(f) === cat || (f.category?.name || '').toLowerCase().includes(cat));
    }

    if (query) {
      foods = foods.filter(f => 
        f.name.toLowerCase().includes(query) || 
        (f.description || '').toLowerCase().includes(query) ||
        (f.category?.name || '').toLowerCase().includes(query)
      );
    }

    return foods;
  }

  selectCategory(catId: string): void {
    this.selectedCategory.set(catId);
  }

  toggleFavorite(foodId: number, event: Event) {
    event.stopPropagation();
    const current = this.favorites();
    if (current.includes(foodId)) {
      this.favorites.set(current.filter(id => id !== foodId));
      this.snack.open('💔 Sevimlilardan olib tashlandi', '', { duration: 1500 });
    } else {
      this.favorites.set([...current, foodId]);
      this.snack.open('❤️ Sevimlilarga qo\'shildi!', '', { duration: 1500 });
    }
  }

  addToCart(food: Food): void {
    if (!this.cart.canAdd(food)) {
      this.pendingFood = food;
      this.showConfirmDialog.set(true);
      return;
    }

    this.cart.addItem(food);
    this.snack.open(`✅ ${food.name} savatga qo'shildi!`, '', {
      duration: 2000,
      horizontalPosition: 'right',
      verticalPosition: 'bottom'
    });
  }

  closeConfirm(): void {
    this.showConfirmDialog.set(false);
    this.pendingFood = null;
  }

  confirmClearAndAdd(): void {
    if (this.pendingFood) {
      this.cart.clear();
      this.cart.addItem(this.pendingFood);
      this.snack.open(`🧹 Oldingi savat tozalandi. ✅ ${this.pendingFood.name} qo'shildi!`, '', {
        duration: 3000,
        horizontalPosition: 'right',
        verticalPosition: 'bottom'
      });
      this.closeConfirm();
    }
  }

  getFoodCategoryKey(food: Food): string {
    const catName = (food.category?.name || '').toLowerCase();
    const foodName = food.name.toLowerCase();
    
    if (catName.includes('piz') || catName.includes('pic') || foodName.includes('piz')) return 'pizza';
    if (catName.includes('burg') || foodName.includes('burg') || foodName.includes('gamburger')) return 'burger';
    if (catName.includes('lav') || foodName.includes('lav') || foodName.includes('shaur')) return 'lavash';
    if (catName.includes('ich') || catName.includes('suv') || catName.includes('cola') || catName.includes('pep') || foodName.includes('cola') || foodName.includes('pep') || foodName.includes('choy')) return 'drinks';
    if (catName.includes('shirin') || catName.includes('tort') || catName.includes('keks') || foodName.includes('cake') || foodName.includes('desert')) return 'sweets';
    if (catName.includes('salat') || foodName.includes('salat')) return 'salads';
    return 'fastfood';
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      'PENDING': 'Kutilmoqda',
      'PREPARING': 'Tayyorlanmoqda',
      'COURIER_ACCEPTED': 'Kuryer qabul qildi',
      'COURIER_AT_RESTAURANT': 'Kuryer restoranda',
      'DELIVERING': 'Yetkazib berilmoqda',
      'COURIER_AT_CLIENT': 'Kuryer yetib keldi',
      'DELIVERED': 'Yetkazildi',
      'CANCELED': 'Bekor qilindi'
    };
    return labels[status] || status;
  }

  onImgError(e: Event): void {
    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=500';
  }
}
