import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { OrderService } from '../../../core/services/order.service';
import { ClientStats } from '../../../core/models/user.model';

@Component({
  selector: 'app-admin-clients',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MatProgressSpinnerModule, MatSnackBarModule],
  template: `
    <div class="clients-admin animate-in">
      <div class="page-header">
        <div>
          <h1 class="page-title">👥 Mijozlar Boshqaruvi</h1>
          <p style="color: var(--text-muted); font-size: 0.875rem;">Mijozlar hisoblarini boshqarish, buyurtma statslarini va aylanmalarini nazorat qilish</p>
        </div>
        <button class="btn btn-primary" (click)="openAddForm()" id="add-client-btn">
          + Yangi Mijoz
        </button>
      </div>

      <!-- Search -->
      <div class="search-box" style="margin-bottom: 20px; max-width: 320px; display: flex; align-items: center; gap: 8px; background: var(--bg-card); border: 1px solid var(--border); border-radius: 30px; padding: 8px 16px;">
        <span>🔍</span>
        <input [(ngModel)]="searchQ" type="text" placeholder="Ism yoki email qidiring..." class="search-input" style="background: none; border: none; outline: none; color: var(--text); font-size: 0.88rem; width: 100%;" id="client-search">
      </div>

      @if (loading()) {
        <div class="spinner-overlay"><mat-spinner color="warn"></mat-spinner></div>
      }

      @if (!loading()) {
        <div class="table-wrap" style="background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-lg); overflow: hidden;">
          <table class="data-table">
            <thead>
              <tr>
                <th>Mijoz</th>
                <th>Aloqa</th>
                <th>Manzil</th>
                <th>Buyurtmalar Soni</th>
                <th>Jami Xarid (so'm)</th>
                <th>Amallar</th>
              </tr>
            </thead>
            <tbody>
              @for (c of filteredClients; track c.id) {
                <tr [id]="'client-row-' + c.id">
                  <td><strong>{{ c.name }}</strong></td>
                  <td>
                    <div style="display: flex; flex-direction: column;">
                      <span>📧 {{ c.email }}</span>
                      <span style="font-size: 0.75rem; color: var(--text-muted); margin-top: 2px;">📞 {{ c.phone || 'Kiritilmagan' }}</span>
                    </div>
                  </td>
                  <td>{{ c.address || 'Kiritilmagan' }}</td>
                  <td><span class="count-badge">{{ c.totalOrdersCount }} ta</span></td>
                  <td><strong>{{ c.totalSpent | number:'1.0-0' }} so'm</strong></td>
                  <td>
                    <div style="display: flex; gap: 8px;">
                      <button class="btn btn-outline btn-sm" (click)="openEditForm(c)">✏️ Tahrirlash</button>
                      <button class="btn btn-outline btn-danger-outline btn-sm" (click)="deleteClient(c)">🗑️ O'chirish</button>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        @if (filteredClients.length === 0) {
          <div class="empty-state">
            <div class="icon">👥</div>
            <h3>Qidiruv bo'yicha mijoz topilmadi</h3>
          </div>
        }
      }

      <!-- Client Form Modal -->
      @if (showForm()) {
        <div class="modal-overlay" (click)="closeForm()">
          <div class="modal-card animate-in" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h2>{{ editId() ? '✏️ Mijoz ma\\'lumotlarini tahrirlash' : '+ Yangi Mijoz yaratish' }}</h2>
              <button class="close-btn" (click)="closeForm()">✕</button>
            </div>
            <div class="modal-body">
              <form [formGroup]="clientForm" (ngSubmit)="saveClient()">
                <div class="form-group">
                  <label class="form-label">To'liq Ism *</label>
                  <input formControlName="name" class="form-control" placeholder="Ism familiya..." id="client-form-name">
                </div>

                <div class="form-group">
                  <label class="form-label">Email *</label>
                  <input formControlName="email" type="email" class="form-control" placeholder="client@food.uz" id="client-form-email">
                </div>

                @if (!editId()) {
                  <div class="form-group">
                    <label class="form-label">Parol *</label>
                    <input formControlName="password" type="password" class="form-control" placeholder="Kamida 6 belgi" id="client-form-password">
                  </div>
                }

                <div class="form-row">
                  <div class="form-group">
                    <label class="form-label">Telefon raqami</label>
                    <input formControlName="phone" class="form-control" placeholder="+998901234567" id="client-form-phone">
                  </div>
                  <div class="form-group">
                    <label class="form-label">Manzil</label>
                    <input formControlName="address" class="form-control" placeholder="Shahar, ko'cha, uy" id="client-form-address">
                  </div>
                </div>

                <div class="form-actions">
                  <button type="button" class="btn btn-outline" (click)="closeForm()">Bekor qilish</button>
                  <button type="submit" class="btn btn-primary" [disabled]="saving() || clientForm.invalid">
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
    .clients-admin { max-width: 1100px; margin: 0 auto; }
    .count-badge { background: rgba(249,115,22,0.1); color: var(--primary); padding: 2px 8px; border-radius: 8px; font-size: 0.8rem; font-weight: 600; }
    .btn-danger-outline { border-color: rgba(239,68,68,0.3) !important; color: #ef4444 !important; }
    .btn-danger-outline:hover { background: rgba(239,68,68,0.1) !important; }

    .modal-overlay {
      position: fixed; inset: 0; background: rgba(0,0,0,0.6);
      backdrop-filter: blur(4px); z-index: 300;
      display: flex; align-items: center; justify-content: center; padding: 20px;
    }
    .modal-card {
      background: var(--bg-card); border: 1px solid var(--border);
      border-radius: var(--radius-lg); width: 100%; max-width: 480px; max-height: 90vh; overflow-y: auto;
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

    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

    .form-actions { display: flex; gap: 10px; margin-top: 16px; }
    .form-actions .btn { flex: 1; justify-content: center; gap: 8px; }
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
