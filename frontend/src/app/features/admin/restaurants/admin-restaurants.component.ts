import { Component, OnInit, NgZone, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { OrderService } from '../../../core/services/order.service';
import { Restaurant } from '../../../core/models/restaurant.model';
import { User } from '../../../core/models/user.model';

@Component({
  selector: 'app-admin-restaurants',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MatProgressSpinnerModule, MatSnackBarModule],
  template: `
    <div class="restaurants-admin animate-in">
      <div class="page-header">
        <div>
          <h1 class="page-title">🏪 Restoranlar Boshqaruvi</h1>
          <p style="color: var(--text-muted); font-size: 0.875rem;">Platformadagi barcha restoranlarni sozlash, joylashuvini belgilash va menejer biriktirish</p>
        </div>
        <button class="btn btn-primary" (click)="openAddForm()" id="add-rest-btn">
          + Yangi Restoran
        </button>
      </div>

      @if (loading()) {
        <div class="spinner-overlay"><mat-spinner color="warn"></mat-spinner></div>
      }

      @if (!loading()) {
        <div class="restaurants-list-grid">
          @for (r of restaurants(); track r.id) {
            <div class="restaurant-admin-card" [id]="'rest-card-' + r.id">
              <img [src]="r.imageUrl || fallbackImg" [alt]="r.name" class="rest-cover" (error)="onImgError($event)">
              <div class="rest-details">
                <h3 class="rest-name">{{ r.name }}</h3>
                <p class="rest-meta">📍 {{ r.address || 'Manzil kiritilmagan' }}</p>
                <p class="rest-meta">👤 Menejer: <strong>{{ r.owner?.name || 'Biriktirilmagan' }}</strong> ({{ r.owner?.email || '' }})</p>
                <p class="rest-meta">🌐 Coords: {{ r.latitude || 38.866 }}, {{ r.longitude || 65.816 }}</p>
                
                <div class="card-actions">
                  <button class="btn btn-outline btn-sm" (click)="openEditForm(r)">✏️ Tahrirlash</button>
                  <button class="btn btn-outline btn-sm btn-danger-outline" (click)="deleteRestaurant(r.id)">🗑️ O'chirish</button>
                </div>
              </div>
            </div>
          }
        </div>

        @if (restaurants().length === 0) {
          <div class="empty-state">
            <div class="icon">🏪</div>
            <h3>Hech qanday restoran topilmadi</h3>
          </div>
        }
      }

      <!-- Restaurant Form Modal -->
      @if (showForm()) {
        <div class="modal-overlay" (click)="closeForm()">
          <div class="modal-card animate-in" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h2>{{ editId() ? '✏️ Restoranni tahrirlash' : '+ Yangi Restoran' }}</h2>
              <button class="close-btn" (click)="closeForm()">✕</button>
            </div>
            <div class="modal-body">
              <form [formGroup]="restForm" (ngSubmit)="saveRestaurant()">
                <div class="form-group">
                  <label class="form-label">Restoran Nomi *</label>
                  <input formControlName="name" class="form-control" placeholder="Masalan: KFC Qarshi" id="rest-form-name">
                </div>

                <div class="form-row">
                  <div class="form-group">
                    <label class="form-label">Menejer (Ega) *</label>
                    <select formControlName="ownerId" class="form-control" id="rest-form-manager">
                      <option value="">Tanlang...</option>
                      @for (m of managers(); track m.id) {
                        <option [value]="m.id">{{ m.name }} ({{ m.email }})</option>
                      }
                    </select>
                  </div>
                  <div class="form-group">
                    <label class="form-label">Muqova Rasm URL</label>
                    <input formControlName="imageUrl" class="form-control" placeholder="https://..." id="rest-form-image">
                  </div>
                </div>

                <div class="form-group">
                  <label class="form-label">Manzil *</label>
                  <input formControlName="address" class="form-control" placeholder="Qarshi shahar, Mustaqillik ko'chasi..." id="rest-form-address">
                </div>

                <div class="form-row">
                  <div class="form-group">
                    <label class="form-label">Latitude *</label>
                    <input formControlName="latitude" type="number" step="0.000001" class="form-control" readonly id="rest-form-lat">
                  </div>
                  <div class="form-group">
                    <label class="form-label">Longitude *</label>
                    <input formControlName="longitude" type="number" step="0.000001" class="form-control" readonly id="rest-form-lng">
                  </div>
                </div>

                <!-- Inline Map for location picking -->
                <div class="map-wrap">
                  <label class="form-label">Joylashuvni xaritadan tanlang:</label>
                  <div id="admin-rest-map" class="form-map"></div>
                </div>

                <div class="form-actions">
                  <button type="button" class="btn btn-outline" (click)="closeForm()">Bekor qilish</button>
                  <button type="submit" class="btn btn-primary" [disabled]="saving() || restForm.invalid">
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
    .restaurants-admin { max-width: 1100px; margin: 0 auto; }

    .restaurants-list-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 20px;
    }

    .restaurant-admin-card {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      overflow: hidden;
      display: flex;
      flex-direction: column;
      transition: var(--transition);
    }
    .restaurant-admin-card:hover { border-color: rgba(249,115,22,0.3); }

    .rest-cover { width: 100%; height: 140px; object-fit: cover; }
    .rest-details { padding: 16px; display: flex; flex-direction: column; gap: 8px; }
    .rest-name { font-size: 1.15rem; font-weight: 700; color: var(--text); }
    .rest-meta { font-size: 0.8rem; color: var(--text-muted); line-height: 1.4; }

    .card-actions { display: flex; gap: 8px; margin-top: 8px; }
    .btn-danger-outline { border-color: rgba(239,68,68,0.3); color: #ef4444; }
    .btn-danger-outline:hover { background: rgba(239,68,68,0.1); }

    .modal-overlay {
      position: fixed; inset: 0; background: rgba(0,0,0,0.6);
      backdrop-filter: blur(4px); z-index: 300;
      display: flex; align-items: center; justify-content: center; padding: 20px;
    }
    .modal-card {
      background: var(--bg-card); border: 1px solid var(--border);
      border-radius: var(--radius-lg); width: 100%; max-width: 580px; max-height: 90vh; overflow-y: auto;
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

    .map-wrap { margin: 12px 0; }
    .form-map {
      width: 100%; height: 200px; border-radius: var(--radius); border: 1px solid var(--border);
      background: var(--bg-card2); margin-top: 4px;
    }

    .form-actions { display: flex; gap: 10px; margin-top: 16px; }
    .form-actions .btn { flex: 1; justify-content: center; gap: 8px; }
  `]
})
export class AdminRestaurantsComponent implements OnInit {
  restaurants = signal<Restaurant[]>([]);
  managers = signal<any[]>([]);
  loading = signal(true);
  showForm = signal(false);
  editId = signal<number | null>(null);
  saving = signal(false);
  fallbackImg = 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=500';

