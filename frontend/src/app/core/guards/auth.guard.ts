import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isLoggedIn()) {
    router.navigate(['/auth/login']);
    return false;
  }

  const allowedRoles: string[] = route.data?.['roles'] ?? [];
  if (allowedRoles.length > 0 && !allowedRoles.includes(auth.role()!)) {
    router.navigate(['/auth/login']);
    return false;
  }

  return true;
};

export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isLoggedIn()) {
    redirectByRole(auth, router);
    return false;
  }
  return true;
};

export function redirectByRole(auth: AuthService, router: Router): void {
  const role = auth.role();
  if (role === 'CLIENT') router.navigate(['/client/restaurants']);
  else if (role === 'COURIER') router.navigate(['/courier/dashboard']);
  else if (role === 'ADMIN') router.navigate(['/admin/dashboard']);
  else if (role === 'MANAGER') router.navigate(['/manager/dashboard']);
  else router.navigate(['/auth/login']);
}
