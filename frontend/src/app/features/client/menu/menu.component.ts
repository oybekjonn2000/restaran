import { Component, OnInit, OnDestroy, HostListener, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { FoodService } from '../../../core/services/food.service';
import { OrderService } from '../../../core/services/order.service';
import { CartService } from '../../../core/services/cart.service';
import { Category } from '../../../core/models/category.model';
import { Food } from '../../../core/models/food.model';
import { Restaurant } from '../../../core/models/restaurant.model';
import { API_BASE } from '../../../core/config';

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MatProgressSpinnerModule, MatSnackBarModule],
  template: `
    <div class="menu-page animate-in">
      @if (!hideBackButton()) {
        <div style="margin-bottom: 12px;">
          <a routerLink="/client/restaurants" class="back-link">⬅️ Restoranlarga qaytish</a>
        </div>
      }

      <!-- Header -->
      <div class="menu-header">
        <div>
          <h1 class="page-title">🏪 {{ restaurant()?.name || 'Bizning Menyu' }}</h1>
          <p class="subtitle">📍 {{ restaurant()?.address || 'Mazali taomlar ro\\'yxati' }}</p>
        </div>
        <!-- Search -->
        <div class="search-box">
          <span class="search-icon">🔍</span>
          <input
            [(ngModel)]="searchQuery"
            (input)="onSearch()"
            type="text"
            placeholder="Taom qidiring..."
            class="search-input"
            id="food-search">
        </div>
      </div>

      <!-- Categories -->
      <div class="categories-scroll">
        <button
          class="cat-btn"
          [class.active]="selectedCatId === null"
          (click)="selectCategory(null)"
          id="cat-all">
          🌟 Barchasi
        </button>
        @for (cat of categories(); track cat.id) {
          <button
            class="cat-btn"
            [class.active]="selectedCatId === cat.id"
            (click)="selectCategory(cat.id)"
            [id]="'cat-' + cat.id">
            {{ cat.name }}
          </button>
        }
      </div>

      <!-- Loading -->
      @if (loading()) {
        <div class="spinner-overlay">
          <mat-spinner color="warn"></mat-spinner>
        </div>
      }

      <!-- Foods Grid -->
      @if (!loading()) {
        @if (displayedFoods().length > 0) {
          <div class="foods-grid">
            @for (food of displayedFoods(); track food.id; let i = $index) {
              <div class="food-card" [style.animation-delay]="(i * 0.05) + 's'"
                   [id]="'food-card-' + food.id">
                <img [src]="getFullUrl(food.imageUrl) || fallbackImg" [alt]="food.name"
                     class="food-card-img" loading="lazy"
                     (error)="onImgError($event)">
                <div class="food-card-body">
                  <div class="food-category-tag">{{ food.category?.name }}</div>
                  <h3 class="food-card-name">{{ food.name }}</h3>
                  <p class="food-card-desc">{{ food.description }}</p>
                  <div class="food-card-footer">
                    <span class="food-price">{{ food.price | number:'1.0-0' }} so'm</span>
                    <button
                      class="add-btn"
                      (click)="addToCart(food)"
                      [id]="'add-' + food.id">
                      <span class="plus-icon">+</span>
                      Qo'sh
                    </button>
                  </div>
                </div>
              </div>
            }
          </div>
        } @else {
          <div class="empty-state">
            <div class="icon">🍽️</div>
            <h3>Taom topilmadi</h3>
            <p>Boshqa kategoriya yoki qidiruv so'zini sinab ko'ring</p>
          </div>
        }
      }

      <!-- Clear Cart Confirmation Modal -->
      @if (showConfirmDialog()) {
        <div class="modal-backdrop" (click)="closeConfirm()">
          <div class="modal-card" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h2>⚠️ Savatni tozalash</h2>
              <button class="modal-close" (click)="closeConfirm()">✕</button>
            </div>
            <div class="modal-body" style="padding: 20px;">
              <p style="color: var(--text); font-size: 0.95rem; line-height: 1.6;">
                Sizning savatingizda boshqa restoranning taomlari bor. Yangi restorandan buyurtma berish uchun savatni tozalash zarur.
              </p>
              <p style="color: var(--primary); font-weight: 700; margin-top: 10px; font-size: 0.9rem;">
                Hozirgi savat tozalanib, ushbu taom qo'shilsinmi?
              </p>
            </div>
            <div class="modal-footer" style="padding: 16px 20px; border-top: 1px solid var(--border); display: flex; justify-content: flex-end; gap: 10px;">
              <button class="btn btn-outline" (click)="closeConfirm()">Bekor qilish</button>
              <button class="btn btn-primary" (click)="confirmClearAndAdd()">Savatni tozalash</button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .menu-page { max-width: 1200px; margin: 0 auto; }

    .back-link {
      color: var(--primary);
      text-decoration: none;
      font-size: 0.85rem;
      font-weight: 600;
      transition: var(--transition);
    }
    .back-link:hover { text-decoration: underline; }

    .menu-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 16px;
      margin-bottom: 24px;
      flex-wrap: wrap;
    }

    .subtitle {
      color: var(--text-muted);
      font-size: 0.9rem;
      margin-top: 4px;
    }

    .search-box {
      display: flex;
      align-items: center;
      gap: 8px;
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: 30px;
      padding: 10px 20px;
      min-width: 280px;
    }
    .search-icon { font-size: 1rem; }
    .search-input {
      background: none;
      border: none;
      outline: none;
      color: var(--text);
      font-family: 'Poppins', sans-serif;
      font-size: 0.9rem;
      width: 100%;
    }
    .search-input::placeholder { color: var(--text-muted); }

    .categories-scroll {
      display: flex;
      gap: 8px;
      overflow-x: auto;
      padding-bottom: 12px;
      margin-bottom: 24px;
      scrollbar-width: thin;
    }

    .cat-btn {
      padding: 8px 20px;
      border-radius: 20px;
      border: 1px solid var(--border);
      background: var(--bg-card);
      color: var(--text-muted);
      font-family: 'Poppins', sans-serif;
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      white-space: nowrap;
      transition: var(--transition);
    }
    .cat-btn:hover, .cat-btn.active {
      background: var(--primary);
      border-color: var(--primary);
      color: white;
      transform: translateY(-1px);
    }

    .foods-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
      gap: 20px;
    }

    .food-card {
      background: var(--bg-card);
      border-radius: var(--radius-lg);
      border: 1px solid var(--border);
      overflow: hidden;
      transition: var(--transition);
      animation: fadeInUp 0.4s ease both;
    }
    .food-card:hover {
      transform: translateY(-6px);
      box-shadow: 0 16px 48px rgba(249,115,22,0.2);
      border-color: rgba(249,115,22,0.4);
    }

    .food-card-img {
      width: 100%;
      height: 180px;
      object-fit: cover;
      display: block;
      background: var(--bg-card2);
    }

    .food-card-body { padding: 16px; }

    .food-category-tag {
      display: inline-block;
      background: rgba(249,115,22,0.1);
      color: var(--primary);
      font-size: 0.7rem;
      font-weight: 600;
      padding: 2px 10px;
      border-radius: 10px;
      margin-bottom: 8px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .food-card-name {
      font-size: 1rem;
      font-weight: 700;
      margin-bottom: 6px;
      color: var(--text);
    }

    .food-card-desc {
      font-size: 0.8rem;
      color: var(--text-muted);
      line-height: 1.5;
      margin-bottom: 14px;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .food-card-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .food-price {
      font-size: 1.05rem;
      font-weight: 700;
      color: var(--primary);
    }

    .add-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 8px 16px;
      background: linear-gradient(135deg, var(--primary), var(--primary-dark));
      color: white;
      border: none;
      border-radius: 20px;
      font-size: 0.85rem;
      font-weight: 600;
      cursor: pointer;
      font-family: 'Poppins', sans-serif;
      transition: var(--transition);
    }
    .add-btn:hover {
      transform: scale(1.05);
      box-shadow: 0 4px 16px rgba(249,115,22,0.4);
    }

    .plus-icon {
      font-size: 1.1rem;
      font-weight: 800;
    }

    /* Modal styles */
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.75);
      backdrop-filter: blur(5px);
      z-index: 9999;
      animation: modalFadeIn 0.25s ease forwards;
    }

    .modal-card {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      width: 90%;
      max-width: 460px;
      box-shadow: var(--shadow-lg);
      overflow: hidden;
      display: flex;
      flex-direction: column;
      z-index: 10000;
      animation: modalScaleUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
    }

    .modal-header {
      padding: 16px 20px;
      border-bottom: 1px solid var(--border);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .modal-header h2 { font-size: 1.15rem; font-weight: 700; color: var(--text); margin: 0; }
    .modal-close { background: none; border: none; font-size: 1.25rem; color: var(--text-muted); cursor: pointer; }
    .modal-close:hover { color: var(--danger); }

    @keyframes modalFadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes modalScaleUp {
      from {
        opacity: 0;
        transform: translate(-50%, -48%) scale(0.96);
      }
      to {
        opacity: 1;
        transform: translate(-50%, -50%) scale(1);
      }
    }

    @media (max-width: 640px) {
      .menu-header { flex-direction: column; }
      .search-box { min-width: auto; width: 100%; }
      .foods-grid { grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); }
      .food-card-img { height: 140px; }
    }
  `]
})
export class MenuComponent implements OnInit, OnDestroy {
  restaurant = signal<Restaurant | null>(null);
  categories = signal<Category[]>([]);
  allFoods = signal<Food[]>([]);
  displayedFoods = signal<Food[]>([]);
  loading = signal(true);
  selectedCatId: number | null = null;
  searchQuery = '';
  fallbackImg = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80';

