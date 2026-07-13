import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { OrderService } from '../../../core/services/order.service';
import { Slot, SlotRequest } from '../../../core/models/slot.model';
import { User } from '../../../core/models/user.model';

@Component({
  selector: 'app-admin-slots',
  standalone: true,
  imports: [CommonModule, FormsModule, MatSnackBarModule, MatProgressSpinnerModule],
  template: `
    <div class="slots-page animate-in">
      <!-- Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">⏰ Smena Boshqaruvi</h1>
          <p class="page-sub">Kuryer smenalarini yarating va boshqaring</p>
        </div>
        <button class="btn btn-primary" (click)="openCreate()" id="create-slot-btn">
          ➕ Yangi Smena
        </button>
      </div>

      <!-- Stats Cards -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon">📅</div>
          <div class="stat-info">
            <div class="stat-number">{{ todaySlots().length }}</div>
            <div class="stat-label">Bugungi smenalar</div>
          </div>
        </div>
        <div class="stat-card active-stat">
          <div class="stat-icon">✅</div>
          <div class="stat-info">
            <div class="stat-number" style="color: #10b981">{{ activeCount }}</div>
            <div class="stat-label">Faol smenalar</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">📋</div>
          <div class="stat-info">
            <div class="stat-number">{{ allSlots().length }}</div>
            <div class="stat-label">Jami smenalar</div>
          </div>
        </div>
        <div class="stat-card open-stat">
          <div class="stat-icon">🔓</div>
          <div class="stat-info">
            <div class="stat-number" style="color: #f59e0b">{{ openSlotCount }}</div>
            <div class="stat-label">Ochiq smenalar</div>
          </div>
        </div>
      </div>

      <!-- Filter Tabs -->
      <div class="filter-tabs">
        <button class="tab-btn" [class.active]="filterMode() === 'today'" (click)="filterMode.set('today')">
          📅 Bugun
        </button>
        <button class="tab-btn" [class.active]="filterMode() === 'all'" (click)="filterMode.set('all')">
          📋 Barchasi
        </button>
      </div>

      <!-- Slots Table -->
      <div class="table-card">
        @if (loading()) {
          <div class="spinner-center">
            <mat-spinner diameter="40" color="warn"></mat-spinner>
          </div>
        } @else {
          @if (displayedSlots.length === 0) {
            <div class="empty-state">
              <div class="empty-icon">⏰</div>
              <p>Hozircha smenalar yo'q</p>
              <button class="btn btn-primary" (click)="openCreate()">Birinchi smenani yarating</button>
            </div>
          } @else {
            <div class="table-wrapper">
              <table class="slots-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Smena nomi</th>
                    <th>Sana</th>
                    <th>Vaqt</th>
                    <th>Kuryer</th>
                    <th>Holat</th>
                    <th>Amallar</th>
                  </tr>
                </thead>
                <tbody>
                  @for (slot of displayedSlots; track slot.id) {
                    <tr [id]="'slot-row-' + slot.id">
                      <td class="id-cell">{{ slot.id }}</td>
                      <td class="name-cell">
                        <span class="slot-name">{{ slot.name }}</span>
                      </td>
                      <td>
                        <span class="date-badge">
                          📅 {{ formatDate(slot.date) }}
                          @if (slot.endDate && slot.endDate !== slot.date) {
                            ➔ {{ formatDate(slot.endDate) }}
                          }
                        </span>
                      </td>
                      <td>
                        <span class="time-range">
                          🕐 {{ slot.startTime | slice:0:5 }} — {{ slot.endTime | slice:0:5 }}
                        </span>
                      </td>
                      <td>
                        @if (slot.courier) {
                          <div class="courier-info">
                            <div class="courier-avatar">{{ slot.courier.name[0].toUpperCase() }}</div>
                            <span>{{ slot.courier.name }}</span>
                          </div>
                        } @else {
                          <span class="open-badge">🔓 Ochiq</span>
                        }
                      </td>
                      <td>
                        <div style="display:flex; flex-direction:column; gap:4px;">
                          <span class="status-badge" [class]="getStatusClass(slot)">
                            {{ getStatusLabel(slot) }}
                          </span>
                          @if (slot.penaltyApplied) {
                            <span class="penalty-badge">⚡ Jarima: {{ slot.penaltyAmount | number:'1.0-0' }} so'm</span>
                          }
                        </div>
                      </td>
                      <td class="actions-cell">
                        <button class="icon-btn edit-btn" (click)="openEdit(slot)" [id]="'edit-slot-' + slot.id" title="Tahrirlash">✏️</button>
                        @if (slot.started && !slot.finished) {
                          <button class="icon-btn force-end-btn" (click)="confirmForceEnd(slot)" [id]="'force-end-slot-' + slot.id" title="Smenani majburiy tugatish">🛑</button>
                        }
                        @if (slot.penaltyApplied) {
                          <button class="icon-btn reverse-btn" (click)="confirmReverse(slot)" [id]="'reverse-slot-' + slot.id" title="Jarimani bekor qilish">↩️</button>
                        }
                        @if (!slot.finished && !slot.courier && !slot.bookedBy) {
                          <button class="icon-btn delete-btn" (click)="confirmDelete(slot)" [id]="'delete-slot-' + slot.id" title="O'chirish">🗑️</button>
                        }
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        }
      </div>
    </div>

    <!-- Create/Edit Modal -->
    @if (showModal()) {
      <div class="modal-overlay" (click)="closeModal()">
        <div class="modal-box" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>{{ editingSlot ? '✏️ Smenani tahrirlash' : '➕ Yangi smena yaratish' }}</h2>
            <button class="close-btn" (click)="closeModal()">✕</button>
          </div>

          <div class="modal-body">
            <div class="form-group">
              <label>Smena nomi *</label>
              <input type="text" [(ngModel)]="form.name" placeholder="Masalan: Ertalabki smena"
                class="form-input" id="slot-name-input" />
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Boshlanish sanasi *</label>
                <input type="date" [(ngModel)]="form.date" class="form-input" id="slot-date-input" />
              </div>
              <div class="form-group">
                <label>Tugash sanasi *</label>
                <input type="date" [(ngModel)]="form.endDate" class="form-input" id="slot-end-date-input" />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Boshlanish vaqti *</label>
                <input type="time" [(ngModel)]="form.startTime" class="form-input" id="slot-start-input" />
              </div>
              <div class="form-group">
                <label>Tugash vaqti *</label>
                <input type="time" [(ngModel)]="form.endTime" class="form-input" id="slot-end-input" />
              </div>
            </div>

            <div class="form-group">
              <label>Kuryer (ixtiyoriy)</label>
              <select [(ngModel)]="form.courierId" class="form-select" id="slot-courier-select">
                <option [ngValue]="null">— Ochiq smena (barcha kuryerlar uchun) —</option>
                @for (courier of couriers(); track courier.id) {
                  <option [ngValue]="courier.id">{{ courier.name }} ({{ courier.email }})</option>
                }
              </select>
              <small class="form-hint">Kuryer tanlanmasa, istalgan kuryer bu smenani qabul qila oladi</small>
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn btn-outline" (click)="closeModal()">Bekor qilish</button>
            <button class="btn btn-primary" (click)="saveSlot()" [disabled]="saving()" id="save-slot-btn">
              @if (saving()) { <mat-spinner diameter="16" color="accent"></mat-spinner> }
              {{ editingSlot ? 'Saqlash' : 'Yaratish' }}
            </button>
          </div>
        </div>
      </div>
    }

    <!-- Delete Confirm Modal -->
    @if (showDeleteModal()) {
      <div class="modal-overlay" (click)="showDeleteModal.set(false)">
        <div class="modal-box small" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>🗑️ Smenani o'chirish</h2>
            <button class="close-btn" (click)="showDeleteModal.set(false)">✕</button>
          </div>
          <div class="modal-body">
            <p class="confirm-text">
              <strong>"{{ slotToDelete?.name }}"</strong> smenasini o'chirishni tasdiqlaysizmi?
            </p>
          </div>
          <div class="modal-footer">
            <button class="btn btn-outline" (click)="showDeleteModal.set(false)">Bekor</button>
            <button class="btn btn-danger" (click)="deleteSlot()" [disabled]="saving()" id="confirm-delete-slot">
              O'chirish
            </button>
          </div>
        </div>
      </div>
    }

    <!-- Reverse Penalty Confirm Modal -->
    @if (showReverseModal()) {
      <div class="modal-overlay" (click)="showReverseModal.set(false)">
        <div class="modal-box small" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>↩️ Jarimani bekor qilish</h2>
            <button class="close-btn" (click)="showReverseModal.set(false)">✕</button>
          </div>
          <div class="modal-body">
            <div class="reverse-info">
              <div class="reverse-icon">⚡</div>
              <div>
                <p class="confirm-text">
                  <strong>{{ slotToReverse?.penalizedCourier?.name }}</strong> kuryeriga
                  <span class="penalty-amount">{{ slotToReverse?.penaltyAmount | number:'1.0-0' }} so'm</span>
                  jarima qaytariladi.
                </p>
                <p style="font-size:0.82rem; color:var(--text-muted); margin-top:8px;">
                  Smena: {{ slotToReverse?.name }} | {{ slotToReverse?.date }}
                </p>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-outline" (click)="showReverseModal.set(false)">Bekor</button>
            <button class="btn btn-reverse" (click)="reversePenalty()" [disabled]="saving()" id="confirm-reverse-penalty">
              @if (saving()) { <mat-spinner diameter="16" color="accent"></mat-spinner> }
              ✅ Jarimani qaytarish
            </button>
          </div>
        </div>
      </div>
    }

    <!-- Force End Slot Modal -->
    @if (showForceEndModal()) {
      <div class="modal-overlay" (click)="showForceEndModal.set(false)">
        <div class="modal-box small" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>🛑 Smenani majburiy tugatish</h2>
            <button class="close-btn" (click)="showForceEndModal.set(false)">✕</button>
          </div>
          <div class="modal-body">
            <div class="force-end-info">
              <div class="force-end-icon">⚠️</div>
              <div>
                <p class="confirm-text">
                  <strong>{{ slotToForceEnd?.courier?.name || 'Kuryer' }}</strong> kuryerining
                  <strong>"{{ slotToForceEnd?.name }}"</strong> smenasini hozir tugatmoqchimisiz?
                </p>
                <p style="font-size:0.82rem; color:var(--text-muted); margin-top:8px;">
                  Smena vaqti: {{ slotToForceEnd?.startTime | slice:0:5 }} — {{ slotToForceEnd?.endTime | slice:0:5 }}
                </p>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-outline" (click)="showForceEndModal.set(false)">Bekor</button>
            <button class="btn btn-force-end" (click)="forceEndSlot()" [disabled]="saving()" id="confirm-force-end-slot">
              @if (saving()) { <mat-spinner diameter="16" color="accent"></mat-spinner> }
              🛑 Ha, tugatish
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .slots-page { max-width: 1200px; margin: 0 auto; }

    .page-header {
      display: flex; align-items: flex-start;
      justify-content: space-between; margin-bottom: 28px; gap: 16px;
    }
    .page-title { font-size: 1.8rem; font-weight: 800; color: var(--text); margin-bottom: 4px; }
    .page-sub { font-size: 0.9rem; color: var(--text-muted); }

    /* Stats */
    .stats-grid {
      display: grid; grid-template-columns: repeat(4, 1fr);
      gap: 16px; margin-bottom: 28px;
    }
    .stat-card {
      background: var(--bg-card); border: 1px solid var(--border);
      border-radius: var(--radius-lg); padding: 20px;
      display: flex; align-items: center; gap: 14px;
      transition: var(--transition);
    }
    .stat-card:hover { border-color: var(--primary); transform: translateY(-2px); }
    .active-stat { border-color: rgba(16,185,129,0.3); }
    .open-stat { border-color: rgba(245,158,11,0.3); }
    .stat-icon { font-size: 2rem; }
    .stat-number { font-size: 1.8rem; font-weight: 800; color: var(--primary); line-height: 1; }
    .stat-label { font-size: 0.8rem; color: var(--text-muted); margin-top: 2px; }

    /* Tabs */
    .filter-tabs {
      display: flex; gap: 8px; margin-bottom: 20px;
    }
    .tab-btn {
      padding: 8px 20px; border-radius: 20px; border: 1px solid var(--border);
      background: transparent; color: var(--text-muted); cursor: pointer;
      font-family: 'Poppins', sans-serif; font-size: 0.875rem;
      transition: var(--transition);
    }
    .tab-btn.active, .tab-btn:hover {
      background: var(--primary); color: white; border-color: var(--primary);
    }

    /* Table */
    .table-card {
      background: var(--bg-card); border: 1px solid var(--border);
      border-radius: var(--radius-lg); overflow: hidden;
    }
    .table-wrapper { overflow-x: auto; }
    .slots-table {
      width: 100%; border-collapse: collapse;
    }
    .slots-table th {
      background: rgba(249,115,22,0.08);
      padding: 14px 16px; text-align: left;
      font-size: 0.78rem; font-weight: 700;
      color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em;
      border-bottom: 1px solid var(--border);
    }
    .slots-table td {
      padding: 14px 16px; border-bottom: 1px solid rgba(255,255,255,0.04);
      font-size: 0.875rem; color: var(--text);
    }
    .slots-table tr:last-child td { border-bottom: none; }
    .slots-table tr:hover td { background: rgba(249,115,22,0.04); }

    .id-cell { color: var(--text-muted); font-size: 0.8rem; }
    .slot-name { font-weight: 600; color: var(--text); }

    .date-badge {
      background: rgba(99,102,241,0.1); border: 1px solid rgba(99,102,241,0.25);
      color: #818cf8; padding: 3px 10px; border-radius: 20px; font-size: 0.8rem; font-weight: 600;
    }
    .date-badge-wrapper {
      display: flex;
      flex-direction: column;
      gap: 4px;
      align-items: flex-start;
    }
    .date-badge-end {
      background: rgba(16,185,129,0.1); border: 1px solid rgba(16,185,129,0.25);
      color: #10b981; padding: 2px 8px; border-radius: 20px; font-size: 0.72rem; font-weight: 600;
      white-space: nowrap;
    }
    .time-range { font-size: 0.85rem; color: var(--text-muted); }

    .courier-info { display: flex; align-items: center; gap: 8px; }
    .courier-avatar {
      width: 28px; height: 28px; border-radius: 50%;
      background: linear-gradient(135deg, var(--primary), var(--primary-dark));
      display: flex; align-items: center; justify-content: center;
      color: white; font-size: 0.75rem; font-weight: 700; flex-shrink: 0;
    }
    .open-badge {
      background: rgba(245,158,11,0.1); border: 1px solid rgba(245,158,11,0.3);
      color: #f59e0b; padding: 3px 10px; border-radius: 20px; font-size: 0.8rem;
    }

    .status-badge {
      padding: 4px 12px; border-radius: 20px;
      font-size: 0.78rem; font-weight: 600; letter-spacing: 0.02em;
    }
    .status-pending { background: rgba(100,116,139,0.15); color: #94a3b8; border: 1px solid rgba(100,116,139,0.3); }
    .status-active  { background: rgba(16,185,129,0.15); color: #10b981; border: 1px solid rgba(16,185,129,0.3); }
    .status-done    { background: rgba(99,102,241,0.15); color: #818cf8; border: 1px solid rgba(99,102,241,0.3); }

    .actions-cell { display: flex; gap: 8px; }
    .icon-btn {
      width: 34px; height: 34px; border-radius: 8px; border: 1px solid var(--border);
      background: transparent; cursor: pointer; font-size: 0.95rem;
      display: flex; align-items: center; justify-content: center;
      transition: var(--transition);
    }
    .edit-btn:hover { background: rgba(59,130,246,0.15); border-color: rgba(59,130,246,0.4); }
    .delete-btn:hover { background: rgba(239,68,68,0.15); border-color: rgba(239,68,68,0.4); }
    .reverse-btn:hover { background: rgba(249,115,22,0.15); border-color: rgba(249,115,22,0.4); }
    .force-end-btn:hover { background: rgba(239,68,68,0.15); border-color: rgba(239,68,68,0.5); }

    .penalty-badge {
      display: inline-flex; align-items: center; gap: 4px;
      background: rgba(239,68,68,0.12); border: 1px solid rgba(239,68,68,0.3);
      color: #f87171; padding: 2px 8px; border-radius: 12px;
      font-size: 0.72rem; font-weight: 600;
    }

    .reverse-info {
      display: flex; align-items: flex-start; gap: 14px;
      background: rgba(249,115,22,0.06); border: 1px solid rgba(249,115,22,0.2);
      border-radius: 12px; padding: 16px;
    }
    .reverse-icon { font-size: 2rem; flex-shrink: 0; }
    .penalty-amount { color: var(--primary); font-weight: 700; font-size: 1.05rem; }

    .btn-reverse {
      background: rgba(16,185,129,0.15); border: 1px solid rgba(16,185,129,0.4);
      color: #10b981; padding: 10px 20px; border-radius: var(--radius);
      cursor: pointer; font-family: 'Poppins', sans-serif; font-weight: 600;
      transition: var(--transition); display: flex; align-items: center; gap: 8px;
    }
    .btn-reverse:hover { background: rgba(16,185,129,0.25); }
    .btn-reverse:disabled { opacity: 0.6; cursor: not-allowed; }

    .force-end-info {
      display: flex; align-items: flex-start; gap: 14px;
      background: rgba(239,68,68,0.06); border: 1px solid rgba(239,68,68,0.2);
      border-radius: 12px; padding: 16px;
    }
    .force-end-icon { font-size: 2rem; flex-shrink: 0; }

    .btn-force-end {
      background: rgba(239,68,68,0.15); border: 1px solid rgba(239,68,68,0.4);
      color: #ef4444; padding: 10px 20px; border-radius: var(--radius);
      cursor: pointer; font-family: 'Poppins', sans-serif; font-weight: 600;
      transition: var(--transition); display: flex; align-items: center; gap: 8px;
    }
    .btn-force-end:hover { background: rgba(239,68,68,0.25); }
    .btn-force-end:disabled { opacity: 0.6; cursor: not-allowed; }

    .spinner-center { display: flex; justify-content: center; padding: 60px; }
    .empty-state { text-align: center; padding: 60px 20px; color: var(--text-muted); }
    .empty-icon { font-size: 3.5rem; margin-bottom: 16px; }
    .empty-state p { margin-bottom: 20px; font-size: 1rem; }

    /* Modal */
    .modal-overlay {
      position: fixed; inset: 0; background: rgba(0,0,0,0.7);
      backdrop-filter: blur(8px); z-index: 1000;
      display: flex; align-items: center; justify-content: center; padding: 20px;
      animation: fadeIn 0.2s ease;
    }
    .modal-box {
      background: var(--bg-card); border: 1px solid var(--border);
      border-radius: var(--radius-lg); width: 100%; max-width: 520px;
      box-shadow: 0 25px 60px rgba(0,0,0,0.5);
      animation: slideUp 0.3s cubic-bezier(0.34,1.56,0.64,1);
    }
    .modal-box.small { max-width: 400px; }
    .modal-header {
      padding: 20px 24px; border-bottom: 1px solid var(--border);
      display: flex; align-items: center; justify-content: space-between;
    }
    .modal-header h2 { font-size: 1.1rem; font-weight: 700; color: var(--text); }
    .close-btn {
      background: none; border: none; color: var(--text-muted);
      font-size: 1.1rem; cursor: pointer; padding: 4px;
      border-radius: 6px; transition: var(--transition);
    }
    .close-btn:hover { color: var(--text); background: var(--bg-card2); }
    .modal-body { padding: 24px; display: flex; flex-direction: column; gap: 16px; }
    .modal-footer {
      padding: 16px 24px; border-top: 1px solid var(--border);
      display: flex; justify-content: flex-end; gap: 12px;
    }

    .form-group { display: flex; flex-direction: column; gap: 6px; }
    .form-group label { font-size: 0.82rem; font-weight: 600; color: var(--text-muted); }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .form-input, .form-select {
      background: var(--bg-card2); border: 1px solid var(--border);
      border-radius: var(--radius); padding: 10px 14px; color: var(--text);
      font-family: 'Poppins', sans-serif; font-size: 0.9rem;
      transition: var(--transition); outline: none;
    }
    .form-input:focus, .form-select:focus { border-color: var(--primary); box-shadow: 0 0 0 3px rgba(249,115,22,0.15); }
    .form-hint { font-size: 0.75rem; color: var(--text-muted); font-style: italic; }

    .confirm-text { font-size: 0.95rem; color: var(--text); line-height: 1.6; }

    .btn-danger {
      background: rgba(239,68,68,0.15); border: 1px solid rgba(239,68,68,0.4);
      color: #ef4444; padding: 10px 20px; border-radius: var(--radius);
      cursor: pointer; font-family: 'Poppins', sans-serif; font-weight: 600;
      transition: var(--transition);
    }
    .btn-danger:hover { background: rgba(239,68,68,0.25); }

    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes slideUp { from { opacity: 0; transform: translateY(30px) scale(0.97); } to { opacity: 1; transform: none; } }

    @media (max-width: 900px) { .stats-grid { grid-template-columns: 1fr 1fr; } }
    @media (max-width: 600px) {
      .stats-grid { grid-template-columns: 1fr; }
      .form-row { grid-template-columns: 1fr; }
    }
  `]
})
export class AdminSlotsComponent implements OnInit {
  allSlots = signal<Slot[]>([]);
  todaySlots = signal<Slot[]>([]);
  couriers = signal<User[]>([]);
  loading = signal(true);
  saving = signal(false);
  filterMode = signal<'today' | 'all'>('today');
  showModal = signal(false);
  showDeleteModal = signal(false);
  showReverseModal = signal(false);
  showForceEndModal = signal(false);

