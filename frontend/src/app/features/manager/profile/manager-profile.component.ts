import { Component, OnInit, NgZone, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { OrderService } from '../../../core/services/order.service';
import { Restaurant } from '../../../core/models/restaurant.model';

@Component({
  selector: 'app-manager-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MatProgressSpinnerModule, MatSnackBarModule],
  template: `
    <div class="manager-profile animate-in">
      <div class="page-header">
        <div>
          <h1 class="page-title">⚙️ Restoran Profili</h1>
          <p style="color: var(--text-muted); font-size: 0.875rem;">Mijozlarga ko'rinadigan restoran ma'lumotlari va joylashuvini yangilash</p>
        </div>
      </div>

      @if (loading()) {
        <div class="spinner-overlay"><mat-spinner color="warn"></mat-spinner></div>
      }

      @if (!loading()) {
        <div class="profile-layout">
          <!-- Form Section -->
          <div class="form-card-profile">
            <form [formGroup]="profileForm" (ngSubmit)="saveProfile()">
              <div class="form-group">
                <label class="form-label">Restoran Nomi *</label>
                <input formControlName="name" class="form-control" placeholder="Restoran nomi..." id="profile-name">
              </div>

              <div class="form-group">
                <label class="form-label">Muqova Rasm URL</label>
                <input formControlName="imageUrl" class="form-control" placeholder="https://..." id="profile-image">
                @if (profileForm.value.imageUrl) {
                  <div class="image-preview">
                    <img [src]="profileForm.value.imageUrl" alt="Preview" (error)="onImgError($event)">
                  </div>
                }
              </div>

              <div class="form-group">
                <label class="form-label">Manzil (Yetkazib berish manzili) *</label>
                <input formControlName="address" class="form-control" placeholder="Qarshi shahar, Alisher Navoiy ko'chasi..." id="profile-address">
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Kenglik (Latitude) *</label>
                  <input formControlName="latitude" type="number" step="0.000001" class="form-control" readonly id="profile-lat">
                </div>
                <div class="form-group">
                  <label class="form-label">Uzunlik (Longitude) *</label>
                  <input formControlName="longitude" type="number" step="0.000001" class="form-control" readonly id="profile-lng">
                </div>
              </div>

              <button type="submit" class="btn btn-primary" [disabled]="saving() || profileForm.invalid" style="width: 100%; margin-top: 10px;">
                @if (saving()) { <mat-spinner diameter="16" color="accent"></mat-spinner> }
                Saqlash
              </button>
            </form>
          </div>

          <!-- Map Section -->
          <div class="map-card-profile">
            <h3 style="margin-bottom: 12px; font-weight: 700; font-size: 0.95rem;">📍 Xaritadan joylashuvni tanlang</h3>
            <div id="manager-profile-map" class="map-container"></div>
            <p class="map-hint">Markerni sudrab kerakli koordinataga qo'ying, manzil avtomatik aniqlanadi.</p>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .manager-profile { max-width: 1100px; margin: 0 auto; }

    .profile-layout {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 28px;
    }

    .form-card-profile, .map-card-profile {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      padding: 24px;
    }

    .image-preview {
      margin-top: 12px;
      border-radius: var(--radius);
      overflow: hidden;
      height: 140px;
      border: 1px solid var(--border);
    }
    .image-preview img { width: 100%; height: 100%; object-fit: cover; }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }

    .map-container {
      width: 100%;
      height: 350px;
      border-radius: var(--radius-lg);
      overflow: hidden;
      border: 1px solid var(--border);
      background: var(--bg-card2);
    }

    .map-hint { font-size: 0.75rem; color: var(--text-muted); margin-top: 10px; line-height: 1.4; }

    @media (max-width: 820px) {
      .profile-layout { grid-template-columns: 1fr; }
    }
  `]
})
export class ManagerProfileComponent implements OnInit {
  restaurant = signal<Restaurant | null>(null);
  loading = signal(true);
  saving = signal(false);
  profileForm!: FormGroup;

  private map: any;
  private placemark: any;

  constructor(
    private fb: FormBuilder,
    private orderService: OrderService,
    private snack: MatSnackBar,
    private ngZone: NgZone
  ) {}

  ngOnInit(): void {
    this.orderService.getManagerRestaurant().subscribe({
      next: (data) => {
        this.restaurant.set(data);
        this.initForm(data);
        this.loading.set(false);
        setTimeout(() => this.initMap(data), 200);
      },
      error: () => this.loading.set(false)
    });
  }

  private initForm(data: Restaurant): void {
    this.profileForm = this.fb.group({
      name: [data.name, Validators.required],
      imageUrl: [data.imageUrl || ''],
      address: [data.address || '', Validators.required],
      latitude: [data.latitude || 38.866127, Validators.required],
      longitude: [data.longitude || 65.816309, Validators.required]
    });
  }

  private initMap(data: Restaurant): void {
    const ymaps = (window as any).ymaps;
    if (!ymaps) return;

    ymaps.ready(() => {
      const lat = data.latitude || 38.866127;
      const lng = data.longitude || 65.816309;

      this.map = new ymaps.Map('manager-profile-map', {
        center: [lat, lng],
        zoom: 14,
        controls: ['zoomControl']
      });

      this.placemark = new ymaps.Placemark([lat, lng], {
        balloonContent: data.name
      }, {
        preset: 'islands#redDotIconWithCaption',
        draggable: true
      });

      this.map.geoObjects.add(this.placemark);

      // Handle marker dragend
      this.placemark.events.add('dragend', () => {
        const coords = this.placemark.geometry.getCoordinates();
        this.ngZone.run(() => {
          this.profileForm.patchValue({
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
          this.profileForm.patchValue({
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
            this.profileForm.patchValue({ address: data.display_name });
          });
        }
      })
      .catch(err => console.error('Geocoding error:', err));
  }

  saveProfile(): void {
    if (this.profileForm.invalid) return;
    this.saving.set(true);

    this.orderService.updateManagerRestaurant(this.profileForm.value).subscribe({
      next: () => {
        this.saving.set(false);
        this.snack.open("✅ Restoran ma'lumotlari muvaffaqiyatli yangilandi!", "", { duration: 3000 });
      },
      error: (err) => {
        this.saving.set(false);
        this.snack.open(`❌ Xatolik: ${err.error?.message || "yangilab bo'lmadi"}`, "", { duration: 3000 });
      }
    });
  }

  onImgError(e: Event): void {
    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=500';
  }
}
