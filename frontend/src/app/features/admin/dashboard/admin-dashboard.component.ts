import { Component, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RouterLink } from '@angular/router';
import { OrderService } from '../../../core/services/order.service';
import { Order } from '../../../core/models/order.model';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule, RouterLink],
  template: `
    <div class="dashboard-page animate-in">
      
      <!-- HEADER -->
      <div class="dashboard-header">
        <div class="header-left">
          <h1 class="page-title">📊 Admin Panel</h1>
          <p class="page-subtitle">Tizim holati va umumiy statistika</p>
        </div>
        <div class="header-right">
          <span class="date-chip">📅 Bugun: {{ currentDate | date:'dd-MMMM, yyyy' }}</span>
        </div>
      </div>

      <!-- MAIN KEY METRICS GRID -->
      <div class="metrics-grid">
        <!-- Metric Card 1: Revenue -->
        <div class="metric-card bg-gradient-orange">
          <div class="metric-header">
            <span class="metric-label">UMUMIY AYLANMA</span>
            <span class="metric-icon-wrap">💰</span>
          </div>
          <div class="metric-value">{{ totalRevenue() | number:'1.0-0' }} so'm</div>
          <div class="metric-footer">Yetkazilgan buyurtmalardan tushum</div>
        </div>

        <!-- Metric Card 2: Active Couriers -->
        <div class="metric-card bg-gradient-blue">
          <div class="metric-header">
            <span class="metric-label">KURYERLAR</span>
            <span class="metric-icon-wrap">🏍️</span>
          </div>
          <div class="metric-value">{{ activeCouriersCount() }} ta</div>
          <div class="metric-footer">Ro'yxatdan o'tgan yetkazib beruvchilar</div>
        </div>

        <!-- Metric Card 3: Success Rate -->
        <div class="metric-card bg-gradient-green">
          <div class="metric-header">
            <span class="metric-label">YETKAZIB BERISH SAMARADORLIGI</span>
            <span class="metric-icon-wrap">📈</span>
          </div>
          <div class="metric-value">{{ deliverySuccessRate() }}%</div>
          <div class="metric-footer">Muvaffaqiyatli topshirilgan buyurtmalar</div>
        </div>
      </div>

      <!-- PAYMENT STATS GRID -->
      <div class="metrics-grid" style="margin-top: 24px; margin-bottom: 24px;">
        <!-- Card Stats -->
        <div class="metric-card" style="border-left: 4px solid #10b981; background: var(--bg-card);">
          <div class="metric-header">
            <span class="metric-label" style="color: #10b981; font-weight: 700;">💳 KARTA ORQALI TO'LOVLAR</span>
            <span class="metric-icon-wrap">💳</span>
          </div>
          <div class="metric-value">{{ cardRevenue() | number:'1.0-0' }} so'm</div>
          <div class="metric-footer" style="color: var(--text-muted);">{{ cardCount() }} ta buyurtma</div>
        </div>

        <!-- Cash Stats -->
        <div class="metric-card" style="border-left: 4px solid #f59e0b; background: var(--bg-card);">
          <div class="metric-header">
            <span class="metric-label" style="color: #f59e0b; font-weight: 700;">💵 NAQD PULDA TO'LOVLAR</span>
            <span class="metric-icon-wrap">💵</span>
          </div>
          <div class="metric-value">{{ cashRevenue() | number:'1.0-0' }} so'm</div>
          <div class="metric-footer" style="color: var(--text-muted);">{{ cashCount() }} ta buyurtma</div>
        </div>
      </div>

      <!-- ORDER STATUS STATS CONTAINER -->
      <div class="status-section">
        <div class="status-header">
          <h2 class="section-title">📦 Buyurtmalar Holati</h2>
          <span class="total-orders-badge">Jami: {{ stats()['total'] ?? 0 }} ta buyurtma</span>
        </div>

        <!-- Progress Bar Segment Grid -->
        <div class="progress-bar-container">
          <div class="segment-bar">
            <div class="segment bg-pending" [style.width.%]="getStatusPercent('pending')" title="Kutilmoqda"></div>
            <div class="segment bg-preparing" [style.width.%]="getStatusPercent('preparing')" title="Tayyorlanmoqda"></div>
            <div class="segment bg-delivering" [style.width.%]="getStatusPercent('delivering')" title="Yetkazilmoqda"></div>
            <div class="segment bg-delivered" [style.width.%]="getStatusPercent('delivered')" title="Yetkazildi"></div>
            <div class="segment bg-canceled" [style.width.%]="getStatusPercent('canceled')" title="Bekor qilingan"></div>
          </div>
          
          <div class="segment-legend">
            <div class="legend-item"><span class="legend-dot bg-pending"></span> Kutilmoqda ({{ stats()['pending'] ?? 0 }})</div>
            <div class="legend-item"><span class="legend-dot bg-preparing"></span> Tayyorlanmoqda ({{ stats()['preparing'] ?? 0 }})</div>
            <div class="legend-item"><span class="legend-dot bg-delivering"></span> Yo'lda ({{ stats()['delivering'] ?? 0 }})</div>
            <div class="legend-item"><span class="legend-dot bg-delivered"></span> Yetkazildi ({{ stats()['delivered'] ?? 0 }})</div>
            <div class="legend-item"><span class="legend-dot bg-canceled"></span> Bekor qilindi ({{ stats()['canceled'] ?? 0 }})</div>
          </div>
        </div>
      </div>

      <!-- RESTAURANT SALES BREAKDOWN -->
      <div class="restaurant-stats-section animate-in">
        <div class="status-header">
          <h2 class="section-title">🏪 Restoranlar bo'yicha buyurtmalar ulushi va aylanma</h2>
          <span class="total-orders-badge">Hamkorlar: {{ restaurantStats().length }} ta</span>
        </div>
        
        <div class="restaurant-grid">
          @for (rest of restaurantStats(); track rest.name) {
            <div class="restaurant-stat-card">
              <div class="rest-info-row">
                <span class="rest-name">🏪 {{ rest.name }}</span>
                <span class="rest-count">{{ rest.count }} ta buyurtma</span>
              </div>
              
              <div class="rest-progress-bar">
                <div class="rest-progress-fill" [style.width.%]="rest.percent"></div>
              </div>
              
              <div class="rest-revenue-row">
                <span class="rest-percent-label">{{ rest.percent }}% ulush</span>
                <span class="rest-revenue">Aylanma: {{ rest.revenue | number:'1.0-0' }} so'm</span>
              </div>
            </div>
          } @empty {
            <div class="empty-list-state">
              🏪 Hozircha restoranlar bo'yicha statistika mavjud emas.
            </div>
          }
        </div>
      </div>

      <!-- MAIN ROW WITH DETAILS -->
      <div class="main-dashboard-row">
        
        <!-- LEFT COLUMN: RECENT ACTIVITIES -->
        <div class="activity-column">
          <div class="card-header">
            <h3 class="card-title">🔔 So'nggi buyurtmalar</h3>
            <a routerLink="/admin/orders" class="view-all-link">Barchasi →</a>
          </div>

          <div class="orders-list">
            @for (order of recentOrders(); track order.id) {
              <div class="order-item-row" [routerLink]="['/admin/orders']">
                <div class="order-id-block">
                  <span class="order-tag">#{{ order.id }}</span>
                  <span class="order-time">{{ order.createdAt | date:'HH:mm' }}</span>
                </div>
                <div class="order-client-info">
                  <div class="client-name">{{ order.user?.name || 'Mijoz' }}</div>
                  <div class="order-items-count">{{ order.items?.length || 0 }} ta taom</div>
                </div>
                <div class="order-price-status">
                  <div class="order-price">{{ (order.totalPrice + (order.deliveryFee || 0)) | number:'1.0-0' }} so'm</div>
                  <span class="status-dot-badge" [class]="'badge-' + order.status.toLowerCase()">
                    {{ getStatusLabel(order.status) }}
                  </span>
                </div>
              </div>
            } @empty {
              <div class="empty-list-state">
                📭 Hozircha buyurtmalar mavjud emas
              </div>
            }
          </div>
        </div>

        <!-- RIGHT COLUMN: QUICK ACTION UTILITIES -->
        <div class="actions-column">
          <h3 class="card-title">⚡ Tezkor amallar</h3>
          
          <div class="quick-links-grid">
            <a routerLink="/admin/orders" class="action-card-premium" id="admin-quick-orders">
              <div class="card-accent bg-orange"></div>
              <div class="card-body">
                <span class="card-icon">📋</span>
                <div class="card-text">
                  <span class="action-title">Buyurtmalar</span>
                  <span class="action-desc">Holatlarni boshqarish va taqsimlash</span>
                </div>
              </div>
            </a>

            <a routerLink="/admin/menu" class="action-card-premium" id="admin-quick-menu">
              <div class="card-accent bg-purple"></div>
              <div class="card-body">
                <span class="card-icon">🍕</span>
                <div class="card-text">
                  <span class="action-title">Taomlar menyusi</span>
                  <span class="action-desc">Kategoriyalar va menyuni tahrirlash</span>
                </div>
              </div>
            </a>

            <a routerLink="/admin/couriers" class="action-card-premium" id="admin-quick-couriers">
              <div class="card-accent bg-blue"></div>
              <div class="card-body">
                <span class="card-icon">🏍️</span>
                <div class="card-text">
                  <span class="action-title">Kuryerlar</span>
                  <span class="action-desc">Ro'yxatga olish va hisobotlar</span>
                </div>
              </div>
            </a>

            <a routerLink="/admin/slots" class="action-card-premium" id="admin-quick-slots">
              <div class="card-accent bg-green"></div>
              <div class="card-body">
                <span class="card-icon">⏰</span>
                <div class="card-text">
                  <span class="action-title">Smenalar</span>
                  <span class="action-desc">Kuryer smenalar jadvalini yaratish</span>
                </div>
              </div>
            </a>
          </div>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .dashboard-page {
      max-width: 1100px;
      margin: 0 auto;
      padding: 10px;
      color: var(--text);
    }

    /* HEADER */
    .dashboard-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
      border-bottom: 1px solid var(--border);
      padding-bottom: 16px;
    }
    .page-title {
      font-size: 1.8rem;
      font-weight: 800;
      margin: 0;
      background: linear-gradient(135deg, #fff, var(--text-muted));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .page-subtitle {
      color: var(--text-muted);
      margin: 4px 0 0;
      font-size: 0.9rem;
    }
    .date-chip {
      background: var(--bg-card);
      border: 1px solid var(--border);
      padding: 8px 16px;
      border-radius: 20px;
      font-size: 0.85rem;
      color: var(--text-muted);
      font-weight: 500;
    }

    /* METRIC CARDS */
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 20px;
      margin-bottom: 28px;
    }
    .metric-card {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 24px;
      position: relative;
      overflow: hidden;
      box-shadow: var(--shadow);
    }
    .bg-gradient-orange {
      border-left: 4px solid #f97316;
    }
    .bg-gradient-blue {
      border-left: 4px solid #3b82f6;
    }
    .bg-gradient-green {
      border-left: 4px solid #10b981;
    }
    .metric-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }
    .metric-label {
      font-size: 0.72rem;
      font-weight: 700;
      color: var(--text-muted);
      letter-spacing: 0.08em;
    }
    .metric-icon-wrap {
      font-size: 1.4rem;
    }
    .metric-value {
      font-size: 1.8rem;
      font-weight: 800;
      margin-bottom: 6px;
    }
    .metric-footer {
      font-size: 0.75rem;
      color: var(--text-muted);
    }

    /* STATUS PROGRESS SECTION */
    .status-section {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 20px;
      margin-bottom: 28px;
    }
    .status-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }
    .section-title {
      font-size: 1.1rem;
      font-weight: 800;
      margin: 0;
    }
    .total-orders-badge {
      font-size: 0.8rem;
      background: var(--border);
      padding: 4px 10px;
      border-radius: 12px;
      font-weight: 600;
    }
    .progress-bar-container {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .segment-bar {
      display: flex;
      height: 12px;
      border-radius: 6px;
      overflow: hidden;
      background: var(--border);
    }
    .segment {
      height: 100%;
      transition: width 0.4s ease;
    }
    .bg-pending { background-color: #f59e0b; }
    .bg-preparing { background-color: #8b5cf6; }
    .bg-delivering { background-color: #f97316; }
    .bg-delivered { background-color: #10b981; }
    .bg-canceled { background-color: #ef4444; }

    .segment-legend {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
      font-size: 0.78rem;
      color: var(--text-muted);
    }
    .legend-item {
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .legend-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      display: inline-block;
    }

    /* RESTAURANT BREAKDOWN STATS */
    .restaurant-stats-section {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 20px;
      margin-bottom: 28px;
    }
    .restaurant-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 16px;
      margin-top: 16px;
    }
    .restaurant-stat-card {
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .rest-info-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .rest-name {
      font-weight: 700;
      font-size: 0.9rem;
      color: #fff;
    }
    .rest-count {
      font-size: 0.8rem;
      color: var(--text-muted);
      font-weight: 600;
    }
    .rest-progress-bar {
      height: 6px;
      background: var(--border);
      border-radius: 3px;
      overflow: hidden;
    }
    .rest-progress-fill {
      height: 100%;
      background: linear-gradient(90deg, var(--primary), #3b82f6);
      border-radius: 3px;
    }
    .rest-revenue-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.75rem;
    }
    .rest-percent-label {
      color: var(--text-muted);
      font-weight: 600;
    }
    .rest-revenue {
      color: #10b981;
      font-weight: 700;
    }

    /* MAIN CONTENT ROW */
    .main-dashboard-row {
      display: grid;
      grid-template-columns: 1.4fr 1fr;
      gap: 24px;
    }

    /* LEFT ACTIVITY COLUMN */
    .activity-column {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 20px;
      display: flex;
      flex-direction: column;
    }
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }
    .card-title {
      font-size: 1.05rem;
      font-weight: 800;
      margin: 0;
    }
    .view-all-link {
      font-size: 0.8rem;
      color: var(--primary);
      text-decoration: none;
      font-weight: 600;
    }
    .orders-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .order-item-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 14px;
      border-radius: 12px;
      background: rgba(255,255,255,0.02);
      border: 1px solid var(--border);
      transition: background 0.2s, transform 0.2s;
      cursor: pointer;
    }
    .order-item-row:hover {
      background: rgba(255,255,255,0.05);
      transform: translateX(4px);
    }
    .order-id-block {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .order-tag {
      font-weight: 700;
      font-size: 0.9rem;
    }
    .order-time {
      font-size: 0.72rem;
      color: var(--text-muted);
    }
    .order-client-info {
      flex: 1;
      margin-left: 20px;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .client-name {
      font-size: 0.88rem;
      font-weight: 600;
    }
    .order-items-count {
      font-size: 0.75rem;
      color: var(--text-muted);
    }
    .order-price-status {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 4px;
    }
    .order-price {
      font-size: 0.88rem;
      font-weight: 700;
    }
    .status-dot-badge {
      font-size: 0.68rem;
      padding: 2px 8px;
      border-radius: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.02em;
    }

    /* BADGE COLORS */
    .badge-pending { background-color: rgba(245,158,11,0.15); color: #f59e0b; }
    .badge-preparing { background-color: rgba(139,92,246,0.15); color: #8b5cf6; }
    .badge-delivering { background-color: rgba(249,115,22,0.15); color: #f97316; }
    .badge-delivered { background-color: rgba(16,185,129,0.15); color: #10b981; }
    .badge-canceled { background-color: rgba(239,68,68,0.15); color: #ef4444; }

    .empty-list-state {
      padding: 40px;
      text-align: center;
      color: var(--text-muted);
      font-size: 0.9rem;
    }

    /* RIGHT ACTIONS COLUMN */
    .actions-column {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .quick-links-grid {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .action-card-premium {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: 14px;
      overflow: hidden;
      display: flex;
      text-decoration: none;
      transition: border-color 0.2s, transform 0.2s, box-shadow 0.2s;
      position: relative;
    }
    .action-card-premium:hover {
      border-color: var(--primary);
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(75, 107, 251, 0.12);
    }
    .card-accent {
      width: 4px;
      align-self: stretch;
    }
    .card-accent.bg-orange { background-color: #f97316; }
    .card-accent.bg-purple { background-color: #8b5cf6; }
    .card-accent.bg-blue { background-color: #3b82f6; }
    .card-accent.bg-green { background-color: #10b981; }

    .card-body {
      padding: 16px;
      display: flex;
      align-items: center;
      gap: 16px;
      flex: 1;
    }
    .card-icon {
      font-size: 1.6rem;
    }
    .card-text {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .action-title {
      font-size: 0.9rem;
      font-weight: 700;
      color: var(--text);
    }
    .action-desc {
      font-size: 0.75rem;
      color: var(--text-muted);
    }

    /* Responsive scaling */
    @media (max-width: 768px) {
      .main-dashboard-row {
        grid-template-columns: 1fr;
      }
      .dashboard-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 12px;
      }
    }
  `]
})
export class AdminDashboardComponent implements OnInit, OnDestroy {
  stats = signal<Record<string, number>>({});
  recentOrders = signal<Order[]>([]);
  totalRevenue = signal<number>(0);
  cardRevenue = signal<number>(0);
  cardCount = signal<number>(0);
  cashRevenue = signal<number>(0);
  cashCount = signal<number>(0);
  activeCouriersCount = signal<number>(0);
  restaurantStats = signal<{ name: string; count: number; revenue: number; percent: number }[]>([]);
  currentDate = new Date();
  