  editingSlot: Slot | null = null;
  slotToDelete: Slot | null = null;
  slotToReverse: Slot | null = null;
  slotToForceEnd: Slot | null = null;

  form: SlotRequest & { courierId: number | null } = {
    name: '', date: '', endDate: '', startTime: '', endTime: '', courierId: null
  };

  get displayedSlots(): Slot[] {
    return this.filterMode() === 'today' ? this.todaySlots() : this.allSlots();
  }

  get activeCount(): number {
    return this.allSlots().filter(s => s.started && !s.finished).length;
  }

  get openSlotCount(): number {
    return this.allSlots().filter(s => !s.courier).length;
  }

  constructor(private orderService: OrderService, private snack: MatSnackBar) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading.set(true);
    this.orderService.adminGetSlots().subscribe({
      next: (slots) => { this.allSlots.set(slots); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
    this.orderService.adminGetTodaySlots().subscribe({
      next: (slots) => this.todaySlots.set(slots)
    });
    this.orderService.getCouriers().subscribe({
      next: (couriers) => this.couriers.set(couriers)
    });
  }

  openCreate(): void {
    this.editingSlot = null;
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    // Hozirgi vaqtdan keyingi soatni taklif qilamiz
    const nextHour = new Date(now.getTime() + 60 * 60 * 1000);
    const startH = String(nextHour.getHours()).padStart(2, '0');
    const startM = String(nextHour.getMinutes()).padStart(2, '0');
    const endHour = new Date(now.getTime() + 9 * 60 * 60 * 1000);
    const endH = String(Math.min(endHour.getHours(), 23)).padStart(2, '0');
    this.form = { name: '', date: today, endDate: today, startTime: `${startH}:${startM}`, endTime: `${endH}:00`, courierId: null };
    this.showModal.set(true);
  }

  openEdit(slot: Slot): void {
    this.editingSlot = slot;
    this.form = {
      name: slot.name,
      date: slot.date,
      endDate: slot.endDate || slot.date,
      startTime: slot.startTime.slice(0, 5),
      endTime: slot.endTime.slice(0, 5),
      courierId: slot.courier?.id ?? null
    };
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
    this.editingSlot = null;
  }

  saveSlot(): void {
    if (!this.form.name || !this.form.date || !this.form.endDate || !this.form.startTime || !this.form.endTime) {
      this.snack.open('❌ Barcha majburiy maydonlarni to\'ldiring!', '', { duration: 3000 });
      return;
    }

    // Boshlanish vaqti o'tib ketganligini tekshirish
    const now = new Date();
    const inputStartDateTime = new Date(`${this.form.date}T${this.form.startTime}:00`);
    if (inputStartDateTime.getTime() < now.getTime()) {
      const nowStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const slotStr = `${this.form.date} ${this.form.startTime}`;
      this.snack.open(`❌ Boshlanish vaqti o'tib ketgan! (Smena: ${slotStr}, Hozirgi: ${nowStr})`, '', { duration: 6000 });
      return;
    }

    // Tugash vaqti boshlanishdan keyin bo'lishi kerak
    const inputEndDateTime = new Date(`${this.form.endDate}T${this.form.endTime}:00`);
    if (inputEndDateTime.getTime() <= inputStartDateTime.getTime()) {
      this.snack.open("❌ Tugash vaqt-sanasi boshlanishidan keyin bo'lishi kerak!", '', { duration: 3500 });
      return;
    }

    const req: SlotRequest = {
      name: this.form.name,
      date: this.form.date,
      endDate: this.form.endDate,
      startTime: this.form.startTime,
      endTime: this.form.endTime,
      courierId: this.form.courierId
    };

    this.saving.set(true);
    const obs = this.editingSlot
      ? this.orderService.adminUpdateSlot(this.editingSlot.id, req)
      : this.orderService.adminCreateSlot(req);

    obs.subscribe({
      next: () => {
        this.saving.set(false);
        this.closeModal();
        this.snack.open(this.editingSlot ? '✅ Smena yangilandi!' : '✅ Smena yaratildi!', '', { duration: 3000 });
        this.loadData();
      },
      error: (err) => {
        this.saving.set(false);
        this.snack.open(`❌ Xatolik: ${err.error?.message || 'Amalni bajarib bo\'lmadi'}`, '', { duration: 4000 });
      }
    });
  }

  confirmDelete(slot: Slot): void {
    this.slotToDelete = slot;
    this.showDeleteModal.set(true);
  }

  deleteSlot(): void {
    if (!this.slotToDelete) return;
    this.saving.set(true);
    this.orderService.adminDeleteSlot(this.slotToDelete.id).subscribe({
      next: () => {
        this.saving.set(false);
        this.showDeleteModal.set(false);
        this.slotToDelete = null;
        this.snack.open('🗑️ Smena o\'chirildi', '', { duration: 3000 });
        this.loadData();
      },
      error: () => { this.saving.set(false); }
    });
  }

  confirmReverse(slot: Slot): void {
    this.slotToReverse = slot;
    this.showReverseModal.set(true);
  }

  reversePenalty(): void {
    if (!this.slotToReverse) return;
    this.saving.set(true);
    this.orderService.adminReversePenalty(this.slotToReverse.id).subscribe({
      next: () => {
        this.saving.set(false);
        this.showReverseModal.set(false);
        const courierName = this.slotToReverse?.penalizedCourier?.name || 'Kuryer';
        const amount = this.slotToReverse?.penaltyAmount ?? 0;
        this.slotToReverse = null;
        this.snack.open(
          `✅ Jarima qaytarildi! ${courierName}ga ${amount.toLocaleString()} so'm balansiga qo'shildi.`,
          '', { duration: 5000 }
        );
        this.loadData();
      },
      error: (err) => {
        this.saving.set(false);
        this.snack.open(`❌ Xatolik: ${err.error?.message || 'Jarimani bekor qilib bo\'lmadi'}`, '', { duration: 4000 });
      }
    });
  }

  confirmForceEnd(slot: Slot): void {
    this.slotToForceEnd = slot;
    this.showForceEndModal.set(true);
  }

  forceEndSlot(): void {
    if (!this.slotToForceEnd) return;
    this.saving.set(true);
    this.orderService.adminForceEndSlot(this.slotToForceEnd.id).subscribe({
      next: () => {
        this.saving.set(false);
        this.showForceEndModal.set(false);
        const courierName = this.slotToForceEnd?.courier?.name || 'Kuryer';
        const slotName = this.slotToForceEnd?.name || 'Smena';
        this.slotToForceEnd = null;
        this.snack.open(
          `🛑 ${courierName}ning "${slotName}" smenasi tugatildi!`,
          '', { duration: 4000 }
        );
        this.loadData();
      },
      error: (err) => {
        this.saving.set(false);
        this.snack.open(`❌ Xatolik: ${err.error?.message || 'Smenani tugatib bo\'lmadi'}`, '', { duration: 4000 });
      }
    });
  }

  formatDate(date: string): string {
    if (!date) return '';
    const parts = date.split('-');
    if (parts.length === 3) {
      // "2026-07-13" -> "13.07.2026"
      return `${parts[2]}.${parts[1]}.${parts[0]}`;
    }
    return date;
  }

  getStatusClass(slot: Slot): string {
    if (slot.finished) return 'status-badge status-done';
    if (slot.started) return 'status-badge status-active';
    return 'status-badge status-pending';
  }

  getStatusLabel(slot: Slot): string {
    if (slot.finished) return '✅ Tugagan';
    if (slot.started) return '🟢 Faol';
    return '⏳ Kutilmoqda';
  }
}
