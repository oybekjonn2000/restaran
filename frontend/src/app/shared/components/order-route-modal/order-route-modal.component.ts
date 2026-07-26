import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { OrderService } from '../../../core/services/order.service';

declare var ymaps: any;

@Component({
  selector: 'app-order-route-modal',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule],
  template: `
    @if (show) {
      <div class="modal-overlay animate-in" (click)="onClose()">
        <div class="route-modal-card animate-pop" [class.fullscreen]="isFullScreen" (click)="$event.stopPropagation()">
          
          <!-- MODAL HEADER -->
          <div class="modal-header-bar">
            <div class="header-title">
              <h3>🗺️ Buyurtma marshruti (Buyurtma #{{ orderId }})</h3>
              <span class="status-tag">YAKUNLANGAN MARSHRUT</span>
            </div>
            
            <div class="header-actions">
              <button class="action-btn toggle-fs" (click)="toggleFullScreen()">
                {{ isFullScreen ? '🗗 Oyna rejimida' : '🔲 Toʻliq ekran' }}
              </button>
              <button class="action-btn close-btn" (click)="onClose()" title="Yopish">✕</button>
            </div>
          </div>

          <!-- MODAL BODY -->
          <div class="modal-body-content">
            
            @if (loading) {
              <div class="loading-box">
                <mat-spinner diameter="40" color="accent"></mat-spinner>
                <p>Marshrut ma'lumotlari yuklanmoqda...</p>
              </div>
            } @else if (errorMsg) {
              <div class="error-box">
                ⚠️ {{ errorMsg }}
              </div>
            } @else {
              <!-- STATISTICS BAR -->
              <div class="stats-summary-bar">
                <div class="stat-card">
                  <span class="stat-icon">🏍️</span>
                  <div class="stat-text">
                    <span class="stat-label">Kuryer → Restoran</span>
                    <strong class="stat-val">{{ (routeData?.pickupDistanceKm || 0) | number:'1.1-2' }} km</strong>
                  </div>
                </div>

                <div class="stat-card">
                  <span class="stat-icon">🏪</span>
                  <div class="stat-text">
                    <span class="stat-label">Restoran → Mijoz</span>
                    <strong class="stat-val">{{ (routeData?.deliveryDistanceKm || 0) | number:'1.1-2' }} km</strong>
                  </div>
                </div>

                <div class="stat-card highlight">
                  <span class="stat-icon">📍</span>
                  <div class="stat-text">
                    <span class="stat-label">Jami Masofa</span>
                    <strong class="stat-val text-orange">{{ (routeData?.totalDistanceKm || 0) | number:'1.1-2' }} km</strong>
                  </div>
                </div>

                <div class="stat-card">
                  <span class="stat-icon">⏱</span>
                  <div class="stat-text">
                    <span class="stat-label">Umumiy Vaqt</span>
                    <strong class="stat-val">{{ routeData?.totalTimeMinutes || 0 }} daqiqa</strong>
                  </div>
                </div>

                <div class="stat-card">
                  <span class="stat-icon">🚴</span>
                  <div class="stat-text">
                    <span class="stat-label">O'rtacha Tezlik</span>
                    <strong class="stat-val">{{ routeData?.averageSpeedKmh || 0 }} km/soat</strong>
                  </div>
                </div>
              </div>

              <!-- MAP CONTAINER -->
              <div class="map-container-wrap">
                <div #mapElement class="route-y-map"></div>
                
                <!-- MAP LEGEND FLOATING BOX -->
                <div class="map-legend-box">
                  <div class="legend-item"><span class="legend-dot green"></span> Kuryer boshlagan joy</div>
                  <div class="legend-item"><span class="legend-dot orange"></span> Restoran</div>
                  <div class="legend-item"><span class="legend-dot red"></span> Mijoz manzili</div>
                  <div class="legend-item"><span class="legend-line blue"></span> GPS Marshrut</div>
                </div>
              </div>
            }
          </div>

        </div>
      </div>
    }
  `,
  styles: [`
    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.75);
      backdrop-filter: blur(6px);
      z-index: 99999;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }

    .route-modal-card {
      background: #0f172a;
      border: 1px solid #334155;
      border-radius: 20px;
      width: 100%;
      max-width: 960px;
      display: flex;
      flex-direction: column;
      max-height: 90vh;
      overflow: hidden;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6);
      transition: all 0.3s ease;
    }

    .route-modal-card.fullscreen {
      max-width: 100vw;
      height: 100vh;
      max-height: 100vh;
      border-radius: 0;
    }

    .modal-header-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 24px;
      background: #1e293b;
      border-bottom: 1px solid #334155;
    }

    .header-title h3 {
      font-size: 1.15rem;
      font-weight: 800;
      color: #fff;
      margin: 0 0 4px 0;
    }

    .status-tag {
      font-size: 0.68rem;
      font-weight: 800;
      color: #10b981;
      background: rgba(16, 185, 129, 0.12);
      border: 1px solid rgba(16, 185, 129, 0.3);
      padding: 2px 8px;
      border-radius: 6px;
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .action-btn {
      background: #334155;
      color: #f1f5f9;
      border: 1px solid rgba(255, 255, 255, 0.1);
      padding: 8px 14px;
      border-radius: 10px;
      font-size: 0.82rem;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s;
    }

    .action-btn:hover {
      background: #475569;
      color: #fff;
    }

    .close-btn {
      padding: 8px 12px;
      font-size: 1rem;
    }
    .close-btn:hover {
      background: #ef4444;
      border-color: #ef4444;
    }

    .modal-body-content {
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 16px;
      flex: 1;
      overflow-y: auto;
    }

    .loading-box, .error-box {
      padding: 60px 20px;
      text-align: center;
      color: #94a3b8;
    }

    /* STATS SUMMARY BAR */
    .stats-summary-bar {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
      gap: 12px;
    }

    .stat-card {
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 14px;
      padding: 10px 14px;
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .stat-card.highlight {
      border-color: rgba(249, 115, 22, 0.4);
      background: rgba(249, 115, 22, 0.06);
    }

    .stat-icon {
      font-size: 1.3rem;
    }

    .stat-text {
      display: flex;
      flex-direction: column;
    }

    .stat-label {
      font-size: 0.72rem;
      color: #94a3b8;
      font-weight: 600;
    }

    .stat-val {
      font-size: 0.95rem;
      font-weight: 800;
      color: #fff;
    }

    .text-orange { color: #f97316; }

    /* MAP CONTAINER */
    .map-container-wrap {
      position: relative;
      flex: 1;
      min-height: 420px;
      border-radius: 16px;
      overflow: hidden;
      border: 1px solid #334155;
    }

    .route-y-map {
      width: 100%;
      height: 100%;
      min-height: 420px;
    }

    .map-legend-box {
      position: absolute;
      top: 12px;
      right: 12px;
      background: rgba(15, 23, 42, 0.85);
      backdrop-filter: blur(8px);
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 12px;
      padding: 10px 14px;
      z-index: 100;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.76rem;
      font-weight: 600;
      color: #f1f5f9;
    }

    .legend-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
    }
    .legend-dot.green  { background: #10b981; }
    .legend-dot.orange { background: #f59e0b; }
    .legend-dot.red    { background: #ef4444; }
    .legend-line.blue  { width: 14px; height: 3px; background: #3b82f6; border-radius: 2px; }

    @media (max-width: 600px) {
      .stats-summary-bar {
        grid-template-columns: 1fr 1fr;
      }
      .map-container-wrap {
        min-height: 300px;
      }
    }
  `]
})
export class OrderRouteModalComponent implements OnInit, OnChanges {
  @Input() orderId: number | null = null;
  @Input() show: boolean = false;
  @Output() close = new EventEmitter<void>();

