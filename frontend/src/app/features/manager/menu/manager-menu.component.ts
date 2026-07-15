import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { FoodService } from '../../../core/services/food.service';
import { OrderService } from '../../../core/services/order.service';
import { Food } from '../../../core/models/food.model';
import { Category } from '../../../core/models/category.model';
import { API_BASE } from '../../../core/config';
import { BodyPortalDirective } from '../../../core/directives/body-portal.directive';

@Component({
  selector: 'app-manager-menu',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MatProgressSpinnerModule, MatSnackBarModule, BodyPortalDirective],
  template: `
    <div class="menu-admin animate-in">
      <div class="page-header">
        <div>
          <h1 class="page-title">🍕 Taomlar Menyusi</h1>
          <p style="color: var(--text-muted); font-size: 0.875rem;">O'z restoraningiz taomlarini qo'shing, tahrirlang yoki o'chiring</p>
        </div>
        <button class="btn btn-primary" (click)="openAddForm()" id="add-food-btn">
          + Taom qo'shish
        </button>
      </div>

      <!-- Filters & Actions -->
      <div class="filters-bar">
        <div class="search-box">
          <span>🔍</span>
          <input [(ngModel)]="searchQ" (input)="onSearch()" type="text" placeholder="Taom qidiring..." class="search-input" id="manager-food-search">
        </div>

        <div class="filter-group">
          <label style="font-size: 0.85rem; color: var(--text-muted);">📁 Kategoriya:</label>
          <select [(ngModel)]="selectedCategoryId" (change)="onFilterChange()" class="form-control filter-select">
            <option [value]="null">Barchasi</option>
            @for (c of categories(); track c.id) {
              <option [value]="c.id">{{ c.name }}</option>
            }
          </select>
        </div>
      </div>

      @if (loading()) {
        <div class="spinner-overlay"><mat-spinner color="warn"></mat-spinner></div>
      }

      <!-- Foods Grid -->
      @if (!loading()) {
        <div class="foods-grid">
          @for (food of foods(); track food.id) {
            <div class="food-card-admin" [id]="'admin-food-' + food.id">
              <img [src]="getFullUrl(food.imageUrl) || fallbackImg" [alt]="food.name"
                   class="food-img" (error)="onImgError($event)">
              <div class="food-body">
                <div class="food-top">
                  <div>
                    <span class="cat-tag">{{ food.category?.name }}</span>
                    <h3 class="food-name">{{ food.name }}</h3>
                    <p class="food-desc">{{ food.description }}</p>
                  </div>
                  <div class="food-status" [class.available]="food.available" [class.unavailable]="!food.available">
                    {{ food.available ? '✅ Mavjud' : '❌ Yoq' }}
                  </div>
                </div>
                <div class="food-footer">
                  <span class="food-price">{{ food.price | number:'1.0-0' }} so'm</span>
                  <div class="food-actions">
                    <button class="icon-btn" (click)="toggleAvail(food)" [title]="food.available ? 'Yopish' : 'Ochish'"
                            [id]="'toggle-' + food.id">
                      {{ food.available ? '🔒' : '🔓' }}
                    </button>
                    <button class="icon-btn edit-btn" (click)="openEditForm(food)"
                            [id]="'edit-food-' + food.id">✏️</button>
                    <button class="icon-btn del-btn" (click)="deleteFood(food.id)"
                            [id]="'delete-food-' + food.id">🗑️</button>
                  </div>
                </div>
              </div>
            </div>
          }
        </div>

        @if (foods().length === 0) {
          <div class="empty-state">
            <div class="icon">🍽️</div>
            <h3>Taomlar topilmadi</h3>
          </div>
        }

        <!-- Pagination -->
        @if (totalElements() > 0) {
          <div class="mat-paginator">
            <div class="mat-paginator-container">
              <div class="mat-paginator-range-label">
                {{ currentPage() * pageSize + 1 }} – {{ Math.min((currentPage() + 1) * pageSize, totalElements()) }} / {{ totalElements() }}
              </div>
              <div class="mat-paginator-navigation">
                <button type="button" class="mat-icon-btn" (click)="goToPage(0)" [disabled]="currentPage() === 0" title="Birinchi sahifa">
                  &#171;
                </button>
                <button type="button" class="mat-icon-btn" (click)="goToPage(currentPage() - 1)" [disabled]="currentPage() === 0" title="Oldingi">
                  &#8249;
                </button>
                @for (p of pageNumbers(); track p) {
                  <button type="button" class="mat-page-btn" [class.active]="p === currentPage() + 1" (click)="goToPage(p - 1)">{{ p }}</button>
                }
                <button type="button" class="mat-icon-btn" (click)="goToPage(currentPage() + 1)" [disabled]="currentPage() >= totalPages() - 1" title="Keyingi">
                  &#8250;
                </button>
                <button type="button" class="mat-icon-btn" (click)="goToPage(totalPages() - 1)" [disabled]="currentPage() >= totalPages() - 1" title="Oxirgi sahifa">
                  &#187;
                </button>
              </div>
              <div class="mat-paginator-page-size">
                <span>Sahifada:</span>
                <select [(ngModel)]="pageSize" (change)="onPageSizeChange()" class="mat-page-select">
                  <option [value]="10">10</option>
                  <option [value]="25">25</option>
                  <option [value]="50">50</option>
                  <option [value]="100">100</option>
                </select>
              </div>
            </div>
          </div>
        }
      }

      <!-- Food Form Modal -->
      @if (showForm()) {
        <div class="modal-overlay" appBodyPortal (click)="closeForm()">
          <div class="modal-card animate-in" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h2>{{ editId() ? '✏️ Taomni tahrirlash' : '+ Yangi taom' }}</h2>
              <button class="close-btn" (click)="closeForm()">✕</button>
            </div>
            <div class="modal-body">
              <form [formGroup]="foodForm" (ngSubmit)="saveFood()">
                <div class="form-group">
                  <label class="form-label">Taom nomi *</label>
                  <input formControlName="name" class="form-control" placeholder="Burger, Pizza..." id="food-form-name">
                </div>
                <div class="form-group">
                  <label class="form-label">Tavsif</label>
                  <textarea formControlName="description" class="form-control" rows="2"
                            placeholder="Taom haqida qisqacha..." id="food-form-desc"></textarea>
                </div>
                <div class="form-row">
                  <div class="form-group">
                    <label class="form-label">Narx (so'm) *</label>
                    <input formControlName="price" type="number" class="form-control"
                           placeholder="45000" id="food-form-price">
                  </div>
                  <div class="form-group">
                    <label class="form-label">Kategoriya *</label>
                    <select formControlName="categoryId" class="form-control" id="food-form-category">
                      <option value="">Tanlang...</option>
                      @for (cat of categories(); track cat.id) {
                        <option [value]="cat.id">{{ cat.name }}</option>
                      }
                    </select>
                  </div>
                </div>

                <div class="form-group">
                  <label class="form-label">Rasm URL</label>
                  <div style="display: flex; gap: 8px;">
                    <input formControlName="imageUrl" class="form-control"
                           placeholder="https://..." id="food-form-image" style="flex: 1;">
                    <label class="btn btn-outline" style="cursor: pointer; display: inline-flex; align-items: center; justify-content: center; font-size: 0.85rem; padding: 0 12px; margin: 0; white-space: nowrap; height: 38px;">
                      📁 Yuklash
                      <input type="file" (change)="onFileUpload($event)" accept="image/*" style="display: none;">
                    </label>
                  </div>
                  @if (uploading()) {
                    <div style="font-size: 0.75rem; color: var(--primary); margin-top: 4px;">Rasm yuklanmoqda...</div>
                  }
                </div>
                <div class="form-check">
                  <input formControlName="available" type="checkbox" id="food-form-available">
                  <label for="food-form-available">Mavjud (sotuvda)</label>
                </div>

                <div class="form-actions">
                  <button type="button" class="btn btn-outline" (click)="closeForm()">Bekor qilish</button>
                  <button type="submit" class="btn btn-primary" [disabled]="saving() || foodForm.invalid">
                    @if (saving()) { <mat-spinner diameter="16" color="accent"></mat-spinner> }
                    {{ editId() ? 'Saqlash' : 'Qo\'shish' }}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .menu-admin { max-width: 1100px; }
    .filters-bar {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
      margin-bottom: 24px;
      align-items: center;
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 16px;
    }
    .search-box {
      display: flex;
      align-items: center;
      gap: 8px;
      background: var(--bg-card2);
      border: 1px solid var(--border);
      border-radius: 30px;
      padding: 6px 16px;
      min-width: 250px;
      flex: 2;
    }
    .search-input {
      background: none; border: none; outline: none;
      color: var(--text); font-family: 'Poppins', sans-serif; font-size: 0.9rem; width: 100%;
    }
    .filter-group {
      display: flex;
      align-items: center;
      gap: 8px;
      flex: 1;
      min-width: 180px;
    }
    .filter-select {
      width: 100%;
      height: 38px;
      padding: 4px 12px;
    }
    .limit-select {
      width: 90px;
      height: 38px;
      padding: 4px 8px;
    }
    .foods-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 16px;
    }
    .food-card-admin {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      overflow: hidden;
      transition: var(--transition);
      display: flex;
      flex-direction: column;
    }
    .food-card-admin:hover { border-color: rgba(249,115,22,0.3); }
    .food-img {
      width: 100%;
      height: 140px;
      object-fit: cover;
    }
    .food-body { padding: 14px; flex: 1; display: flex; flex-direction: column; }
    .food-top {
      display: flex;
      justify-content: space-between;
      gap: 8px;
      flex: 1;
      margin-bottom: 12px;
    }
    .cat-tag {
      display: inline-block;
      font-size: 0.7rem;
      font-weight: 600;
      color: var(--primary);
      background: rgba(249,115,22,0.1);
      border-radius: 8px;
      padding: 2px 8px;
      margin-bottom: 2px;
    }
    .food-name { font-size: 0.9rem; font-weight: 700; margin-bottom: 4px; }
    .food-desc {
      font-size: 0.78rem;
      color: var(--text-muted);
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    .food-status {
      font-size: 0.72rem;
      font-weight: 600;
      padding: 4px 8px;
      border-radius: 8px;
      white-space: nowrap;
      height: fit-content;
    }
    .food-status.available { background: rgba(16,185,129,0.1); color: #10b981; }
    .food-status.unavailable { background: rgba(239,68,68,0.1); color: #ef4444; }
    .food-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .food-price { font-size: 1rem; font-weight: 700; color: var(--primary); }
    .food-actions { display: flex; gap: 6px; }
    .icon-btn {
      background: var(--bg-card2);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 5px 8px;
      cursor: pointer;
      font-size: 0.85rem;
      transition: var(--transition);
    }
    .icon-btn:hover { transform: scale(1.1); }
    .edit-btn:hover { background: rgba(59,130,246,0.1); border-color: #3b82f6; }
    .del-btn:hover { background: rgba(239,68,68,0.1); border-color: #ef4444; }

    .pagination-container {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px;
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      margin-top: 24px;
    }
    .pagination-info { font-size: 0.85rem; color: var(--text-muted); }
    .pagination-buttons { display: flex; gap: 8px; }

    .modal-overlay {
      position: fixed; inset: 0; background: rgba(0,0,0,0.6);
      backdrop-filter: blur(4px); z-index: 9999;
      display: flex; align-items: center; justify-content: center;
      padding: 20px;
    }
    .modal-card {
      background: var(--bg-card); border: 1px solid var(--border);
      border-radius: var(--radius-lg); width: 100%; max-width: 520px;
      display: flex; flex-direction: column; max-height: 90vh; overflow: hidden;
    }
    .modal-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 20px 24px; border-bottom: 1px solid var(--border);
    }
    .modal-header h2 { font-size: 1.1rem; font-weight: 700; }
    .close-btn {
      background: var(--bg-card2); border: 1px solid var(--border);
      border-radius: 8px; padding: 6px 10px; cursor: pointer; transition: var(--transition);
    }
    .close-btn:hover { background: var(--danger); color: white; }
    .modal-body { padding: 24px; overflow-y: auto; flex: 1; }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .field-error { font-size: 0.75rem; color: #ef4444; margin-top: 4px; display: block; }
    .form-check {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 16px;
      font-size: 0.875rem;
      color: var(--text-muted);
      cursor: pointer;
    }
    .form-check input { accent-color: var(--primary); width: 16px; height: 16px; cursor: pointer; }
    .form-actions { display: flex; gap: 10px; margin-top: 16px; }
    .form-actions .btn { flex: 1; justify-content: center; gap: 8px; }
  `]
})
export class ManagerMenuComponent implements OnInit {
  foods = signal<Food[]>([]);
  categories = signal<Category[]>([]);
  loading = signal(true);
  showForm = signal(false);
  editId = signal<number | null>(null);
  saving = signal(false);
  uploading = signal(false);
  fallbackImg = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400';

