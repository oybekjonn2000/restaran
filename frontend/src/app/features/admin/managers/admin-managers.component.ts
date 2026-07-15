import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { OrderService } from '../../../core/services/order.service';
import { ManagerStats } from '../../../core/models/user.model';
import { Restaurant } from '../../../core/models/restaurant.model';
import { BodyPortalDirective } from '../../../core/directives/body-portal.directive';

@Component({
  selector: 'app-admin-managers',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MatProgressSpinnerModule, MatSnackBarModule, BodyPortalDirective],
  template: `
    <div class="managers-admin animate-in">
      <div class="page-header">
        <div class="header-left">
          <div class="title-wrap">
            <span class="material-icons title-icon">people</span>
            <h1 class="page-title">Menejerlar Boshqaruvi</h1>
          </div>
          <p class="page-subtitle">Restoran menejerlari hisoblarini yaratish, tahrirlash va ularning restoran ko'rsatkichlarini nazorat qilish</p>
        </div>
        <button class="btn-add-manager" (click)="openAddForm()" id="add-manager-btn">
          <span class="material-icons">person_add</span>
          Yangi Menejer
        </button>
      </div>

      <!-- Search -->
      <div class="search-bar-container">
        <span class="material-icons search-icon">search</span>
        <input [(ngModel)]="searchQ" type="text" placeholder="Ism yoki email qidiring..." class="search-input" id="manager-search">
      </div>

      @if (loading()) {
        <div class="spinner-overlay"><mat-spinner color="warn"></mat-spinner></div>
      }

      @if (!loading()) {
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>Menejer</th>
                <th>Aloqa</th>
                <th>Biriktirilgan Restoranlar</th>
                <th>Buyurtmalar</th>
                <th>Amallar</th>
              </tr>
            </thead>
            <tbody>
              @for (m of filteredManagers; track m.id) {
                <tr [id]="'manager-row-' + m.id">
                  <td data-label="Menejer" class="td-manager-name">
                    <span class="manager-avatar-initial">{{ m.name[0].toUpperCase() }}</span>
                    <strong>{{ m.name }}</strong>
                  </td>
                  <td data-label="Aloqa">
                    <div class="contact-info">
                      <span class="contact-item"><span class="material-icons contact-icon">email</span>{{ m.email }}</span>
                      <span class="contact-item phone-text"><span class="material-icons contact-icon">phone</span>{{ m.phone || 'Kiritilmagan' }}</span>
                    </div>
                  </td>
                  <td data-label="Restoranlar">
                    <span [class]="(m.restaurantIds && m.restaurantIds.length > 0) ? 'rest-badge active' : 'rest-badge unlinked'">
                      <span class="material-icons badge-icon">{{ (m.restaurantIds && m.restaurantIds.length > 0) ? 'storefront' : 'link_off' }}</span>
                      {{ m.restaurantName || 'Biriktirilmagan' }}
                    </span>
                  </td>
                  <td data-label="Buyurtmalar">
                    <span class="count-badge">
                      <span class="material-icons badge-icon">shopping_bag</span>
                      {{ m.restaurantOrdersCount }} ta
                    </span>
                  </td>
                  <td data-label="Amallar">
                    <div class="action-btns">
                      <button class="btn-edit" (click)="openEditForm(m)"><span class="material-icons">edit</span>Tahrirlash</button>
                      <button class="btn-delete" (click)="deleteManager(m)"><span class="material-icons">delete</span></button>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        @if (filteredManagers.length === 0) {
          <div class="empty-state">
            <span class="material-icons empty-icon">person_off</span>
            <h3>Qidiruv bo'yicha menejer topilmadi</h3>
          </div>
        }
      }

      <!-- Manager Form Modal -->
      @if (showForm()) {
        <div class="modal-overlay" appBodyPortal (click)="closeForm()">
          <div class="modal-card animate-in" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h2>
                <span class="material-icons header-modal-icon">{{ editId() ? 'edit' : 'person_add' }}</span>
                {{ editId() ? 'Menejer tahrirlash' : 'Yangi Menejer' }}
              </h2>
              <button class="close-btn" (click)="closeForm()">✕</button>
            </div>
            <div class="modal-body">
              <form [formGroup]="managerForm" (ngSubmit)="saveManager()">
                <div class="form-group">
                  <label class="form-label">To'liq Ism *</label>
                  <div class="input-with-icon">
                    <span class="material-icons input-field-icon">person</span>
                    <input formControlName="name" class="form-control" placeholder="Ism familiya..." id="manager-form-name">
                  </div>
                </div>

                <div class="form-group">
                  <label class="form-label">Email *</label>
                  <div class="input-with-icon">
                    <span class="material-icons input-field-icon">email</span>
                    <input formControlName="email" type="email" class="form-control" placeholder="manager@food.uz" id="manager-form-email">
                  </div>
                </div>

                @if (!editId()) {
                  <div class="form-group">
                    <label class="form-label">Parol *</label>
                    <div class="input-with-icon">
                      <span class="material-icons input-field-icon">lock</span>
                      <input formControlName="password" type="password" class="form-control" placeholder="Kamida 6 belgi" id="manager-form-password">
                    </div>
                  </div>
                }

                <div class="form-group">
                  <label class="form-label">Telefon raqami</label>
                  <div class="input-with-icon">
                    <span class="material-icons input-field-icon">phone</span>
                    <input formControlName="phone" class="form-control" placeholder="+998901234567" id="manager-form-phone">
                  </div>
                </div>

                <div class="form-group">
                  <label class="form-label">Biriktirilgan Restoranlar</label>
                  <div class="restaurant-picker">
                    <div class="picker-search">
                      <span class="material-icons search-picker-icon">search</span>
                      <input type="text" [(ngModel)]="restSearch" [ngModelOptions]="{standalone: true}" placeholder="Restoran nomi bo'yicha qidirish..." class="picker-search-input">
                    </div>
                    
                    <div class="picker-list scrollbar-custom">
                      @for (r of filteredRestaurants; track r.id) {
                        <label class="picker-item" [class.selected]="isRestaurantSelected(r.id)">
                          <input type="checkbox" [checked]="isRestaurantSelected(r.id)" (change)="toggleRestaurantSelection(r.id)" class="picker-checkbox">
                          <span class="picker-name">{{ r.name }}</span>
                          <span class="picker-address">{{ r.address }}</span>
                        </label>
                      }
                      @if (filteredRestaurants.length === 0) {
                        <div class="picker-empty">Restoran topilmadi</div>
                      }
                    </div>
                  </div>
                </div>

                <div class="form-actions">
                  <button type="button" class="btn-modal-cancel" (click)="closeForm()">Bekor qilish</button>
                  <button type="submit" class="btn-modal-save" [disabled]="saving() || managerForm.invalid">
                    @if (saving()) { <mat-spinner diameter="16" color="accent"></mat-spinner> }
                    {{ editId() ? 'Saqlash' : 'Yaratish' }}
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
    .managers-admin {
      max-width: 1100px;
      margin: 0 auto;
      padding: 8px;
    }

    /* Page Header */
    .page-header {
      padding: 12px 0 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 16px;
    }
    .title-wrap {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 6px;
    }
    .title-icon {
      font-size: 2.2rem;
      background: linear-gradient(135deg, #a78bfa, #f97316);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .page-title {
      font-size: 1.85rem;
      font-weight: 800;
      color: #fff;
      margin: 0;
      letter-spacing: -0.02em;
    }
    .page-subtitle {
      color: var(--text-muted);
      font-size: 0.9rem;
      margin: 0;
    }

    /* Add Manager Button */
    .btn-add-manager {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: linear-gradient(135deg, var(--primary), var(--primary-dark));
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 14px;
      font-weight: 600;
      cursor: pointer;
      box-shadow: 0 4px 14px rgba(249, 115, 22, 0.35);
      transition: all 0.25s ease;
      font-family: inherit;
    }
    .btn-add-manager:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(249, 115, 22, 0.45);
    }
    .btn-add-manager:active {
      transform: translateY(0);
    }

    /* Search Bar */
    .search-bar-container {
      display: flex;
      align-items: center;
      gap: 10px;
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 30px;
      padding: 10px 18px;
      max-width: 360px;
      margin-bottom: 24px;
      transition: all 0.25s ease;
    }
    .search-bar-container:focus-within {
      border-color: var(--primary);
      box-shadow: 0 0 0 3px rgba(249, 115, 22, 0.15);
      background: rgba(255, 255, 255, 0.06);
    }
    .search-icon {
      color: var(--text-muted);
      font-size: 1.3rem;
    }
    .search-input {
      background: none;
      border: none;
      outline: none;
      color: var(--text);
      font-size: 0.9rem;
      width: 100%;
      font-family: inherit;
    }

    /* Table Styling */
    .table-wrap {
      background: rgba(30, 41, 59, 0.7);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: var(--radius-lg);
      overflow: hidden;
      box-shadow: var(--shadow-lg);
    }
    .data-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
    }
    .data-table th {
      background: rgba(255, 255, 255, 0.02);
      padding: 16px 20px;
      font-size: 0.75rem;
      font-weight: 700;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.8px;
      border-bottom: 1.5px solid rgba(255, 255, 255, 0.08);
    }
    .data-table td {
      padding: 16px 20px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      vertical-align: middle;
    }
    .data-table tbody tr {
      transition: all 0.2s ease;
    }
    .data-table tbody tr:hover {
      background: rgba(255, 255, 255, 0.02);
    }
    .data-table tbody tr:last-child td {
      border-bottom: none;
    }

    /* Manager Initial Avatar */
    .td-manager-name {
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 0.95rem;
    }
    .manager-avatar-initial {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: linear-gradient(135deg, #a78bfa, #8b5cf6);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 0.85rem;
      color: white;
      box-shadow: 0 4px 10px rgba(139, 92, 246, 0.3);
    }

    /* Contact Info */
    .contact-info {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .contact-item {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 0.88rem;
      color: var(--text);
    }
    .contact-icon {
      font-size: 1.05rem;
      color: var(--text-muted);
    }
    .phone-text {
      font-size: 0.82rem;
      color: var(--text-muted);
    }

    /* Badges */
    .rest-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 14px;
      border-radius: 20px;
      font-size: 0.8rem;
      font-weight: 600;
      transition: all 0.2s;
    }
    .rest-badge.active {
      background: rgba(34, 197, 94, 0.12);
      color: #4ade80;
      border: 1px solid rgba(34, 197, 94, 0.2);
    }
    .rest-badge.unlinked {
      background: rgba(148, 163, 184, 0.1);
      color: #94a3b8;
      border: 1px solid rgba(148, 163, 184, 0.18);
    }
    .count-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: rgba(249, 115, 22, 0.1);
      color: var(--primary);
      padding: 6px 14px;
      border-radius: 20px;
      font-size: 0.8rem;
      font-weight: 600;
      border: 1px solid rgba(249, 115, 22, 0.2);
    }
    .badge-icon {
      font-size: 1rem;
    }

    /* Action Buttons */
    .action-btns {
      display: flex;
      gap: 8px;
    }
    .btn-edit {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: rgba(249, 115, 22, 0.08);
      border: 1.5px solid rgba(249, 115, 22, 0.35);
      color: var(--primary);
      padding: 6px 14px;
      border-radius: 10px;
      font-weight: 600;
      font-size: 0.82rem;
      cursor: pointer;
      transition: all 0.2s ease;
      font-family: inherit;
    }
    .btn-edit .material-icons {
      font-size: 1rem;
    }
    .btn-edit:hover {
      background: var(--primary);
      color: white;
      border-color: transparent;
      box-shadow: 0 4px 12px rgba(249, 115, 22, 0.25);
      transform: translateY(-1px);
    }
    .btn-delete {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      background: rgba(239, 68, 68, 0.08);
      border: 1.5px solid rgba(239, 68, 68, 0.35);
      color: #ef4444;
      padding: 6px;
      border-radius: 10px;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .btn-delete .material-icons {
      font-size: 1.15rem;
    }
    .btn-delete:hover {
      background: #ef4444;
      color: white;
      border-color: transparent;
      box-shadow: 0 4px 12px rgba(239, 68, 68, 0.25);
      transform: translateY(-1px);
    }

    /* Modal Form Styling */
    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.6);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      z-index: 9999;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .modal-card {
      background: linear-gradient(160deg, #1e293b 0%, #0f172a 100%);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: var(--radius-lg);
      width: 100%;
      max-width: 460px;
      box-shadow: var(--shadow-lg);
      display: flex;
      flex-direction: column;
      max-height: 90vh;
      overflow: hidden;
    }
    .modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 20px 24px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    }
    .modal-header h2 {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 1.25rem;
      font-weight: 700;
      color: white;
      margin: 0;
    }
    .header-modal-icon {
      font-size: 1.5rem;
      color: var(--primary);
    }
    .modal-header .close-btn {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 50%;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--text-muted);
      cursor: pointer;
      transition: all 0.2s;
    }
    .modal-header .close-btn:hover {
      background: var(--danger);
      color: white;
      border-color: transparent;
    }
    .modal-body {
      padding: 24px;
      overflow-y: auto;
      flex: 1;
    }
    .input-with-icon {
      position: relative;
    }
    .input-field-icon {
      position: absolute;
      left: 14px;
      top: 50%;
      transform: translateY(-50%);
      color: var(--text-muted);
      font-size: 1.15rem;
    }
    .form-control {
      padding-left: 44px;
    }
    .form-actions {
      display: flex;
      gap: 12px;
      margin-top: 24px;
    }
    .btn-modal-cancel {
      flex: 1;
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid rgba(255, 255, 255, 0.08);
      color: var(--text);
      padding: 12px;
      border-radius: 12px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      font-family: inherit;
    }
    .btn-modal-cancel:hover {
      background: rgba(255, 255, 255, 0.08);
    }
    .btn-modal-save {
      flex: 1;
      background: linear-gradient(135deg, var(--primary), var(--primary-dark));
      color: white;
      border: none;
      padding: 12px;
      border-radius: 12px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      box-shadow: 0 4px 12px rgba(249, 115, 22, 0.3);
      font-family: inherit;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }
    .btn-modal-save:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 6px 16px rgba(249, 115, 22, 0.4);
    }
    .btn-modal-save:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    /* Empty state */
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 60px 20px;
      text-align: center;
      color: var(--text-muted);
    }
    .empty-icon {
      font-size: 3.5rem;
      color: var(--text-muted);
      opacity: 0.4;
      margin-bottom: 16px;
    }

    @media (max-width: 768px) {
      .page-header { flex-direction: column; align-items: stretch; gap: 12px; }
      .btn-add-manager { width: 100%; justify-content: center; }
      .search-bar-container { max-width: 100%; }

      .data-table, .data-table thead, .data-table tbody,
      .data-table th, .data-table td, .data-table tr {
        display: block;
      }
      .data-table thead { display: none; }
      .data-table tr {
        border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        padding: 16px;
      }
      .data-table tr:last-child { border-bottom: none; }
      .data-table td {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px 0;
        border-bottom: 1px dashed rgba(255,255,255,0.05);
        font-size: 0.88rem;
      }
      .data-table td:last-child { border-bottom: none; padding-top: 12px; }
      .data-table td::before {
        content: attr(data-label);
        font-weight: 600;
        color: var(--text-muted);
        font-size: 0.75rem;
        text-transform: uppercase;
        min-width: 100px;
        flex-shrink: 0;
        text-align: left;
      }
      .action-btns { justify-content: flex-end; }
      .td-manager-name { justify-content: space-between; }
      .td-manager-name strong { order: 2; }
      .manager-avatar-initial { display: none; }
    }

    /* Restaurant Picker Multi-Select */
    .restaurant-picker {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 12px;
      overflow: hidden;
      margin-top: 6px;
    }
    .picker-search {
      display: flex;
      align-items: center;
      padding: 8px 12px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      background: rgba(0, 0, 0, 0.2);
    }
    .search-picker-icon {
      font-size: 1.1rem;
      color: var(--text-muted);
      margin-right: 8px;
    }
    .picker-search-input {
      background: none;
      border: none;
      color: #fff;
      font-size: 0.85rem;
      outline: none;
      width: 100%;
    }
    .picker-list {
      max-height: 180px;
      overflow-y: auto;
      padding: 6px;
    }
    .picker-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px 12px;
      border-radius: 8px;
      cursor: pointer;
      transition: var(--transition);
      margin-bottom: 4px;
    }
    .picker-item:last-child {
      margin-bottom: 0;
    }
    .picker-item:hover {
      background: rgba(255, 255, 255, 0.05);
    }
    .picker-item.selected {
      background: rgba(249, 115, 22, 0.1);
    }
    .picker-checkbox {
      accent-color: var(--primary);
      width: 16px;
      height: 16px;
      cursor: pointer;
    }
    .picker-name {
      font-size: 0.88rem;
      font-weight: 600;
      color: #fff;
    }
    .picker-address {
      font-size: 0.75rem;
      color: var(--text-muted);
      margin-left: auto;
      max-width: 150px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .picker-empty {
      padding: 16px;
      text-align: center;
      color: var(--text-muted);
      font-size: 0.85rem;
    }
  `]
})
export class AdminManagersComponent implements OnInit {
  managers = signal<ManagerStats[]>([]);
  allRestaurants = signal<Restaurant[]>([]);
  loading = signal(true);
  showForm = signal(false);
  editId = signal<number | null>(null);
  saving = signal(false);
  searchQ = '';
  restSearch = '';
  selectedRestaurantIds = signal<number[]>([]);