  @ViewChild('mapElement') mapElement!: ElementRef;

  loading = true;
  errorMsg = '';
  routeData: any = null;
  isFullScreen = false;
  private yMap: any = null;

  constructor(private orderService: OrderService) {}

  ngOnInit(): void {
    if (this.show && this.orderId) {
      this.loadRouteHistory();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['show'] && this.show && this.orderId) {
      this.loadRouteHistory();
    }
  }

  toggleFullScreen(): void {
    this.isFullScreen = !this.isFullScreen;
    setTimeout(() => {
      if (this.yMap) {
        this.yMap.container.fitToViewport();
      }
    }, 200);
  }

  onClose(): void {
    this.close.emit();
  }

  loadRouteHistory(): void {
    if (!this.orderId) return;
    this.loading = true;
    this.errorMsg = '';

    this.orderService.getOrderRouteHistory(this.orderId).subscribe({
      next: (data) => {
        this.routeData = data;
        this.loading = false;
        setTimeout(() => this.initMap(), 100);
      },
      error: (err) => {
        this.loading = false;
        this.errorMsg = err.error?.message || 'Marshrut ma\'lumotlarini yuklab bo\'lmadi.';
      }
    });
  }

  private initMap(): void {
    if (!this.mapElement || !this.routeData) return;

    if (typeof ymaps === 'undefined') {
      this.loadYandexScript(() => this.createYandexMap());
    } else {
      ymaps.ready(() => this.createYandexMap());
    }
  }