  private pollInterval: any;

  // Calculates percentage of successfully delivered orders compared to total orders
  deliverySuccessRate = computed(() => {
    const s = this.stats();
    const total = s['total'] ?? 0;
    if (total === 0) return 0;
    const delivered = s['delivered'] ?? 0;
    return Math.round((delivered / total) * 100);
  });

  constructor(private orderService: OrderService) {}

  ngOnInit(): void {
    this.loadDashboardData();
    // Poll stats every 5 seconds to keep dashboard live
    this.pollInterval = setInterval(() => this.loadDashboardData(), 5000);
  }

  ngOnDestroy(): void {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
    }
  }

  loadDashboardData(): void {
    // 1. Fetch basic statistics
    this.orderService.getStats().subscribe({
      next: (s) => this.stats.set(s)
    });
    
    // 2. Fetch all orders to compute revenue and retrieve recent items
    this.orderService.getAllOrders().subscribe({
      next: (orders) => {
        // Sort orders by id descending
        const sorted = [...orders].sort((a, b) => b.id - a.id);
        this.recentOrders.set(sorted.slice(0, 5));
        
        // Calculate revenue only from DELIVERED orders
        const revenue = orders
          .filter(o => o.status === 'DELIVERED')
          .reduce((sum, o) => sum + (o.totalPrice + (o.deliveryFee || 0)), 0);
        this.totalRevenue.set(revenue);

        // Calculate Card vs Cash statistics from DELIVERED orders
        const cardOrders = orders.filter(o => o.status === 'DELIVERED' && o.paymentMethod === 'CARD');
        const cardRev = cardOrders.reduce((sum, o) => sum + (o.totalPrice + (o.deliveryFee || 0)), 0);
        this.cardRevenue.set(cardRev);
        this.cardCount.set(cardOrders.length);

        // Treating null paymentMethod as CASH for backward compatibility
        const cashOrders = orders.filter(o => o.status === 'DELIVERED' && o.paymentMethod !== 'CARD');
        const cashRev = cashOrders.reduce((sum, o) => sum + (o.totalPrice + (o.deliveryFee || 0)), 0);
        this.cashRevenue.set(cashRev);
        this.cashCount.set(cashOrders.length);

        // Group by restaurant and calculate stats
        const restaurantMap = new Map<string, { count: number; revenue: number }>();
        orders.forEach(o => {
          const restName = o.restaurant?.name || 'Noma\'lum restoran';
          const isDelivered = o.status === 'DELIVERED';
          if (!restaurantMap.has(restName)) {
            restaurantMap.set(restName, { count: 0, revenue: 0 });
          }
          const restData = restaurantMap.get(restName)!;
          restData.count++;
          if (isDelivered) {
            restData.revenue += (o.totalPrice + (o.deliveryFee || 0));
          }
        });
        
        const statsList = Array.from(restaurantMap.entries()).map(([name, data]) => {
          const percent = orders.length > 0 ? Math.round((data.count / orders.length) * 100) : 0;
          return {
            name,
            count: data.count,
            revenue: data.revenue,
            percent
          };
        }).sort((a, b) => b.count - a.count);
        this.restaurantStats.set(statsList);
      }
    });

    // 3. Fetch active couriers
    this.orderService.getCouriers().subscribe({
      next: (couriers) => this.activeCouriersCount.set(couriers.length)
    });
  }

  getStatusPercent(statusName: string): number {
    const total = this.stats()['total'] ?? 0;
    if (total === 0) return 0;
    const val = this.stats()[statusName] ?? 0;
    return (val / total) * 100;
  }

  getStatusLabel(status: string): string {
    const map: Record<string, string> = {
      'PENDING': 'Kutilmoqda',
      'PREPARING': 'Tayyorlanmoqda',
      'COURIER_ACCEPTED': 'Kuryer yo\'lda',
      'COURIER_AT_RESTAURANT': 'Restoranda',
      'DELIVERING': 'Yetkazilmoqda',
      'COURIER_AT_CLIENT': 'Mijozda',
      'DELIVERED': 'Yetkazildi',
      'CANCELED': 'Bekor qilindi'
    };
    return map[status] || status;
  }
}

