import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { OrderService } from '../../../core/services/order.service';
import { ManagerStats } from '../../../core/models/user.model';

@Component({
  selector: 'app-admin-managers',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MatProgressSpinnerModule, MatSnackBarModule],
  template: `
    <div class="managers-admin animate-in">
      <div class="page-header">
        <div>
          <h1 class="page-title">👤 Menejerlar Boshqaruvi</h1>
          <p style="color: var(--text-muted); font-size: 0.875rem;">Restoran menejerlari hisoblarini yaratish, tahrirlash va ularning restoran ko'rsatkichlarini nazorat qilish</p>
        </div>
        <button class="btn btn-primary" (click)="openAddForm()" id="add-manager-btn">
          + Yangi Menejer
        </button>
      </div>

      <!-- Search -->
      <div class="search-box" style="margin-bottom: 20px; max-width: 320px; display: flex; align-items: center; gap: 8px; background: var(--bg-card); border: 1px solid var(--border); border-radius: 30px; padding: 8px 16px;">
        <span>🔍</span>
        <input [(ngModel)]="searchQ" type="text" placeholder="Ism yoki email qidiring..." class="search-input" style="background: none; border: none; outline: none; color: var(--text); font-size: 0.88rem; width: 100%;" id="manager-search">
      </div>

      @if (loading()) {
        <div class="spinner-overlay"><mat-spinner color="warn"></mat-spinner></div>
      }

      @if (!loading()) {
        <div class="table-wrap" style="background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-lg); overflow: hidden;">
          <table class="data-table">
            <thead>
              <tr>
                <th>Menejer</th>
                <th>Aloqa</th>
                <th>Biriktirilgan Restoran</th>
                <th>Restoran Buyurtmalari</th>
                <th>Amallar</th>
              </tr>
            </thead>
            <tbody>
              @for (m of filteredManagers; track m.id) {
                <tr [id]="'manager-row-' + m.id">
                  <td><strong>{{ m.name }}</strong></td>
                  <td>
                    <div style="display: flex; flex-direction: column;">
                      <span>📧 {{ m.email }}</span>
                      <span style="font-size: 0.75rem; color: var(--text-muted); margin-top: 2px;">📞 {{ m.phone || 'Kiritilmagan' }}</span>
                    </div>
                  </td>
                  <td>
                    <span [class]="m.restaurantId ? 'rest-badge active' : 'rest-badge unlinked'">
                      {{ m.restaurantName }}
                    </span>
                  </td>
                  <td><span class="count-badge">{{ m.restaurantOrdersCount }} ta buyurtma</span></td>
                  <td>
                    <div style="display: flex; gap: 8px;">
                      <button class="btn btn-outline btn-sm" (click)="openEditForm(m)">✏️ Tahrirlash</button>
                      <button class="btn btn-outline btn-danger-outline btn-sm" (click)="deleteManager(m)">🗑️ O'chirish</button>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        @if (filteredManagers.length === 0) {
          <div class="empty-state">
            <div class="icon">👤</div>
            <h3>Qidiruv bo'yicha menejer topilmadi</h3>
          </div>
        }
      }

      <!-- Manager Form Modal -->
      @if (showForm()) {
        <div class="modal-overlay" (click)="closeForm()">
          <div class="modal-card animate-in" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h2>{{ editId() ? '✏️ Menejer ma\'lumotlarini tahrirlash' : '+ Yangi Menejer yaratish' }}</h2>
              <button class="close-btn" (click)="closeForm()">✕</button>
            </div>
            <div class="modal-body">
              <form [formGroup]="managerForm" (ngSubmit)="saveManager()">
                <div class="form-group">
                  <label class="form-label">To'liq Ism *</label>
                  <input formControlName="name" class="form-control" placeholder="Ism familiya..." id="manager-form-name">
                </div>

                <div class="form-group">
                  <label class="form-label">Email *</label>
                  <input formControlName="email" type="email" class="form-control" placeholder="manager@food.uz" id="manager-form-email">
                </div>

                @if (!editId()) {
                  <div class="form-group">
                    <label class="form-label">Parol *</label>
                    <input formControlName="password" type="password" class="form-control" placeholder="Kamida 6 belgi" id="manager-form-password">
                  </div>
                }

                <div class="form-group">
                  <label class="form-label">Telefon raqami</label>
                  <input formControlName="phone" class="form-control" placeholder="+998901234567" id="manager-form-phone">
                </div>

                <div class="form-actions">
                  <button type="button" class="btn btn-outline" (click)="closeForm()">Bekor qilish</button>
                  <button type="submit" class="btn btn-primary" [disabled]="saving() || managerForm.invalid">
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
    .managers-admin { max-width: 1100px; margin: 0 auto; }
    .count-badge { background: rgba(249,115,22,0.1); color: var(--primary); padding: 2px 8px; border-radius: 8px; font-size: 0.8rem; font-weight: 600; }
    .btn-danger-outline { border-color: rgba(239,68,68,0.3) !important; color: #ef4444 !important; }
    .btn-danger-outline:hover { background: rgba(239,68,68,0.1) !important; }

    .rest-badge { padding: 4px 10px; border-radius: 20px; font-size: 0.78rem; font-weight: 600; }
    .rest-badge.active { background: rgba(34,197,94,0.15); color: #22c55e; }
    .rest-badge.unlinked { background: rgba(100,116,139,0.15); color: #64748b; }

    .modal-overlay {
      position: fixed; inset: 0; background: rgba(0,0,0,0.6);
      backdrop-filter: blur(4px); z-index: 300;
      display: flex; align-items: center; justify-content: center; padding: 20px;
    }
    .modal-card {
      background: var(--bg-card); border: 1px solid var(--border);
      border-radius: var(--radius-lg); width: 100%; max-width: 440px; max-height: 90vh; overflow-y: auto;
    }
    .modal-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 16px 20px; border-bottom: 1px solid var(--border);
    }
    .modal-header h2 { font-size: 1.1rem; font-weight: 700; }
    .close-btn {
      background: var(--bg-card2); border: 1px solid var(--border);
      border-radius: 8px; padding: 6px 10px; cursor: pointer; transition: var(--transition);
    }
    .close-btn:hover { background: var(--danger); color: white; }

    .modal-body { padding: 20px; }

    .form-actions { display: flex; gap: 10px; margin-top: 16px; }
    .form-actions .btn { flex: 1; justify-content: center; gap: 8px; }
  `]
})
export class AdminManagersComponent implements OnInit {
  managers = signal<ManagerStats[]>([]);
  loading = signal(true);
  showForm = signal(false);
  editId = signal<number | null>(null);
  saving = signal(false);
  searchQ = '';

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
    this.orderService.adminGetManagers().subscribe({
      next: (data) => {
        this.managers.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  initForm(data?: ManagerStats): void {
    if (data) {
      this.managerForm = this.fb.group({
        name: [data.name, Validators.required],
        email: [data.email, [Validators.required, Validators.email]],
        phone: [data.phone || '']
      });
    } else {
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
      this.orderService.adminUpdateManager(this.editId()!, this.managerForm.value).subscribe({
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
        role: 'MANAGER'
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
    if (m.restaurantId) {
      warning += `\nDiqqat: Ushbu menejer o'chirilsa, uning restorani (${m.restaurantName}) egasiz (muloqotsiz) bo'lib qoladi.`;
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
