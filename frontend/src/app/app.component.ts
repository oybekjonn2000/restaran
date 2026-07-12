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