  // Cart confirmation modal states
  showConfirmDialog = signal(false);
  pendingFood: Food | null = null;

  restaurantId!: number;
  hideBackButton = signal(false);

  constructor(
    private foodService: FoodService,
    private orderService: OrderService,
    private cart: CartService,
    private snack: MatSnackBar,
    private route: ActivatedRoute
  ) {
    this.restaurantId = Number(this.route.snapshot.params['restaurantId']);
  }

  ngOnDestroy(): void {
    document.body.style.overflow = '';
  }

  @HostListener('document:keydown', ['$event'])
  handleKeyDown(event: KeyboardEvent): void {
    if (!this.showConfirmDialog()) return;

    if (event.key === 'Escape') {
      this.closeConfirm();
      event.preventDefault();
    }

    if (event.key === 'Tab') {
      const modalElement = document.querySelector('.modal-card');
      if (!modalElement) return;

      const focusables = modalElement.querySelectorAll('button, [tabindex="0"]');
      if (focusables.length === 0) return;

      const first = focusables[0] as HTMLElement;
      const last = focusables[focusables.length - 1] as HTMLElement;

      if (event.shiftKey) {
        if (document.activeElement === first) {
          last.focus();
          event.preventDefault();
        }
      } else {
        if (document.activeElement === last) {
          first.focus();
          event.preventDefault();
        }
      }
    }
  }

