import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  authService.resetIdleTimerExternally();

  const token = authService.getToken();
  const headers: { [key: string]: string } = {};
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (req.url.includes('/api/manager/')) {
    const activeRestId = localStorage.getItem('manager_active_restaurant_id');
    if (activeRestId) {
      headers['X-Restaurant-Id'] = activeRestId;
    }
  }

  if (Object.keys(headers).length > 0) {
    req = req.clone({
      setHeaders: headers
    });
  }

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 401 && !req.url.includes('/api/auth/login') && !req.url.includes('/api/auth/register')) {
        authService.logout();
      }
      return throwError(() => err);
    })
  );
};
