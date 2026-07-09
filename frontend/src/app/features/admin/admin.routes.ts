import { Routes } from '@angular/router';
import { AdminLayoutComponent } from './layout/admin-layout.component';

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    component: AdminLayoutComponent,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () => import('./dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent)
      },
      {
        path: 'orders',
        loadComponent: () => import('./orders/admin-orders.component').then(m => m.AdminOrdersComponent)
      },
      {
        path: 'menu',
        loadComponent: () => import('./menu/admin-menu.component').then(m => m.AdminMenuComponent)
      },
      {
        path: 'restaurants',
        loadComponent: () => import('./restaurants/admin-restaurants.component').then(m => m.AdminRestaurantsComponent)
      },
      {
        path: 'couriers',
        loadComponent: () => import('./couriers/admin-couriers.component').then(m => m.AdminCouriersComponent)
      },
      {
        path: 'clients',
        loadComponent: () => import('./clients/admin-clients.component').then(m => m.AdminClientsComponent)
      }
    ]
  }
];