  // Server-side pagination parameters
  currentPage = signal(0);
  pageSize = 10;
  totalElements = signal(0);
  totalPages = signal(0);
  Math = Math;

  // Filters
  searchQ = '';
  selectedCategoryId: number | null = null;

  foodForm!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private foodService: FoodService,
    private orderService: OrderService,
    private snack: MatSnackBar
  ) {
    this.initForm();
  }

  initForm(): void {
    this.foodForm = this.fb.group({
      name:        ['', Validators.required],
      description: [''],
      price:       [0, [Validators.required, Validators.min(1)]],
      imageUrl:    [''],
      available:   [true],
      categoryId:  ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadRestaurantAndCategories();
    this.load();
  }

  loadRestaurantAndCategories(): void {
    this.orderService.getManagerRestaurant().subscribe({
      next: (rest) => {
        // Load restaurant-specific categories
        this.foodService.getCategories(rest.id).subscribe({
          next: (cats) => this.categories.set(cats)
        });
      },
      error: () => this.showToast('❌ Restoran ma\'lumotlarini yuklab bo\'lmadi', true)
    });
  }

  load(): void {
    this.loading.set(true);
    this.foodService.getFoodsManagerPaginated({
      categoryId: this.selectedCategoryId || undefined,
      search: this.searchQ || undefined,
      page: this.currentPage(),
      size: this.pageSize
    }).subscribe({
      next: (res) => {
        this.foods.set(res.content);
        this.totalElements.set(res.totalElements);
        this.totalPages.set(res.totalPages);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.showToast('❌ Taomlarni yuklab bo\'lmadi', true);
      }
    });
  }

  onFilterChange(): void {
    this.currentPage.set(0);
    this.load();
  }

  onSearch(): void {
    this.currentPage.set(0);
    this.load();
  }

  pageNumbers(): number[] {
    const pages: number[] = [];
    const total = this.totalPages();
    const cur = this.currentPage() + 1;
    let start = Math.max(1, cur - 2);
    let end = Math.min(total, cur + 2);
    if (end - start < 4) {
      if (end === total) {
        start = Math.max(1, end - 4);
      } else {
        end = Math.min(total, start + 4);
      }
    }
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  }

  goToPage(page: number): void {
    if (page < 0 || page >= this.totalPages()) return;
    this.currentPage.set(page);
    this.load();
  }

  onPageSizeChange(): void {
    this.currentPage.set(0);
    this.load();
  }



  openAddForm(): void {
    this.editId.set(null);
    this.foodForm.reset({ available: true, price: 0 });
    this.showForm.set(true);
  }

  openEditForm(food: Food): void {
    this.editId.set(food.id);
    this.foodForm.patchValue({
      name: food.name,
      description: food.description,
      price: food.price,
      imageUrl: food.imageUrl,
      available: food.available,
      categoryId: String(food.category?.id ?? '')
    });
    this.showForm.set(true);
  }

  closeForm(): void { this.showForm.set(false); }

  onFileUpload(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    this.uploading.set(true);

    this.orderService.uploadImage(file).subscribe({
      next: (res) => {
        this.foodForm.patchValue({ imageUrl: res.url });
        this.uploading.set(false);
        this.showToast('✅ Rasm muvaffaqiyatli yuklandi!');
      },
      error: (err) => {
        this.uploading.set(false);
        this.showToast(`❌ Yuklashda xatolik: ${err.error?.message || 'Amal bajarilmadi'}`, true);
      }
    });
  }

  saveFood(): void {
    if (this.foodForm.invalid) { this.foodForm.markAllAsTouched(); return; }
    this.saving.set(true);

    // restaurantId is not sent - backend resolves it automatically
    const { restaurantId: _ignored, ...formValue } = this.foodForm.value as any;
    const data = { ...formValue, categoryId: +this.foodForm.value.categoryId! };
    const req$ = this.editId()
      ? this.orderService.updateManagerFood(this.editId()!, data)
      : this.orderService.createManagerFood(data);

    req$.subscribe({
      next: () => {
        this.saving.set(false);
        this.closeForm();
        this.load();
        this.showToast(this.editId() ? '✨ Taom muvaffaqiyatli yangilandi.' : '✅ Taom menyuga muvaffaqiyatli qo\'shildi.');
      },
      error: (err) => {
        this.saving.set(false);
        this.showToast(`❌ ${err.error?.message || 'Amal bajarilmadi'}`, true);
      }
    });
  }

  deleteFood(id: number): void {
    if (!confirm('Haqiqatan ham o\'chirmoqchimisiz?')) return;
    this.orderService.deleteManagerFood(id).subscribe({
      next: () => {
        this.load();
        this.showToast('🗑️ Taom o\'chirildi');
      },
      error: () => this.showToast('❌ O\'chirib bo\'lmadi', true)
    });
  }

  toggleAvail(food: Food): void {
    this.orderService.toggleManagerFood(food.id).subscribe({
      next: () => {
        this.load();
        this.showToast('🔄 Taom holati yangilandi.');
      },
      error: () => this.showToast('❌ Holatni o\'zgartirib bo\'lmadi', true)
    });
  }

  showToast(message: string, isError = false): void {
    this.snack.open(message, 'Yopish', {
      duration: isError ? 4000 : 3500,
      panelClass: isError ? ['custom-error-toast'] : ['custom-success-toast']
    });
  }

  getFullUrl(url: string | null | undefined): string {
    if (!url) return '';
    if (url.startsWith('/uploads')) {
      return `${API_BASE}${url}`;
    }
    return url;
  }

  onImgError(e: Event): void {
    (e.target as HTMLImageElement).src = this.fallbackImg;
  }
}
