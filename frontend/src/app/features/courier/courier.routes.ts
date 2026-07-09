import { Routes } from '@angular/router';
import { CourierLayoutComponent } from './layout/courier-layout.component';

export const COURIER_ROUTES: Routes = [
  {
    path: '',
    component: CourierLayoutComponent,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () => import('./dashboard/courier-dashboard.component').then(m => m.CourierDashboardComponent)
      }
    ]
  }
];
