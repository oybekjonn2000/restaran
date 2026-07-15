import { Component, OnInit } from '@angular/core';
import { RouterOutlet, Router } from '@angular/router';
import { AuthService } from './core/services/auth.service';
import { redirectByRole } from './core/guards/auth.guard';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `<router-outlet />`
})
export class AppComponent implements OnInit {
  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    // Agar localStorage'da token bor bo'lsa — backend'dan haqiqiy foydalanuvchi ma'lumotlarini olish
    if (this.authService.isLoggedIn()) {
      this.authService.fetchMe().subscribe({
        next: (res) => {
          // Session ma'lumotlari yangilandi — roli o'zgargan bo'lsa, to'g'ri sahifaga yo'naltiriladi
          const currentPath = this.router.url;
          const role = res.role;
          if (role === 'CLIENT' && !currentPath.startsWith('/client')) {
            this.router.navigate(['/client/restaurants']);
          } else if (role === 'ADMIN' && !currentPath.startsWith('/admin')) {
            this.router.navigate(['/admin/dashboard']);
          } else if (role === 'COURIER' && !currentPath.startsWith('/courier')) {
            this.router.navigate(['/courier/dashboard']);
          } else if (role === 'MANAGER' && !currentPath.startsWith('/manager')) {
            this.router.navigate(['/manager/dashboard']);
          }
        },
        error: (err) => {
          // Token yaroqsiz (401) — session tozalash
          console.error('Session validatsiyasi muvaffaqiyatsiz:', err);
          this.authService.logout();
        }
      });
    }

    const tg = (window as any).Telegram?.WebApp;
    if (tg) {
      tg.ready();
      tg.expand();
      
      const initData = tg.initData;
      if (initData && !this.authService.isLoggedIn()) {
        this.authService.telegramLogin(initData).subscribe({
          next: (res) => {
            console.log('Telegram login successful:', res);
            redirectByRole(this.authService, this.router);
          },
          error: (err) => {
            console.error('Telegram login failed:', err);
          }
        });
      }
    }
  }
}
