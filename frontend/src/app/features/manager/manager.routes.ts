import { Routes } from '@angular/router';
import { ManagerLayoutComponent } from './layout/manager-layout.component';

export const MANAGER_ROUTES: Routes = [
  {
    path: '',
    component: ManagerLayoutComponent,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () => import('./dashboard/manager-dashboard.component').then(m => m.ManagerDashboardComponent)
      },
      {
        path: 'menu',
        loadComponent: () => import('./menu/manager-menu.component').then(m => m.ManagerMenuComponent)
      },
      {
        path: 'profile',
        loadComponent: () => import('./profile/manager-profile.component').then(m => m.ManagerProfileComponent)
      }
    ]
  }
];
