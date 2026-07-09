import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { OrderService } from '../../../core/services/order.service';
import { CourierStats } from '../../../core/models/user.model';

@Component({
  selector: 'app-admin-couriers',
  standalone: true,
  imports: [CommonModule, FormsModule, MatProgressSpinnerModule],
  template: `
    <div class="couriers-page animate-in">
      <div class="page-header">
        <div>
          <h1 class="page-title">🏍️ Kuryerlar Boshqaruvi</h1>
          <p style="color: var(--text-muted); font-size: 0.875rem;">
            Kuryerlar faoliyati, bandlik holati va to'plagan umumiy daromadlari
          </p>
        </div>
        <div class="header-actions">
          <button class="btn btn-outline" (click)="load(true)" id="refresh-couriers-btn" style="margin-right: 8px;">
            🔄 Yangilash
          </button>
          <button class="btn btn-primary" (click)="showModal.set(true)" id="add-courier-btn">
            ➕ Yangi kuryer
          </button>
        </div>
      </div>

      @if (loading()) {
        <div class="spinner-overlay">
          <mat-spinner color="warn"></mat-spinner>
        </div>
      }

      @if (!loading()) {
        <div class="couriers-grid">
          @for (c of couriers(); track c.id) {
            <div class="courier-card" [class.busy]="c.isBusy" [id]="'courier-card-' + c.id">
              <div class="courier-header">
                <div class="courier-avatar">🏍️</div>
                <div class="courier-main">
                  <h3 class="courier-name">{{ c.name }}</h3>
                  <span class="status-badge" [class.badge-busy]="c.isBusy" [class.badge-free]="!c.isBusy">
                    {{ c.isBusy ? "🔴 Band (Buyurtmada)" : "🟢 Bo'sh (Mavjud)" }}
                  </span>
                </div>
              </div>

              <div class="courier-details">
                <div class="detail-row">
                  <span class="label">📧 Email:</span>
                  <span class="value">{{ c.email }}</span>
                </div>
                <div class="detail-row">
                  <span class="label">📞 Telefon:</span>
                  <span class="value">{{ c.phone || 'Kiritilmagan' }}</span>
                </div>
                <hr class="divider">
                <div class="stats-row">
                  <div class="stat-item">
                    <span class="stat-val">{{ c.completedOrdersCount }}</span>
                    <span class="stat-lbl">Topshirilgan</span>
                  </div>
                  <div class="stat-item">
                    <span class="stat-val earnings">{{ c.totalEarnings | number:'1.0-0' }} so'm</span>
                    <span class="stat-lbl">Umumiy daromad</span>
                  </div>
                </div>
              </div>
            </div>
          }
        </div>

        @if (couriers().length === 0) {
          <div class="empty-state">
            <div class="icon">🏍️</div>
            <h3>Kuryerlar ro'yxati bo'sh</h3>
          </div>
        }
      }

      <!-- Add Courier Modal -->
      @if (showModal()) {
        <div class="modal-backdrop" (click)="closeModal()">
          <div class="modal-card animate-in" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h2>➕ Yangi Kuryer Qo'shish</h2>
              <button class="modal-close" (click)="closeModal()">✕</button>
            </div>
            
            <form (ngSubmit)="onSubmit()" class="modal-form">
              <div class="form-group">
                <label class="form-label">👤 To'liq ism</label>
                <input type="text" [(ngModel)]="formName" name="name" class="form-control" placeholder="Ismi va familiyasi" required>
              </div>

              <div class="form-group">
                <label class="form-label">📧 Email</label>
                <input type="email" [(ngModel)]="formEmail" name="email" class="form-control" placeholder="kuryer@manzil.uz" required>
              </div>

              <div class="form-group">
                <label class="form-label">🔒 Parol</label>
                <input type="password" [(ngModel)]="formPassword" name="password" class="form-control" placeholder="Kamida 6 ta belgi" required>
              </div>

              <div class="form-group">
                <label class="form-label">📱 Telefon</label>
                <input type="tel" [(ngModel)]="formPhone" name="phone" class="form-control" placeholder="+998 90 123 45 67">
              </div>

              <div class="form-group">
                <label class="form-label">📍 Manzil</label>
                <input type="text" [(ngModel)]="formAddress" name="address" class="form-control" placeholder="Yashash manzili">
              </div>

              @if (modalErrorMsg()) {
                <div class="alert-error" style="margin-top: 10px;">⚠️ {{ modalErrorMsg() }}</div>
              }

              <div class="modal-actions">
                <button type="button" class="btn btn-outline" (click)="closeModal()">Bekor qilish</button>
                <button type="submit" class="btn btn-primary" [disabled]="modalSaving()">
                  {{ modalSaving() ? "Saqlanmoqda..." : "Qo'shish" }}
                </button>
              </div>
            </form>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .couriers-page { max-width: 1100px; margin: 0 auto; }

    .header-actions { display: flex; align-items: center; }

    .couriers-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 20px;
    }

    .courier-card {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      padding: 20px;
      transition: var(--transition);
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .courier-card:hover {
      border-color: rgba(249,115,22,0.3);
      transform: translateY(-2px);
      box-shadow: var(--shadow);
    }
    .courier-card.busy {
      border-color: rgba(239,68,68,0.2);
    }

    .courier-header {
      display: flex;
      align-items: center;
      gap: 14px;
      border-bottom: 1px solid rgba(255,255,255,0.05);
      padding-bottom: 12px;
    }

    .courier-avatar {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      background: rgba(249,115,22,0.1);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.4rem;
      border: 1px solid rgba(249,115,22,0.25);
    }
    .courier-card.busy .courier-avatar {
      background: rgba(239,68,68,0.1);
      border-color: rgba(239,68,68,0.2);
    }

    .courier-main {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .courier-name {
      font-size: 1rem;
      font-weight: 700;
      color: var(--text);
    }

    .status-badge {
      font-size: 0.72rem;
      font-weight: 600;
      padding: 3px 8px;
      border-radius: 20px;
      width: fit-content;
    }
    .badge-free { background: rgba(16,185,129,0.1); color: #10b981; border: 1px solid rgba(16,185,129,0.2); }
    .badge-busy { background: rgba(239,68,68,0.1); color: #ef4444; border: 1px solid rgba(239,68,68,0.2); }

    .courier-details {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .detail-row {
      display: flex;
      justify-content: space-between;
      font-size: 0.82rem;
    }
    .detail-row .label { color: var(--text-muted); }
    .detail-row .value { color: var(--text); font-weight: 500; }

    .divider {
      border: 0;
      border-top: 1px dashed var(--border);
      margin: 8px 0;
    }

    .stats-row {
      display: grid;
      grid-template-columns: 1fr 1.5fr;
      gap: 12px;
    }

    .stat-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      background: var(--bg-card2);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 8px;
    }
    .stat-val {
      font-size: 1.05rem;
      font-weight: 800;
      color: var(--text);
    }
    .stat-val.earnings {
      color: var(--primary);
    }
    .stat-lbl {
      font-size: 0.68rem;
      color: var(--text-muted);
      margin-top: 2px;
    }

    /* Modal styles */
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.6);
      backdrop-filter: blur(4px);
      z-index: 200;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 16px;
    }

    .modal-card {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      width: 100%;
      max-width: 460px;
      box-shadow: var(--shadow-lg);
      overflow: hidden;
      display: flex;
      flex-direction: column;
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

    .modal-form {
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      margin-top: 10px;
    }

    .alert-error {
      background: rgba(239,68,68,0.1);
      border: 1px solid rgba(239,68,68,0.3);
      border-radius: var(--radius);
      padding: 10px 14px;
      font-size: 0.875rem;
      color: #ef4444;
    }
  `]
})
export class AdminCouriersComponent implements OnInit, OnDestroy {
  couriers = signal<CourierStats[]>([]);
  loading = signal(true);
  private pollInterval: any;