  restForm!: FormGroup;
  private map: any;
  private placemark: any;

  constructor(
    private fb: FormBuilder,
    private orderService: OrderService,
    private snack: MatSnackBar,
    private ngZone: NgZone
  ) {}

  ngOnInit(): void {
    this.load();
    this.orderService.adminGetManagers().subscribe(data => this.managers.set(data));
  }

  load(): void {
    this.loading.set(true);
    this.orderService.adminGetRestaurants().subscribe({
      next: (data) => { this.restaurants.set(data); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  initForm(data?: Restaurant): void {
    this.restForm = this.fb.group({
      name: [data?.name || '', Validators.required],
      ownerId: [data?.owner?.id ? String(data.owner.id) : '', Validators.required],
      imageUrl: [data?.imageUrl || ''],
      address: [data?.address || '', Validators.required],
      latitude: [data?.latitude || 38.866127, Validators.required],
      longitude: [data?.longitude || 65.816309, Validators.required]
    });
  }

  openAddForm(): void {
    this.editId.set(null);
    this.initForm();
    this.showForm.set(true);
    setTimeout(() => this.initMap(), 200);
  }

  openEditForm(r: Restaurant): void {
    this.editId.set(r.id);
    this.initForm(r);
    this.showForm.set(true);
    setTimeout(() => this.initMap(r), 200);
  }

  closeForm(): void { this.showForm.set(false); }

  private initMap(data?: Restaurant): void {
    const ymaps = (window as any).ymaps;
    if (!ymaps) return;

    ymaps.ready(() => {
      const lat = data?.latitude || 38.866127;
      const lng = data?.longitude || 65.816309;

      this.map = new ymaps.Map('admin-rest-map', {
        center: [lat, lng],
        zoom: 13,
        controls: ['zoomControl']
      });

      this.placemark = new ymaps.Placemark([lat, lng], {
        balloonContent: data?.name || 'Yangi Restoran'
      }, {
        preset: 'islands#redDotIconWithCaption',
        draggable: true
      });

      this.map.geoObjects.add(this.placemark);

      // Handle marker dragend
      this.placemark.events.add('dragend', () => {
        const coords = this.placemark.geometry.getCoordinates();
        this.ngZone.run(() => {
          this.restForm.patchValue({
            latitude: coords[0],
            longitude: coords[1]
          });
          this.reverseGeocode(coords);
        });
      });

      // Handle map click
      this.map.events.add('click', (e: any) => {
        const coords = e.get('coords');
        this.placemark.geometry.setCoordinates(coords);
        this.ngZone.run(() => {
          this.restForm.patchValue({
            latitude: coords[0],
            longitude: coords[1]
          });
          this.reverseGeocode(coords);
        });
      });
    });
  }

  private reverseGeocode(coords: number[]): void {
    const lat = coords[0];
    const lon = coords[1];
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&accept-language=uz`;

    fetch(url, { headers: { 'User-Agent': 'FoodDeliveryApp/1.0' } })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data && data.display_name) {
          this.ngZone.run(() => {
            this.restForm.patchValue({ address: data.display_name });
          });
        }
      })
      .catch(err => console.error('Geocoding failed:', err));
  }

  saveRestaurant(): void {
    if (this.restForm.invalid) return;
    this.saving.set(true);

    const payload = {
      ...this.restForm.value,
      ownerId: Number(this.restForm.value.ownerId)
    };

    const req$ = this.editId()
      ? this.orderService.adminUpdateRestaurant(this.editId()!, payload)
      : this.orderService.adminCreateRestaurant(payload);

    req$.subscribe({
      next: () => {
        this.saving.set(false);
        this.closeForm();
        this.load();
        this.snack.open(this.editId() ? '✅ Restoran yangilandi!' : '✅ Restoran yaratildi!', '', { duration: 3000 });
      },
      error: (err) => {
        this.saving.set(false);
        this.snack.open(`❌ Xatolik: ${err.error?.message || 'Amal bajarilmadi'}`, '', { duration: 3000 });
      }
    });
  }

  deleteRestaurant(id: number): void {
    if (!confirm("Ushbu restoranni o'chirishni tasdiqlaysizmi?")) return;

    this.orderService.adminDeleteRestaurant(id).subscribe({
      next: () => {
        this.restaurants.update(list => list.filter(r => r.id !== id));
        this.snack.open('🗑️ Restoran o\'chirildi', '', { duration: 2500 });
      },
      error: () => this.snack.open('❌ O\'chirib bo\'lmadi', '', { duration: 2500 })
    });
  }

  onImgError(e: Event): void {
    (e.target as HTMLImageElement).src = this.fallbackImg;
  }
}
