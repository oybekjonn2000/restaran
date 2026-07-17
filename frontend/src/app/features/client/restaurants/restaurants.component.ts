import { Component, OnInit, signal } from '@angular/core';
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

      <!-- HERO BANNER -->
      <section class="hero-banner-new">
        <div class="hero-bg-effects">
          <div class="blur-circle c1"></div>
          <div class="blur-circle c2"></div>
        </div>
        <div class="hero-content">
          <span class="hero-tag-new">Aksiya va chegirmalar</span>
          <h1 class="hero-title-new">Karshi taomlarini tezkor yetkazib berish 🥭</h1>
          <p class="hero-desc-new">Eng sara va lazzatli taomlar uyingizgacha 25 daqiqada yetkaziladi. Birinchi buyurtmada promo kod yordamida chegirmaga ega bo'ling!</p>
          <div class="hero-badge-row">
            <span class="hero-badge">🎫 Promo kod: MANGO2026</span>
            <span class="hero-badge">🚚 Tekin yetkazish (50k+ so'm)</span>
            <span class="hero-badge">⏱️ 20-35 daqiqa</span>
          </div>
        </div>
      </section>

      <!-- SPECIAL OFFERS SECTION -->
      <section class="special-offers-section">
        <h2 class="section-title-new">🎁 Maxsus Takliflar</h2>
        <div class="offers-carousel-wrap">
          <div class="offer-card">
            <span class="offer-badge">Chegirma</span>
            <h4 class="offer-title">Pitsalarga 20% Chegirma!</h4>
            <p class="offer-desc">Ushbu haftada barcha pitsalar va kalzonlar uchun narxlar 20% ga tushirildi.</p>
            <div class="offer-footer">
              <span class="offer-code-tag">PIZZA20</span>
              <span class="offer-action-text">Buyurtma berish ➡️</span>
            </div>
          </div>
          <div class="offer-card">
            <span class="offer-badge">Tekin</span>
            <h4 class="offer-title">Yetkazish Mutlaqo Tekin!</h4>
            <p class="offer-desc">50,000 so'mdan yuqori bo'lgan har qanday buyurtmani bepul yetkazib beramiz.</p>
            <div class="offer-footer">
              <span class="offer-code-tag">BEPUL</span>
              <span class="offer-action-text">Ko'rish ➡️</span>
            </div>
          </div>
          <div class="offer-card">
            <span class="offer-badge">Bonus</span>
            <h4 class="offer-title">Sovg'a sifatida Pepsi!</h4>
            <p class="offer-desc">100,000 so'mdan ortiq har bir buyurtma bilan 1 litr Pepsi-Cola qo'shib beriladi.</p>
            <div class="offer-footer">
              <span class="offer-code-tag">PEPSI</span>
              <span class="offer-action-text">Qo'shiling ➡️</span>
            </div>
          </div>
        </div>
      </section>

      <!-- CATEGORIES HORIZONTAL chips scroll -->
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

      @if (loading()) {
        <div class="spinner-overlay" style="padding: 40px 0; text-align: center;">
          <mat-spinner diameter="40" color="accent" style="margin: 0 auto;"></mat-spinner>
          <p style="color: #94a3b8; margin-top: 12px; font-size: 0.88rem;">Restoran va taomlar yuklanmoqda...</p>
        </div>
      }

      @if (!loading()) {
        <!-- RESTAURANTS SECTION -->
        <section class="restaurants-section-new">
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

          @if (restaurants().length === 0) {
            <div class="empty-state-new">
              <div class="empty-icon">🏪</div>
              <h3>Hozircha faol restoran mavjud emas.</h3>
            </div>
          } @else if (filteredRestaurants().length === 0) {
            <div class="empty-state-new">
              <div class="empty-icon">🏪</div>
              <h3>Mos restoranlar topilmadi</h3>
              <p>Qidiruv shartlarini o'zgartirib ko'ring</p>
            </div>
          }
        </section>

        <!-- POPULAR FOODS SECTION -->
        @if (popularFoods().length > 0) {
          <section class="popular-foods-section">
            <h2 class="section-title-new">⭐️ Eng Mashhur Taomlar</h2>
            
            <div class="foods-grid-new">
              @for (food of popularFoods(); track food.id) {
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
                    <span class="food-rating-tag">⭐ 4.7</span>
                  </div>
                  <div class="food-content-new">
                    <span class="food-cat-badge">{{ food.category?.name || 'Taom' }}</span>
                    <h4 class="food-title-new">{{ food.name }}</h4>
                    <p class="food-desc-new">{{ food.description || 'Mazali va to\\'yimli taom.' }}</p>
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
          </section>
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

    /* HERO PROMO BANNER */
    .hero-banner-new {
      background: linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%);
      border: 1px solid #334155;
      border-radius: 20px;
      padding: 40px;
      position: relative;
      overflow: hidden;
      margin-bottom: 32px;
      text-align: left;
    }
    .hero-bg-effects {
      position: absolute;
      inset: 0;
      pointer-events: none;
    }
    .blur-circle {
      position: absolute;
      border-radius: 50%;
      filter: blur(80px);
      opacity: 0.15;
    }
    .blur-circle.c1 { width: 300px; height: 300px; background: #f97316; top: -50px; left: -50px; }
    .blur-circle.c2 { width: 250px; height: 250px; background: #ef4444; bottom: -40px; right: -40px; }
    .hero-tag-new {
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
    .hero-title-new {
      font-size: 2.2rem;
      font-weight: 800;
      color: #fff;
      margin: 16px 0 8px 0;
      max-width: 600px;
    }
    .hero-desc-new {
      font-size: 0.95rem;
      color: #94a3b8;
      max-width: 500px;
      line-height: 1.5;
    }
    .hero-badge-row {
      display: flex;
      gap: 12px;
      margin-top: 24px;
      flex-wrap: wrap;
    }
    .hero-badge {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.06);
      padding: 8px 14px;
      border-radius: 12px;
      font-size: 0.8rem;
      color: #cbd5e1;
      font-weight: 600;
    }

    /* CATEGORIES HORIZONTAL SCROLL */
    .categories-section {
      margin-bottom: 32px;
      text-align: left;
    }
    .section-title-new {
      font-size: 1.25rem;
      font-weight: 800;
      color: #fff;
      margin-bottom: 16px;
    }
    .categories-chips-scroll {
      display: flex;
      gap: 12px;
      overflow-x: auto;
      padding-bottom: 8px;
      scrollbar-width: none;
    }
    .categories-chips-scroll::-webkit-scrollbar { display: none; }
    .category-chip-new {
      background: #1e293b;
      border: 1px solid #334155;
      padding: 10px 20px;
      border-radius: 50px;
      display: flex;
      align-items: center;
      gap: 8px;
      color: #94a3b8;
      font-size: 0.88rem;
      font-weight: 600;
      cursor: pointer;
      white-space: nowrap;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .category-chip-new:hover {
      border-color: #f97316;
      color: #fff;
      transform: translateY(-1px);
    }
    .category-chip-new.active {
      background: #f97316;
      border-color: #f97316;
      color: #fff;
      box-shadow: 0 4px 14px rgba(249, 115, 22, 0.3);
    }
    .cat-emoji { font-size: 1.1rem; }

    /* SPECIAL OFFERS CAROUSEL */
    .special-offers-section {
      margin-bottom: 36px;
      text-align: left;
    }
    .offers-carousel-wrap {
      display: flex;
      gap: 16px;
      overflow-x: auto;
      padding-bottom: 12px;
      scrollbar-width: none;
    }
    .offers-carousel-wrap::-webkit-scrollbar { display: none; }
    .offer-card {
      min-width: 280px;
      max-width: 280px;
      background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
      border: 1px solid #334155;
      border-radius: 16px;
      padding: 20px;
      position: relative;
      overflow: hidden;
      box-shadow: 0 4px 20px rgba(0,0,0,0.15);
      text-align: left;
    }
    .offer-badge {
      background: #ef4444;
      color: #fff;
      font-size: 0.68rem;
      font-weight: 800;
      padding: 3px 8px;
      border-radius: 50px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      display: inline-block;
      margin-bottom: 12px;
    }
    .offer-title { font-size: 0.94rem; font-weight: 800; color: #fff; margin-bottom: 6px; }
    .offer-desc { font-size: 0.78rem; color: #94a3b8; line-height: 1.45; margin-bottom: 14px; }
    .offer-footer { display: flex; justify-content: space-between; align-items: center; }
    .offer-code-tag { font-size: 0.75rem; background: rgba(255,255,255,0.03); border: 1px dashed rgba(255,255,255,0.15); padding: 4px 8px; border-radius: 8px; font-weight: 700; color: #fff; }
    .offer-action-text { font-size: 0.75rem; color: #f97316; font-weight: 700; }

    /* RESTAURANTS SECTION */
    .restaurants-section-new {
      margin-bottom: 40px;
      text-align: left;
    }
    .restaurants-grid-new {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 24px;
    }
    .restaurant-card-new {
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 18px;
      overflow: hidden;
      cursor: pointer;
      display: flex;
      flex-direction: column;
      box-shadow: 0 4px 20px rgba(0,0,0,0.15);
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .restaurant-card-new:hover {
      transform: translateY(-4px);
      border-color: #f97316;
      box-shadow: 0 8px 30px rgba(249, 115, 22, 0.15);
    }
    .card-img-wrap-new {
      position: relative;
      height: 170px;
      overflow: hidden;
    }
    .card-img-new { width: 100%; height: 100%; object-fit: cover; transition: transform 0.4s ease; }
    .restaurant-card-new:hover .card-img-new { transform: scale(1.04); }
    .rating-badge-new {
      position: absolute;
      top: 12px;
      right: 12px;
      background: rgba(15, 23, 42, 0.8);
      backdrop-filter: blur(4px);
      color: #fbbf24;
      font-size: 0.72rem;
      font-weight: 700;
      padding: 4px 8px;
      border-radius: 12px;
      border: 1px solid rgba(251, 191, 36, 0.25);
    }
    .open-status-badge {
      position: absolute;
      top: 12px;
      left: 12px;
      background: rgba(16, 185, 129, 0.85);
      backdrop-filter: blur(4px);
      color: #fff;
      font-size: 0.68rem;
      font-weight: 800;
      padding: 4px 8px;
      border-radius: 8px;
      text-transform: uppercase;
    }
    .card-content-new { padding: 20px; display: flex; flex-direction: column; gap: 8px; text-align: left; }
    .rest-name-new { font-size: 1.15rem; font-weight: 800; color: #fff; }
    .rest-desc-new { font-size: 0.8rem; color: #94a3b8; line-height: 1.45; }
    .rest-info-row-new {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      font-size: 0.75rem;
      color: #64748b;
      margin-top: 6px;
      border-top: 1px solid rgba(255,255,255,0.03);
      padding-top: 10px;
    }
    .info-item-new { display: flex; align-items: center; gap: 4px; }

    /* POPULAR FOODS SECTION */
    .popular-foods-section {
      margin-bottom: 40px;
      text-align: left;
    }
    .foods-grid-new {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
      gap: 20px;
    }
    .food-card-new {
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 16px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      position: relative;
      box-shadow: 0 4px 20px rgba(0,0,0,0.1);
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .food-card-new:hover {
      transform: translateY(-4px);
      border-color: #f97316;
      box-shadow: 0 8px 24px rgba(249, 115, 22, 0.1);
    }
    .food-img-wrap {
      position: relative;
      height: 150px;
      overflow: hidden;
      background: #0f172a;
    }
    .food-img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.4s ease; }
    .food-card-new:hover .food-img { transform: scale(1.04); }
    .fav-heart-btn {
      position: absolute;
      top: 10px;
      right: 10px;
      background: rgba(15, 23, 42, 0.7);
      backdrop-filter: blur(4px);
      border: none;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      color: #94a3b8;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      font-size: 1rem;
      transition: all 0.2s;
    }
    .fav-heart-btn:hover { color: #ef4444; background: rgba(15,23,42,0.9); }
    .fav-heart-btn.active { color: #ef4444; }
    .food-rating-tag {
      position: absolute;
      bottom: 8px;
      left: 8px;
      background: rgba(15, 23, 42, 0.75);
      color: #fbbf24;
      font-size: 0.68rem;
      font-weight: 700;
      padding: 2px 6px;
      border-radius: 8px;
    }
    .food-content-new { padding: 16px; display: flex; flex-direction: column; gap: 6px; flex: 1; text-align: left; }
    .food-cat-badge {
      font-size: 0.68rem;
      color: #f97316;
      background: rgba(249, 115, 22, 0.1);
      padding: 2px 8px;
      border-radius: 4px;
      width: fit-content;
      font-weight: 700;
    }
    .food-title-new { font-size: 0.95rem; font-weight: 800; color: #fff; }
    .food-desc-new {
      font-size: 0.78rem;
      color: #94a3b8;
      line-height: 1.4;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      margin-bottom: 10px;
    }
    .food-footer-new {
      margin-top: auto;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-top: 1px solid rgba(255,255,255,0.03);
      padding-top: 10px;
    }
    .food-price-new { font-size: 1.05rem; font-weight: 800; color: #fff; }
    .food-add-btn-new {
      background: #f97316;
      border: none;
      color: #fff;
      font-size: 0.78rem;
      font-weight: 700;
      padding: 6px 14px;
      border-radius: 10px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 4px;
      transition: all 0.2s;
      box-shadow: 0 4px 10px rgba(249, 115, 22, 0.2);
    }
    .food-add-btn-new:hover {
      background: #ea580c;
      box-shadow: 0 6px 14px rgba(249, 115, 22, 0.3);
    }

    /* EMPTY STATES */
    .empty-state-new {
      padding: 60px 20px;
      text-align: center;
      color: #94a3b8;
    }
    .empty-icon { font-size: 2.5rem; margin-bottom: 12px; }

    /* CONFIRMATION DIALOG MODAL */
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
    .btn-signin-gradient {
      background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
      color: #fff;
      box-shadow: 0 4px 15px rgba(249, 115, 22, 0.25);
    }
    .btn-signin-gradient:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 6px 20px rgba(249, 115, 22, 0.35);
    }

    /* RESPONSIVE DESIGN */
    @media (max-width: 768px) {
      .hero-banner-new { padding: 24px; }
      .hero-title-new { font-size: 1.6rem; }
      .restaurants-grid-new { grid-template-columns: 1fr; }
      .foods-grid-new { grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); }
      .food-img-wrap { height: 120px; }
    }
  `]
})
export class RestaurantsComponent implements OnInit {
  restaurants = signal<Restaurant[]>([]);
  loading = signal(true);
  searchQuery = '';

  allFoods = signal<Food[]>([]);
  popularFoods = signal<Food[]>([]);
  activeOrders = signal<Order[]>([]);
  selectedCategory = signal<string>('all');
  favorites = signal<number[]>([]);

  // Cart confirmation states
  showConfirmDialog = signal(false);
  pendingFood: Food | null = null;

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

    // Fetch restaurants
    this.orderService.getRestaurants().subscribe({
      next: (data) => {
        this.restaurants.set(data);
        this.loading.set(false);

        // Fetch foods for all restaurants in parallel to populate the popular foods section
        this.allFoods.set([]);
        data.forEach(r => {
          this.orderService.getRestaurantFoods(r.id).subscribe({
            next: (foods) => {
              const current = this.allFoods();
              this.allFoods.set([...current, ...foods]);
              this.updatePopularFoods();
            }
          });
        });
      },
      error: () => this.loading.set(false)
    });
  }

  filteredRestaurants() {
    const query = this.searchQuery.toLowerCase().trim();
    if (!query) return this.restaurants();
    return this.restaurants().filter(r => r.name.toLowerCase().includes(query));
  }

  updatePopularFoods(): void {
    let foods = this.allFoods();
    const query = this.searchQuery.toLowerCase().trim();
    const cat = this.selectedCategory();

    if (cat !== 'all') {
      foods = foods.filter(f => this.getFoodCategoryKey(f) === cat);
    }

    if (query) {
      foods = foods.filter(f => 
        f.name.toLowerCase().includes(query) || 
        f.description?.toLowerCase().includes(query) ||
        (f.category?.name || '').toLowerCase().includes(query)
      );
    }

    this.popularFoods.set(foods.slice(0, 8));
  }

  selectCategory(catId: string): void {
    this.selectedCategory.set(catId);
    this.updatePopularFoods();
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
