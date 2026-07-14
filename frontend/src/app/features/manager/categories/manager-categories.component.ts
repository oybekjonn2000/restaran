import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { FoodService } from '../../../core/services/food.service';
import { OrderService } from '../../../core/services/order.service';
import { Category } from '../../../core/models/category.model';
import { API_BASE } from '../../../core/config';

@Component({
  selector: 'app-manager-categories',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MatProgressSpinnerModule, MatSnackBarModule],
  template: `
    <div class="categories-manager animate-in">
      <div class="page-header">
        <div>
          <h1 class="page-title">📁 Menyu Toifalari</h1>
          <p style="color: var(--text-muted); font-size: 0.875rem;">O'z restoraningiz taom toifalarini yarating va tahrirlang</p>
        </div>
        <button class="btn btn-primary" (click)="openAddForm()" id="add-cat-btn">
          + Yangi Kategoriya
        </button>
      </div>

      <!-- Filters & Actions -->
      <div class="filters-bar">
        <div class="search-box">
          <span>🔍</span>
          <input [(ngModel)]="searchQ" (input)="onSearch()" type="text" placeholder="Kategoriya qidiring..." class="search-input" id="manager-cat-search">
        </div>
      </div>

      @if (loading()) {
        <div class="spinner-overlay"><mat-spinner color="warn"></mat-spinner></div>
      }

      @if (!loading()) {
        <div class="categories-list-grid">
          @for (c of categories(); track c.id) {
            <div class="category-admin-card" [id]="'cat-card-' + c.id">
              <img [src]="getFullUrl(c.imageUrl) || fallbackImg" [alt]="c.name" class="cat-cover" (error)="onImgError($event)">
              <div class="cat-details">
                <h3 class="cat-name">{{ c.name }}</h3>
                <p class="cat-meta">🏷️ Toifa ID: #{{ c.id }}</p>
                
                <div class="card-actions">
                  <button class="btn btn-outline btn-sm" (click)="openEditForm(c)">✏️ Tahrirlash</button>
                  <button class="btn btn-outline btn-sm btn-danger-outline" (click)="deleteCategory(c.id)">🗑️ O'chirish</button>
                </div>
              </div>
            </div>
          }
        </div>

        @if (categories().length === 0) {
          <div class="empty-state">
            <div class="icon">📁</div>
            <h3>Kategoriyalar topilmadi</h3>
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

      <!-- Category Form Modal -->
      @if (showForm()) {
        <div class="modal-overlay" (click)="closeForm()">
          <div class="modal-card animate-in" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h2>{{ editId() ? '✏️ Kategoriyani tahrirlash' : '+ Yangi Kategoriya' }}</h2>
              <button class="close-btn" (click)="closeForm()">✕</button>
            </div>
            <div class="modal-body">
              <form [formGroup]="catForm" (ngSubmit)="saveCategory()">
                <div class="form-group">
                  <label class="form-label">Kategoriya Nomi *</label>
                  <input formControlName="name" class="form-control" placeholder="Masalan: Milliy taomlar, Burgerlar..." id="cat-form-name">
                  @if (catForm.get('name')?.invalid && catForm.get('name')?.touched) {
                    <span class="field-error">Nomi kiritilishi shart</span>
                  }
                </div>

                <div class="form-group">
                  <label class="form-label">Rasm URL</label>
                  <div style="display: flex; gap: 8px;">
                    <input formControlName="imageUrl" class="form-control" placeholder="https://..." id="cat-form-image" style="flex: 1;">
                    <label class="btn btn-outline" style="cursor: pointer; display: inline-flex; align-items: center; justify-content: center; font-size: 0.85rem; padding: 0 12px; margin: 0; white-space: nowrap; height: 38px;">
                      📁 Yuklash
                      <input type="file" (change)="onFileUpload($event)" accept="image/*" style="display: none;">
                    </label>
                  </div>
                  @if (uploading()) {
                    <div style="font-size: 0.75rem; color: var(--primary); margin-top: 4px;">Rasm yuklanmoqda...</div>
                  }
                </div>

                <div class="form-actions">
                  <button type="button" class="btn btn-outline" (click)="closeForm()">Bekor qilish</button>
                  <button type="submit" class="btn btn-primary" [disabled]="saving() || catForm.invalid">
                    @if (saving()) { <mat-spinner diameter="16" color="accent"></mat-spinner> }
                    {{ editId() ? 'Saqlash' : 'Qoshish' }}
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
    .categories-manager { max-width: 1000px; }
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
      flex: 1;
    }
    .search-input {
      background: none; border: none; outline: none;
      color: var(--text); font-size: 0.9rem; width: 100%;
    }
    .categories-list-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 20px;
      margin-bottom: 24px;
    }
    .category-admin-card {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      overflow: hidden;
      transition: var(--transition);
      display: flex;
      flex-direction: column;
    }
    .category-admin-card:hover { border-color: rgba(249,115,22,0.3); }
    .cat-cover {
      width: 100%;
      height: 140px;
      object-fit: cover;
    }
    .cat-details {
      padding: 16px;
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    .cat-name { font-size: 1.05rem; font-weight: 700; margin-bottom: 6px; }
    .cat-meta { font-size: 0.8rem; color: var(--text-muted); margin-bottom: 12px; }
    .card-actions {
      display: flex;
      gap: 8px;
      margin-top: auto;
    }
    .card-actions .btn { flex: 1; justify-content: center; }

    .modal-overlay {
      position: fixed; inset: 0; background: rgba(0,0,0,0.6);
      backdrop-filter: blur(4px); z-index: 300;
      display: flex; align-items: flex-start; justify-content: center;
      padding: 30px 20px; overflow-y: auto;
    }
    .modal-card {
      background: var(--bg-card); border: 1px solid var(--border);
      border-radius: var(--radius-lg); width: 100%; max-width: 480px; max-height: 90vh; overflow-y: auto;
    }
    .modal-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 18px 24px; border-bottom: 1px solid var(--border);
    }
    .modal-header h2 { font-size: 1.1rem; font-weight: 700; }
    .close-btn {
      background: var(--bg-card2); border: 1px solid var(--border);
      border-radius: 8px; padding: 6px 10px; cursor: pointer; transition: var(--transition);
    }
    .close-btn:hover { background: var(--danger); color: white; }
    .modal-body { padding: 24px; }
    .field-error { font-size: 0.75rem; color: #ef4444; margin-top: 4px; display: block; }
    .form-actions { display: flex; gap: 10px; margin-top: 20px; }
    .form-actions .btn { flex: 1; justify-content: center; }
  `]
})
export class ManagerCategoriesComponent implements OnInit {
  categories = signal<Category[]>([]);
  loading = signal(true);
  showForm = signal(false);
  editId = signal<number | null>(null);
  saving = signal(false);
  uploading = signal(false);
  fallbackImg = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400';