  // Add Courier Form States
  showModal = signal(false);
  modalSaving = signal(false);
  modalErrorMsg = signal('');

  formName = '';
  formEmail = '';
  formPassword = '';
  formPhone = '';
  formAddress = '';

  constructor(private orderService: OrderService) {}

  ngOnInit(): void {
    this.load(true);
    // Poll every 4 seconds to show live delivery metrics and busy statuses
    this.pollInterval = setInterval(() => this.load(false), 4000);
  }

  ngOnDestroy(): void {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
    }
  }

  load(showLoader = true): void {
    if (showLoader) this.loading.set(true);
    this.orderService.getCourierStats().subscribe({
      next: (data) => {
        this.couriers.set(data);
        if (showLoader) this.loading.set(false);
      },
      error: () => {
        if (showLoader) this.loading.set(false);
      }
    });
  }

  closeModal(): void {
    this.showModal.set(false);
    this.modalErrorMsg.set('');
    this.formName = '';
    this.formEmail = '';
    this.formPassword = '';
    this.formPhone = '';
    this.formAddress = '';
  }

  onSubmit(): void {
    if (!this.formName || !this.formEmail || !this.formPassword) return;

    this.modalSaving.set(true);
    this.modalErrorMsg.set('');

    this.orderService.addCourierOrUser({
      name: this.formName,
      email: this.formEmail,
      password: this.formPassword,
      phone: this.formPhone || undefined,
      address: this.formAddress || undefined,
      role: 'COURIER'
    }).subscribe({
      next: () => {
        this.modalSaving.set(false);
        this.closeModal();
        this.load(true); // reload list
      },
      error: (err) => {
        this.modalSaving.set(false);
        this.modalErrorMsg.set(err.error?.message || 'Kuryerni qo\'shishda xatolik yuz berdi!');
      }
    });
  }
}
