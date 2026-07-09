import { Routes } from '@angular/router';
import { ClientLayoutComponent } from './layout/client-layout.component';
import { authGuard } from '../../core/guards/auth.guard';

export const CLIENT_ROUTES: Routes = [
  {
    path: '',
    component: ClientLayoutComponent,
    children: [
      { path: '', redirectTo: 'restaurants', pathMatch: 'full' },
      {
        path: 'restaurants',
        loadComponent: () => import('./restaurants/restaurants.component').then(m => m.RestaurantsComponent)
      },
      {
        path: 'menu/:restaurantId',
        loadComponent: () => import('./menu/menu.component').then(m => m.MenuComponent)
      },
      {
        path: 'orders',
        canActivate: [authGuard],
        data: { roles: ['CLIENT'] },
        loadComponent: () => import('./orders/orders.component').then(m => m.ClientOrdersComponent)
      }
    ]
  }
];
