import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { OrderService } from '../../../core/services/order.service';
import { ClientStats } from '../../../core/models/user.model';
import { BodyPortalDirective } from '../../../core/directives/body-portal.directive';

@Component({
  selector: 'app-admin-clients',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MatProgressSpinnerModule, MatSnackBarModule, BodyPortalDirective],
  template: `
    <div class="clients-admin animate-in">
      <div class="page-header">
        <div class="header-left">
          <div class="title-wrap">
            <span class="material-icons title-icon">people</span>
            <h1 class="page-title">Mijozlar Boshqaruvi</h1>
          </div>
          <p class="page-subtitle">Mijozlar hisoblarini boshqarish, buyurtma statslarini va aylanmalarini nazorat qilish</p>
        </div>
        <button class="btn-add-client" (click)="openAddForm()" id="add-client-btn">
          <span class="material-icons">person_add</span>
          Yangi Mijoz
        </button>
      </div>

      <!-- Search -->
      <div class="search-bar-container">
        <span class="material-icons search-icon">search</span>
        <input [(ngModel)]="searchQ" type="text" placeholder="Ism yoki email qidiring..." class="search-input" id="client-search">
      </div>

      @if (loading()) {
        <div class="spinner-overlay"><mat-spinner color="warn"></mat-spinner></div>
      }

      @if (!loading()) {
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>Mijoz</th>
                <th>Aloqa</th>
                <th>Manzil</th>
                <th>Buyurtmalar</th>
                <th>Jami Xarid</th>
                <th>Amallar</th>
              </tr>
            </thead>
            <tbody>
              @for (c of filteredClients; track c.id) {
                <tr [id]="'client-row-' + c.id">
                  <td data-label="Mijoz" class="td-client-name">
                    <span class="client-avatar-initial">{{ c.name[0].toUpperCase() }}</span>
                    <strong>{{ c.name }}</strong>
                  </td>
                  <td data-label="Aloqa">
                    <div class="contact-info">
                      <span class="contact-item"><span class="material-icons contact-icon">email</span>{{ c.email }}</span>
                      <span class="contact-item phone-text"><span class="material-icons contact-icon">phone</span>{{ c.phone || 'Kiritilmagan' }}</span>
                    </div>
                  </td>
                  <td data-label="Manzil">
                    <span class="address-item">
                      <span class="material-icons address-icon">place</span>
                      {{ c.address || 'Kiritilmagan' }}
                    </span>
                  </td>
                  <td data-label="Buyurtmalar">
                    <span class="count-badge">
                      <span class="material-icons badge-icon">shopping_bag</span>
                      {{ c.totalOrdersCount }} ta
                    </span>
                  </td>
                  <td data-label="Jami Xarid">
                    <span class="spent-badge">
                      <span class="material-icons badge-icon">payments</span>
                      {{ c.totalSpent | number:'1.0-0' }} so'm
                    </span>
                  </td>
                  <td data-label="Amallar">
                    <div class="action-btns">
                      <button class="btn-edit" (click)="openEditForm(c)"><span class="material-icons">edit</span>Tahrirlash</button>
                      <button class="btn-delete" (click)="deleteClient(c)"><span class="material-icons">delete</span></button>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        @if (filteredClients.length === 0) {
          <div class="empty-state">
            <span class="material-icons empty-icon">person_off</span>
            <h3>Qidiruv bo'yicha mijoz topilmadi</h3>
          </div>
        }
      }

      <!-- Client Form Modal -->
      @if (showForm()) {
        <div class="modal-overlay" appBodyPortal (click)="closeForm()">
          <div class="modal-card animate-in" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h2>
                <span class="material-icons header-modal-icon">{{ editId() ? 'edit' : 'person_add' }}</span>
                {{ editId() ? 'Mijozni tahrirlash' : 'Yangi Mijoz' }}
              </h2>
              <button class="close-btn" (click)="closeForm()">✕</button>
            </div>
            <div class="modal-body">
              <form [formGroup]="clientForm" (ngSubmit)="saveClient()">
                <div class="form-group">
                  <label class="form-label">To'liq Ism *</label>
                  <div class="input-with-icon">
                    <span class="material-icons input-field-icon">person</span>
                    <input formControlName="name" class="form-control" placeholder="Ism familiya..." id="client-form-name">
                  </div>
                </div>

                <div class="form-group">
                  <label class="form-label">Email *</label>
                  <div class="input-with-icon">
                    <span class="material-icons input-field-icon">email</span>
                    <input formControlName="email" type="email" class="form-control" placeholder="client@food.uz" id="client-form-email">
                  </div>
                </div>

                @if (!editId()) {
                  <div class="form-group">
                    <label class="form-label">Parol *</label>
                    <div class="input-with-icon">
                      <span class="material-icons input-field-icon">lock</span>
                      <input formControlName="password" type="password" class="form-control" placeholder="Kamida 6 belgi" id="client-form-password">
                    </div>
                  </div>
                }

                <div class="form-row">
                  <div class="form-group">
                    <label class="form-label">Telefon raqami</label>
                    <div class="input-with-icon">
                      <span class="material-icons input-field-icon">phone</span>
                      <input formControlName="phone" class="form-control" placeholder="+998901234567" id="client-form-phone">
                    </div>
                  </div>
                  <div class="form-group">
                    <label class="form-label">Manzil</label>
                    <div class="input-with-icon">
                      <span class="material-icons input-field-icon">place</span>
                      <input formControlName="address" class="form-control" placeholder="Shahar, ko'cha, uy" id="client-form-address">
                    </div>
                  </div>
                </div>

                <div class="form-actions">
                  <button type="button" class="btn-modal-cancel" (click)="closeForm()">Bekor qilish</button>
                  <button type="submit" class="btn-modal-save" [disabled]="saving() || clientForm.invalid">
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
    .clients-admin {
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

    /* Add Client Button */
    .btn-add-client {
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
    .btn-add-client:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(249, 115, 22, 0.45);
    }
    .btn-add-client:active {
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

    /* Client Initial Avatar */
    .td-client-name {
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 0.95rem;
    }
    .client-avatar-initial {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: linear-gradient(135deg, #f97316, #ea580c);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 0.85rem;
      color: white;
      box-shadow: 0 4px 10px rgba(249, 115, 22, 0.3);
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

    /* Address */
    .address-item {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 0.88rem;
    }
    .address-icon {
      font-size: 1.15rem;
      color: var(--text-muted);
    }

    /* Badges */
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
    .spent-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: rgba(34, 197, 94, 0.1);
      color: #4ade80;
      padding: 6px 14px;
      border-radius: 20px;
      font-size: 0.8rem;
      font-weight: 600;
      border: 1px solid rgba(34, 197, 94, 0.2);
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
      max-width: 480px;
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
    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
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
      .btn-add-client { width: 100%; justify-content: center; }
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
      .td-client-name { justify-content: space-between; }
      .td-client-name strong { order: 2; }
      .client-avatar-initial { display: none; }
      .form-row { grid-template-columns: 1fr; }
    }
  `]
})
export class AdminClientsComponent implements OnInit {
  clients = signal<ClientStats[]>([]);
  loading = signal(true);
  showForm = signal(false);
  editId = signal<number | null>(null);
  saving = signal(false);
  searchQ = '';

