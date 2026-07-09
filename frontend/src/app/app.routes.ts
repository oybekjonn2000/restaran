import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  // Default redirect
  { path: '', redirectTo: '/client/restaurants', pathMatch: 'full' },

  // Auth routes
  {
    path: 'auth',
    canActivate: [guestGuard],
    loadChildren: () => import('./features/auth/auth.routes').then(m => m.AUTH_ROUTES)
  },

  // Client routes
  {
    path: 'client',
    loadChildren: () => import('./features/client/client.routes').then(m => m.CLIENT_ROUTES)
  },

  // Courier routes
  {
    path: 'courier',
    canActivate: [authGuard],
    data: { roles: ['COURIER'] },
    loadChildren: () => import('./features/courier/courier.routes').then(m => m.COURIER_ROUTES)
  },

  // Admin routes (Big Boss)
  {
    path: 'admin',
    canActivate: [authGuard],
    data: { roles: ['ADMIN'] },
    loadChildren: () => import('./features/admin/admin.routes').then(m => m.ADMIN_ROUTES)
  },

  // Manager routes (Restaurant Owner)
  {
    path: 'manager',
    canActivate: [authGuard],
    data: { roles: ['MANAGER'] },
    loadChildren: () => import('./features/manager/manager.routes').then(m => m.MANAGER_ROUTES)
  },

  // Wildcard
  { path: '**', redirectTo: '/client/restaurants' }
];