  // Pagination parameters
  currentPage = signal(0);
  pageSize = 10;
  totalElements = signal(0);
  totalPages = signal(0);
  Math = Math;

  // Filters
  searchQ = '';

  catForm!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private foodService: FoodService,
    private orderService: OrderService,
    private snack: MatSnackBar
  ) {
    this.initForm();
  }

  initForm(): void {
    this.catForm = this.fb.group({
      name: ['', Validators.required],
      imageUrl: ['']
    });
  }

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.foodService.getCategoriesManagerPaginated({
      search: this.searchQ || undefined,
      page: this.currentPage(),
      size: this.pageSize
    }).subscribe({
      next: (res) => {
        this.categories.set(res.content);
        this.totalElements.set(res.totalElements);
        this.totalPages.set(res.totalPages);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.showToast('❌ Kategoriyalarni yuklab bo\'lmadi', true);
      }
    });
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
    this.catForm.reset();
    this.showForm.set(true);
  }

  openEditForm(cat: Category): void {
    this.editId.set(cat.id);
    this.catForm.patchValue({
      name: cat.name,
      imageUrl: cat.imageUrl
    });
    this.showForm.set(true);
  }

  closeForm(): void {
    this.showForm.set(false);
  }

  getFullUrl(url: string | null | undefined): string {
    if (!url) return '';
    if (url.startsWith('/uploads')) {
      return `${API_BASE}${url}`;
    }
    return url;
  }

  onFileUpload(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    this.uploading.set(true);

    this.orderService.uploadImage(file).subscribe({
      next: (res) => {
        this.catForm.patchValue({ imageUrl: res.url });
        this.uploading.set(false);
        this.showToast('✅ Rasm muvaffaqiyatli yuklandi!');
      },
      error: (err) => {
        this.uploading.set(false);
        this.showToast(`❌ Yuklashda xatolik: ${err.error?.message || 'Amal bajarilmadi'}`, true);
      }
    });
  }

  saveCategory(): void {
    if (this.catForm.invalid) {
      this.catForm.markAllAsTouched();
      return;
    }
    this.saving.set(true);

    const payload = {
      name: this.catForm.value.name,
      imageUrl: this.catForm.value.imageUrl
    };

    const req$ = this.editId()
      ? this.foodService.updateCategoryManager(this.editId()!, payload)
      : this.foodService.createCategoryManager(payload);

    req$.subscribe({
      next: () => {
        this.saving.set(false);
        this.closeForm();
        this.load();
        this.showToast(this.editId() ? '✨ Kategoriya yangilandi.' : '✅ Kategoriya muvaffaqiyatli yaratildi.');
      },
      error: (err) => {
        this.saving.set(false);
        this.showToast(`❌ ${err.error?.message || 'Amal bajarilmadi'}`, true);
      }
    });
  }

  deleteCategory(id: number): void {
    if (!confirm('Haqiqatan ham ushbu kategoriyani o\'chirmoqchimisiz?')) return;
    this.foodService.deleteCategoryManager(id).subscribe({
      next: () => {
        this.load();
        this.showToast('🗑️ Kategoriya o\'chirildi');
      },
      error: () => this.showToast('❌ O\'chirib bo\'lmadi (Kategoriya taomlarga bog\'langan bo\'lishi mumkin)', true)
    });
  }

  showToast(message: string, isError = false): void {
    this.snack.open(message, 'Yopish', {
      duration: isError ? 4000 : 3500,
      panelClass: isError ? ['custom-error-toast'] : ['custom-success-toast']
    });
  }

  onImgError(e: Event): void {
    (e.target as HTMLImageElement).src = this.fallbackImg;
  }
}