  managerForm!: FormGroup;

  get filteredManagers(): ManagerStats[] {
    const q = this.searchQ.toLowerCase().trim();
    if (!q) return this.managers();
    return this.managers().filter(m => 
      m.name.toLowerCase().includes(q) || 
      m.email.toLowerCase().includes(q) || 
      (m.phone && m.phone.includes(q))
    );
  }

  get filteredRestaurants(): Restaurant[] {
    const q = this.restSearch.toLowerCase().trim();
    if (!q) return this.allRestaurants();
    return this.allRestaurants().filter(r => 
      r.name.toLowerCase().includes(q) || 
      (r.address && r.address.toLowerCase().includes(q))
    );
  }

  constructor(
    private fb: FormBuilder,
    private orderService: OrderService,
    private snack: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.load();
    this.loadRestaurants();
  }

  load(): void {
    this.loading.set(true);
    this.orderService.adminGetManagers().subscribe({
      next: (data) => {
        this.managers.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  loadRestaurants(): void {
    this.orderService.getRestaurants().subscribe({
      next: (data) => this.allRestaurants.set(data),
      error: () => console.warn('Could not load restaurants list for picker')
    });
  }

  isRestaurantSelected(id: number): boolean {
    return this.selectedRestaurantIds().includes(id);
  }

  toggleRestaurantSelection(id: number): void {
    const list = this.selectedRestaurantIds();
    if (list.includes(id)) {
      this.selectedRestaurantIds.set(list.filter(x => x !== id));
    } else {
      this.selectedRestaurantIds.set([...list, id]);
    }
  }

  initForm(data?: ManagerStats): void {
    this.restSearch = '';
    if (data) {
      this.selectedRestaurantIds.set(data.restaurantIds || []);
      this.managerForm = this.fb.group({
        name: [data.name, Validators.required],
        email: [data.email, [Validators.required, Validators.email]],
        phone: [data.phone || '']
      });
    } else {
      this.selectedRestaurantIds.set([]);
      this.managerForm = this.fb.group({
        name: ['', Validators.required],
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, Validators.minLength(6)]],
        phone: ['']
      });
    }
  }

  openAddForm(): void {
    this.editId.set(null);
    this.initForm();
    this.showForm.set(true);
  }

  openEditForm(m: ManagerStats): void {
    this.editId.set(m.id);
    this.initForm(m);
    this.showForm.set(true);
  }

  closeForm(): void {
    this.showForm.set(false);
  }

  saveManager(): void {
    if (this.managerForm.invalid) return;
    this.saving.set(true);

    if (this.editId()) {
      // Edit mode
      const payload = {
        ...this.managerForm.value,
        restaurantIds: this.selectedRestaurantIds()
      };
      this.orderService.adminUpdateManager(this.editId()!, payload).subscribe({
        next: () => {
          this.saving.set(false);
          this.closeForm();
          this.load();
          this.snack.open("✅ Menejer ma'lumotlari muvaffaqiyatli saqlandi!", "", { duration: 3000 });
        },
        error: (err) => {
          this.saving.set(false);
          this.snack.open(`❌ Xatolik: ${err.error?.message || 'Saqlab bo\'lmadi'}`, "", { duration: 3000 });
        }
      });
    } else {
      // Create mode
      const payload = {
        ...this.managerForm.value,
        role: 'MANAGER',
        restaurantIds: this.selectedRestaurantIds()
      };
      this.orderService.addCourierOrUser(payload).subscribe({
        next: () => {
          this.saving.set(false);
          this.closeForm();
          this.load();
          this.snack.open("✅ Yangi menejer hisobi muvaffaqiyatli yaratildi!", "", { duration: 3000 });
        },
        error: (err) => {
          this.saving.set(false);
          this.snack.open(`❌ Xatolik: ${err.error?.message || 'Yaratib bo\'lmadi'}`, "", { duration: 3000 });
        }
      });
    }
  }

  deleteManager(m: ManagerStats): void {
    let warning = `Ushbu menejerni (${m.name}) o'chirishni tasdiqlaysizmi?`;
    if (m.restaurantIds && m.restaurantIds.length > 0) {
      warning += `\nDiqqat: Ushbu menejer o'chirilsa, uning restoranlari (${m.restaurantName}) egasiz (muloqotsiz) bo'lib qoladi.`;
    }
    if (!confirm(warning)) return;

    this.orderService.adminDeleteManager(m.id).subscribe({
      next: () => {
        this.managers.update(list => list.filter(item => item.id !== m.id));
        this.snack.open("🗑️ Menejer muvaffaqiyatli o'chirildi", "", { duration: 2500 });
      },
      error: (err) => {
        this.snack.open(`❌ O'chirib bo'lmadi: ${err.error?.message || ''}`, "", { duration: 2500 });
      }
    });
  }
}
