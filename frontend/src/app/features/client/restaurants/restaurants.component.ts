import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { OrderService } from '../../../core/services/order.service';
import { Restaurant } from '../../../core/models/restaurant.model';

@Component({
  selector: 'app-restaurants',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, MatProgressSpinnerModule],
  template: `
    <div class="restaurants-page animate-in">
      <div class="hero-section">
        <h1 class="hero-title">Karshi taomlarini yetkazib berish 🍽️</h1>
        <p class="hero-subtitle">Siz yoqtirgan restoranlardan eng sara va lazzatli taomlar uyingizgacha</p>
        
        <div class="search-bar">
          <span class="search-icon">🔍</span>
          <input 
            type="text" 
            [(ngModel)]="searchQuery" 
            placeholder="Restoran nomi bo'yicha qidirish..." 
            class="search-input">
        </div>
      </div>

      @if (loading()) {
        <div class="spinner-overlay">
          <mat-spinner color="warn"></mat-spinner>
        </div>
      }

      @if (!loading()) {
        <h2 class="section-title">🏪 Bizning Restoranlar</h2>
        
        <div class="restaurants-grid">
          @for (r of filteredRestaurants(); track r.id) {
            <div class="restaurant-card" [routerLink]="['/client/menu', r.id]">
              <div class="card-image-wrap">
                <img 
                  [src]="r.imageUrl || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=500'" 
                  [alt]="r.name" 
                  class="card-image"
                  (error)="onImgError($event)">
                <div class="badge-tag">⭐ 4.8</div>
              </div>
              <div class="card-content">
                <h3 class="restaurant-name">{{ r.name }}</h3>
                <p class="restaurant-address">📍 {{ r.address || 'Karshi shahar' }}</p>
                <div class="card-footer">
                  <span class="delivery-time">⏰ 20-35 daqiqa</span>
                  <span class="view-menu-btn">Menyu ➡️</span>
                </div>
              </div>
            </div>
          }
        </div>

        @if (filteredRestaurants().length === 0) {
          <div class="empty-state">
            <div class="icon">🏪</div>
            <h3>Qidiruv bo'yicha restoran topilmadi</h3>
            <p>Iltimos, boshqa kalit so'z kiritib ko'ring.</p>
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .restaurants-page { max-width: 1200px; margin: 0 auto; padding-bottom: 40px; }

    .hero-section {
      text-align: center;
      padding: 40px 20px;
      background: linear-gradient(135deg, rgba(30, 41, 59, 0.8), rgba(15, 23, 42, 0.9)), 
                  url('https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1200') no-repeat center/cover;
      border-radius: var(--radius-lg);
      border: 1px solid var(--border);
      margin-bottom: 32px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
    }

    .hero-title { font-size: 2.2rem; font-weight: 800; color: var(--text); }
    .hero-subtitle { color: var(--text-muted); font-size: 1rem; max-width: 600px; margin-bottom: 8px; }

    .search-bar {
      display: flex;
      align-items: center;
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: 30px;
      padding: 6px 16px;
      width: 100%;
      max-width: 480px;
      transition: var(--transition);
    }
    .search-bar:focus-within {
      border-color: var(--primary);
      box-shadow: 0 0 10px rgba(249,115,22,0.15);
    }

    .search-icon { font-size: 1.1rem; margin-right: 8px; color: var(--text-muted); }
    .search-input {
      border: none;
      background: none;
      color: var(--text);
      outline: none;
      width: 100%;
      font-size: 0.95rem;
    }

    .section-title { font-size: 1.4rem; font-weight: 700; margin-bottom: 20px; color: var(--text); }

    .restaurants-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 24px;
    }

    .restaurant-card {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      overflow: hidden;
      cursor: pointer;
      transition: var(--transition);
      display: flex;
      flex-direction: column;
    }
    .restaurant-card:hover {
      transform: translateY(-4px);
      border-color: rgba(249,115,22,0.25);
      box-shadow: var(--shadow-lg);
    }

    .card-image-wrap { position: relative; height: 160px; overflow: hidden; }
    .card-image { width: 100%; height: 100%; object-fit: cover; transition: transform 0.3s ease; }
    .restaurant-card:hover .card-image { transform: scale(1.05); }

    .badge-tag {
      position: absolute;
      top: 12px;
      right: 12px;
      background: rgba(15,23,42,0.85);
      backdrop-filter: blur(4px);
      color: #fbbf24;
      font-size: 0.75rem;
      font-weight: 700;
      padding: 4px 8px;
      border-radius: 12px;
      border: 1px solid rgba(251,191,36,0.3);
    }

    .card-content { padding: 16px; display: flex; flex-direction: column; gap: 8px; flex: 1; }
    .restaurant-name { font-size: 1.1rem; font-weight: 700; color: var(--text); }
    .restaurant-address { font-size: 0.8rem; color: var(--text-muted); }

    .card-footer {
      margin-top: auto;
      padding-top: 12px;
      border-top: 1px solid rgba(255,255,255,0.05);
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.82rem;
    }
    .delivery-time { color: var(--text-muted); }
    .view-menu-btn { color: var(--primary); font-weight: 600; }
  `]
})
export class RestaurantsComponent implements OnInit {
  restaurants = signal<Restaurant[]>([]);
  loading = signal(true);
  searchQuery = '';

  constructor(private orderService: OrderService) {}

  ngOnInit(): void {
    this.orderService.getRestaurants().subscribe({
      next: (data) => {
        this.restaurants.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  filteredRestaurants() {
    const query = this.searchQuery.toLowerCase().trim();
    if (!query) return this.restaurants();
    return this.restaurants().filter(r => r.name.toLowerCase().includes(query));
  }

  onImgError(e: Event): void {
    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=500';
  }
}