  getFullUrl(url: string | null | undefined): string {
    if (!url) return '';
    if (url.startsWith('/uploads')) {
      return `${API_BASE}${url}`;
    }
    return url;
  }

  ngOnInit(): void {
    window.scrollTo(0, 0);
    // Check if we have only 1 active restaurant to hide back button
    this.orderService.getRestaurants().subscribe({
      next: (rests) => {
        if (rests.length === 1) {
          this.hideBackButton.set(true);
        }
      }
    });

    // Load restaurant details
    this.orderService.getRestaurantById(this.restaurantId).subscribe({
      next: (data) => this.restaurant.set(data),
      error: (err) => console.error('Error loading restaurant profile:', err)
    });

    this.foodService.getCategories(this.restaurantId).subscribe(cats => this.categories.set(cats));
    this.loadFoods();
  }

  loadFoods(): void {
    this.loading.set(true);
    this.orderService.getRestaurantFoods(this.restaurantId).subscribe({
      next: (foods) => {
        this.allFoods.set(foods);
        this.displayedFoods.set(foods);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  selectCategory(catId: number | null): void {
    this.selectedCatId = catId;
    this.searchQuery = '';
    this.loading.set(true);
    
    this.orderService.getRestaurantFoods(this.restaurantId, catId || undefined).subscribe({
      next: (foods) => {
        this.displayedFoods.set(foods);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  onSearch(): void {
    const q = this.searchQuery.trim().toLowerCase();
    if (!q) {
      this.displayedFoods.set(this.allFoods());
    } else {
      this.displayedFoods.set(
        this.allFoods().filter(f =>
          f.name.toLowerCase().includes(q) ||
          f.description?.toLowerCase().includes(q)
        )
      );
    }
  }

  addToCart(food: Food): void {
    if (!this.cart.canAdd(food)) {
      this.pendingFood = food;
      this.showConfirmDialog.set(true);
      document.body.style.overflow = 'hidden';
      setTimeout(() => {
        const firstBtn = document.querySelector('.modal-card .btn-outline') as HTMLElement;
        if (firstBtn) firstBtn.focus();
      });
      return;
    }

    this.cart.addItem(food);
    this.snack.open(`✅ ${food.name} savatga qo'shildi!`, '', {
      duration: 2000,
      panelClass: ['success-snack'],
      horizontalPosition: 'right',
      verticalPosition: 'bottom'
    });
  }

  closeConfirm(): void {
    this.showConfirmDialog.set(false);
    this.pendingFood = null;
    document.body.style.overflow = '';
  }

  confirmClearAndAdd(): void {
    if (this.pendingFood) {
      this.cart.clear();
      this.cart.addItem(this.pendingFood);
      this.snack.open(`🧹 Oldingi savat tozalandi. ✅ ${this.pendingFood.name} qo'shildi!`, '', {
        duration: 3000,
        panelClass: ['success-snack'],
        horizontalPosition: 'right',
        verticalPosition: 'bottom'
      });
      this.closeConfirm();
    }
  }

  onImgError(e: Event): void {
    (e.target as HTMLImageElement).src = this.fallbackImg;
  }
}
