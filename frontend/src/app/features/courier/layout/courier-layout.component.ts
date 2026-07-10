import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-courier-layout',
  standalone: true,
  imports: [RouterOutlet],
  template: `
    <div class="courier-shell">
      <router-outlet />
    </div>
  `,
  styles: [`
    .courier-shell {
      height: 100vh;
      overflow: hidden;
      background: #f5f5f7;
    }
  `]
})
export class CourierLayoutComponent {}