  clientForm!: FormGroup;

  get filteredClients(): ClientStats[] {
    const q = this.searchQ.toLowerCase().trim();
    if (!q) return this.clients();
    return this.clients().filter(c => 
      c.name.toLowerCase().includes(q) || 
      c.email.toLowerCase().includes(q) || 
      (c.phone && c.phone.includes(q))
    );
  }

  constructor(
    private fb: FormBuilder,
    private orderService: OrderService,
    private snack: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.orderService.adminGetClients().subscribe({
      next: (data) => {
        this.clients.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  initForm(data?: ClientStats): void {
    if (data) {
      this.clientForm = this.fb.group({
        name: [data.name, Validators.required],
        email: [data.email, [Validators.required, Validators.email]],
        phone: [data.phone || ''],
        address: [data.address || '']
      });
    } else {
      this.clientForm = this.fb.group({
        name: ['', Validators.required],
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, Validators.minLength(6)]],
        phone: [''],
        address: ['']
      });
    }
  }

  openAddForm(): void {
    this.editId.set(null);
    this.initForm();
    this.showForm.set(true);
  }

  openEditForm(c: ClientStats): void {
    this.editId.set(c.id);
    this.initForm(c);
    this.showForm.set(true);
  }

  closeForm(): void {
    this.showForm.set(false);
  }

  saveClient(): void {
    if (this.clientForm.invalid) return;
    this.saving.set(true);

    if (this.editId()) {
      // Edit mode
      this.orderService.adminUpdateClient(this.editId()!, this.clientForm.value).subscribe({
        next: () => {
          this.saving.set(false);
          this.closeForm();
          this.load();
          this.snack.open("✅ Mijoz ma'lumotlari muvaffaqiyatli saqlandi!", "", { duration: 3000 });
        },
        error: (err) => {
          this.saving.set(false);
          this.snack.open(`❌ Xatolik: ${err.error?.message || 'Saqlab bo\'lmadi'}`, "", { duration: 3000 });
        }
      });
    } else {
      // Create mode
      const payload = {
        ...this.clientForm.value,
        role: 'CLIENT'
      };
      this.orderService.addCourierOrUser(payload).subscribe({
        next: () => {
          this.saving.set(false);
          this.closeForm();
          this.load();
          this.snack.open("✅ Yangi mijoz hisobi muvaffaqiyatli yaratildi!", "", { duration: 3000 });
        },
        error: (err) => {
          this.saving.set(false);
          this.snack.open(`❌ Xatolik: ${err.error?.message || 'Yaratib bo\'lmadi'}`, "", { duration: 3000 });
        }
      });
    }
  }

  deleteClient(c: ClientStats): void {
    const text = `Ushbu mijoz (${c.name}) va unga tegishli barcha buyurtmalarni butunlay o'chirishni tasdiqlaysizmi?`;
    if (!confirm(text)) return;

    this.orderService.adminDeleteClient(c.id).subscribe({
      next: () => {
        this.clients.update(list => list.filter(item => item.id !== c.id));
        this.snack.open("🗑️ Mijoz muvaffaqiyatli o'chirildi", "", { duration: 2500 });
      },
      error: (err) => {
        this.snack.open(`❌ O'chirib bo'lmadi: ${err.error?.message || ''}`, "", { duration: 2500 });
      }
    });
  }
}