  private loadYandexScript(callback: () => void): void {
    if (document.getElementById('yandex-maps-script')) {
      if (typeof ymaps !== 'undefined') {
        ymaps.ready(callback);
      }
      return;
    }
    const script = document.createElement('script');
    script.id = 'yandex-maps-script';
    script.src = 'https://api-maps.yandex.ru/2.1/?lang=uz_UZ&load=package.full';
    script.type = 'text/javascript';
    script.onload = () => {
      ymaps.ready(callback);
    };
    document.head.appendChild(script);
  }

  private createYandexMap(): void {
    if (!this.mapElement) return;

    const el = this.mapElement.nativeElement;
    el.innerHTML = '';

    const courierStart = this.routeData.courierStartLocation;
    const rest         = this.routeData.restaurantLocation;
    const cust         = this.routeData.customerLocation;

    const centerLat = rest?.latitude  || 38.866127;
    const centerLng = rest?.longitude || 65.816309;

    const map = new ymaps.Map(el, {
      center: [centerLat, centerLng],
      zoom: 13,
      controls: ['zoomControl', 'fullscreenControl']
    });
    this.yMap = map;

    // ── STEP 1: Add custom markers IMMEDIATELY (always visible) ─────────────
    if (courierStart?.latitude && courierStart?.longitude) {
      map.geoObjects.add(new ymaps.Placemark(
        [courierStart.latitude, courierStart.longitude],
        {
          balloonContentHeader: '📍 Kuryer boshlagan joy',
          balloonContentBody:   'Buyurtma qabul qilingan joy'
        },
        { preset: 'islands#greenDotIconWithCaption', iconCaption: 'Kuryer' }
      ));
    }

    if (rest?.latitude && rest?.longitude) {
      map.geoObjects.add(new ymaps.Placemark(
        [rest.latitude, rest.longitude],
        {
          balloonContentHeader: `🏪 ${rest.address || 'Restoran'}`,
          balloonContentBody:   'Taomlar olingan joy'
        },
        { preset: 'islands#orangeShoppingIcon', iconCaption: rest.address || 'Restoran' }
      ));
    }

    if (cust?.latitude && cust?.longitude) {
      map.geoObjects.add(new ymaps.Placemark(
        [cust.latitude, cust.longitude],
        {
          balloonContentHeader: '🏠 Mijoz manzili',
          balloonContentBody:   cust.address || 'Yetkazilgan manzil'
        },
        { preset: 'islands#redHomeIcon', iconCaption: 'Mijoz' }
      ));
    }

    // ── STEP 2: Build reference points list ─────────────────────────────────
    const pts: Array<number[]> = [];
    if (courierStart?.latitude && courierStart?.longitude) {
      pts.push([courierStart.latitude, courierStart.longitude]);
    }
    if (rest?.latitude && rest?.longitude) {
      pts.push([rest.latitude, rest.longitude]);
    }
    if (cust?.latitude && cust?.longitude) {
      pts.push([cust.latitude, cust.longitude]);
    }

    if (pts.length < 2) {
      map.setBounds(map.geoObjects.getBounds(), { checkZoomRange: true, zoomMargin: 60 });
      return;
    }

    // ── STEP 3: Draw real-road route via MultiRoute ──────────────────────────
    const multiRoute = new ymaps.multiRouter.MultiRoute(
      {
        referencePoints: pts,
        params: { routingMode: 'auto' }
      },
      {
        routeActiveStrokeColor:   '#3b82f6',
        routeActiveStrokeWidth:   7,
        routeActiveStrokeOpacity: 0.9,
        routeStrokeColor:         '#1e40af',
        routeStrokeWidth:         5,
        wayPointVisible:          false,   // hide default A/B/C Yandex pins
        boundsAutoApply:          true,
        zoomMargin:               60
      }
    );

    map.geoObjects.add(multiRoute);
  }
}
