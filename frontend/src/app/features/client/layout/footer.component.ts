import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <footer class="footer-wrap" aria-labelledby="footer-heading">
      <h2 id="footer-heading" class="visually-hidden">Saytning pastki qismi (Footer)</h2>
      
      <div class="footer-container">
        <!-- 1. Logo & About -->
        <div class="footer-col about-col">
          <div class="footer-logo">
            <span class="logo-icon" aria-hidden="true">🍽️</span>
            <span class="logo-text">Mango<span class="accent-color">Food</span></span>
          </div>
          <p class="about-desc">
            Eng mazali taomlarni onlayn buyurtma qiling. Sifatli xizmat va tezkor yetkazib berish.
          </p>
          <div class="social-links" aria-label="Ijtimoiy tarmoqlar">
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" class="social-icon" aria-label="Facebook sahifamiz">
              <svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 448 512" height="18" width="18" xmlns="http://www.w3.org/2000/svg">
                <path d="M400 32H48A48 48 0 0 0 0 80v352a48 48 0 0 0 48 48h137.25V327.69h-63V256h63v-54.64c0-62.15 37-96.48 93.67-96.48 27.14 0 55.52 4.84 55.52 4.84v61h-31.27c-30.81 0-40.4 19.12-40.4 38.73V256h68.78l-11 71.69h-57.78V480H400a48 48 0 0 0 48-48V80a48 48 0 0 0-48-48z"></path>
              </svg>
            </a>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" class="social-icon" aria-label="Instagram sahifamiz">
              <svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 448 512" height="18" width="18" xmlns="http://www.w3.org/2000/svg">
                <path d="M224.1 141c-63.6 0-114.9 51.3-114.9 114.9s51.3 114.9 114.9 114.9S339 319.5 339 255.9 287.7 141 224.1 141zm0 189.6c-41.1 0-74.7-33.5-74.7-74.7s33.5-74.7 74.7-74.7 74.7 33.5 74.7 74.7-33.6 74.7-74.7 74.7zm146.4-194.3c0 14.9-12 26.8-26.8 26.8-14.9 0-26.8-12-26.8-26.8s12-26.8 26.8-26.8 26.8 12 26.8 26.8zm76.1 27.2c-1.7-35.9-9.9-67.7-36.2-93.9-26.2-26.2-58-34.4-93.9-36.2-37-2.1-147.9-2.1-184.9 0-35.8 1.7-67.6 9.9-93.9 36.1s-34.4 58-36.2 93.9c-2.1 37-2.1 147.9 0 184.9 1.7 35.8 9.9 67.6 36.2 93.9s58 34.4 93.9 36.2c37 2.1 147.9 2.1 184.9 0 35.9-1.7 67.7-9.9 93.9-36.2 26.2-26.2 34.4-58 36.2-93.9 2.1-37 2.1-147.8 0-184.8zM398.8 388c-7.8 19.6-22.9 34.7-42.6 42.6-29.5 11.7-99.5 9-132.1 9s-102.7 2.6-132.1-9c-19.6-7.8-34.7-22.9-42.6-42.6-11.7-29.5-9-99.5-9-132.1s-2.6-102.7 9-132.1c7.8-19.6 22.9-34.7 42.6-42.6 29.5-11.7 99.5-9 132.1-9s102.7-2.6 132.1 9c19.6 7.8 34.7 22.9 42.6 42.6 11.7 29.5 9 99.5 9 132.1s2.7 102.7-9 132.1z"></path>
              </svg>
            </a>
            <a href="https://t.me" target="_blank" rel="noopener noreferrer" class="social-icon" aria-label="Telegram kanalimiz">
              <svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 448 512" height="18" width="18" xmlns="http://www.w3.org/2000/svg">
                <path d="M446.7 98.6l-67.6 318.8c-5.1 22.5-18.4 28.1-37.3 17.5l-103-75.9-49.7 47.8c-5.5 5.5-10.1 10.1-20.7 10.1l7.4-104.9 190.9-172.5c8.3-7.4-1.8-11.5-12.9-4.1L117.8 284 16.2 252.2c-22.1-6.9-22.5-22.1 4.6-32.7L418.2 66.4c18.4-6.9 34.5 4.1 28.5 32.2z"></path>
              </svg>
            </a>
            <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" class="social-icon" aria-label="YouTube kanalimiz">
              <svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 576 512" height="18" width="18" xmlns="http://www.w3.org/2000/svg">
                <path d="M549.655 124.083c-6.281-23.65-24.787-42.276-48.284-48.597C458.781 64 288 64 288 64S117.22 64 74.629 75.486c-23.497 6.322-42.003 24.947-48.284 48.597-11.412 42.867-11.412 132.305-11.412 132.305s0 89.438 11.412 132.305c6.281 23.65 24.787 41.5 48.284 47.821C117.22 448 288 448 288 448s170.78 0 213.371-11.486c23.497-6.321 42.003-24.171 48.284-47.821 11.412-42.867 11.412-132.305 11.412-132.305s0-89.438-11.412-132.305zm-317.51 213.537V174.38L378.054 256l-145.909 81.62z"></path>
              </svg>
            </a>
          </div>
        </div>

        <!-- 2. Menu Links -->
        <div class="footer-col">
          <h3 class="col-title">Menyu</h3>
          <ul class="col-links">
            <li><a routerLink="/client/restaurants">Bosh sahifa</a></li>
            <li><a routerLink="/client/restaurants">Menyu</a></li>
            <li><a routerLink="/client/restaurants">Kategoriyalar</a></li>
            <li><a routerLink="/client/restaurants">Mashhur taomlar</a></li>
            <li><a routerLink="/client/restaurants">Aksiyalar</a></li>
          </ul>
        </div>

        <!-- 3. Useful Links -->
        <div class="footer-col">
          <h3 class="col-title">Foydali havolalar</h3>
          <ul class="col-links">
            <li><a routerLink="/client/restaurants">Biz haqimizda</a></li>
            <li><a routerLink="/client/restaurants">Maxfiylik siyosati</a></li>
            <li><a routerLink="/client/restaurants">Foydalanish shartlari</a></li>
            <li><a routerLink="/client/restaurants">Savol-javob</a></li>
          </ul>
        </div>

        <!-- 4. Contact Info -->
        <div class="footer-col">
          <h3 class="col-title">Bog'lanish</h3>
          <ul class="contact-details">
            <li><span class="icon">📍</span> Qarshi shahar, Mustaqillik ko'chasi</li>
            <li><span class="icon">📞</span> +998 90 123 45 67</li>
            <li><span class="icon">✉️</span> info&#64;mangofood.uz</li>
            <li>
              <span class="icon">🕒</span> 
              <div>
                <strong>Ish vaqti:</strong><br>
                Dushanba–Yakshanba<br>
                09:00–23:00
              </div>
            </li>
          </ul>
        </div>

        <!-- 5. Newsletter -->
        <div class="footer-col newsletter-col">
          <h3 class="col-title">Yangiliklardan xabardor bo'ling</h3>
          <p class="newsletter-desc">Aksiyalar va yangi taomlar haqidagi ma'lumotlarni birinchilardan bo'lib oling.</p>
          <form class="newsletter-form" (submit)="subscribe($event)">
            <label for="newsletter-email" class="visually-hidden">Email manzilingiz</label>
            <input 
              id="newsletter-email"
              type="email" 
              name="email"
              [(ngModel)]="email" 
              placeholder="Email kiriting..." 
              required
              class="newsletter-input"
              [class.error]="emailError()"
              (input)="clearError()">
            <button type="submit" class="newsletter-submit-btn">
              Obuna bo'lish
            </button>
          </form>
          @if (emailSuccess()) {
            <p class="success-message">🎉 Muvaffaqiyatli obuna bo'lindi!</p>
          } @else if (emailError()) {
            <p class="error-message">⚠️ Iltimos, to'g'ri email kiriting.</p>
          }
        </div>
      </div>

      <!-- Bottom Bar -->
      <div class="footer-bottom">
        <div class="footer-bottom-container">
          <p class="copyright-text">
            &copy; {{ currentYear }} MangoFood. Barcha huquqlar himoyalangan.
          </p>
          <p class="powered-text">
            Made with ❤️ in Uzbekistan
          </p>
        </div>
      </div>
    </footer>
  `,
  styles: [`
    /* Visually hidden accessibility helper */
    .visually-hidden {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    }

    .footer-wrap {
      background: #0f172a; /* Dark background conforming to modern aesthetics */
      color: #f1f5f9;
      border-top: 1px solid #1e293b;
      box-shadow: 0 -10px 40px rgba(0,0,0,0.3);
      font-family: 'Poppins', sans-serif;
      padding-top: 64px;
      margin-top: auto; /* Ensures footer sits at bottom if page has low content */
      animation: fadeInUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) both;
    }

    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .footer-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 24px 48px 24px;
      display: grid;
      grid-template-columns: 2fr 1fr 1fr 1.5fr 2fr;
      gap: 32px;
    }

    .footer-col {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    /* Logo Styling */
    .footer-logo {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .logo-icon {
      font-size: 1.5rem;
    }
    .logo-text {
      font-size: 1.25rem;
      font-weight: 800;
      color: #ffffff;
      letter-spacing: -0.5px;
    }
    .accent-color {
      color: var(--primary, #f97316);
    }

    .about-desc {
      font-size: 0.875rem;
      color: #94a3b8;
      line-height: 1.6;
    }

    /* Social Icons Styling */
    .social-links {
      display: flex;
      gap: 12px;
      margin-top: 8px;
    }
    .social-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.08);
      color: #94a3b8;
      transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }
    .social-icon:hover {
      background: var(--primary, #f97316);
      color: #ffffff;
      border-color: var(--primary, #f97316);
      transform: scale(1.18) rotate(8deg);
      box-shadow: 0 6px 20px rgba(249, 115, 22, 0.4);
    }

    /* Link list styling */
    .col-title {
      font-size: 1rem;
      font-weight: 700;
      color: #ffffff;
      position: relative;
      padding-bottom: 8px;
      letter-spacing: 0.5px;
    }
    .col-title::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 0;
      width: 24px;
      height: 2px;
      background: var(--primary, #f97316);
      border-radius: 2px;
    }

    .col-links {
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .col-links a {
      font-size: 0.875rem;
      color: #94a3b8;
      text-decoration: none;
      transition: all 0.25s ease;
      display: inline-block;
      outline: none;
    }
    .col-links a:hover, .col-links a:focus-visible {
      color: var(--primary, #f97316);
      transform: translateX(4px);
    }

    /* Contact Details */
    .contact-details {
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 14px;
    }
    .contact-details li {
      font-size: 0.875rem;
      color: #94a3b8;
      display: flex;
      gap: 10px;
      line-height: 1.5;
    }
    .contact-details .icon {
      color: var(--primary, #f97316);
      font-size: 1rem;
      flex-shrink: 0;
    }

    /* Newsletter Column */
    .newsletter-col {
      gap: 12px;
    }
    .newsletter-desc {
      font-size: 0.825rem;
      color: #94a3b8;
      line-height: 1.5;
    }
    .newsletter-form {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-top: 4px;
    }
    .newsletter-input {
      padding: 11px 16px;
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid #334155;
      border-radius: 8px;
      color: #ffffff;
      font-size: 0.85rem;
      font-family: inherit;
      outline: none;
      transition: all 0.25s ease;
    }
    .newsletter-input:focus {
      border-color: var(--primary, #f97316);
      background: rgba(255, 255, 255, 0.06);
      box-shadow: 0 0 0 2px rgba(249, 115, 22, 0.25);
    }
    .newsletter-input.error {
      border-color: #ef4444;
      box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.2);
    }

    .newsletter-submit-btn {
      padding: 11px 16px;
      background: var(--primary, #f97316);
      color: #ffffff;
      border: none;
      border-radius: 8px;
      font-size: 0.85rem;
      font-weight: 600;
      cursor: pointer;
      font-family: inherit;
      transition: all 0.25s ease;
      box-shadow: 0 4px 12px rgba(249, 115, 22, 0.2);
    }
    .newsletter-submit-btn:hover {
      background: var(--primary-dark, #ea580c);
      transform: translateY(-1px);
      box-shadow: 0 6px 16px rgba(249, 115, 22, 0.35);
    }
    .newsletter-submit-btn:active {
      transform: translateY(0);
    }

    .success-message {
      font-size: 0.8rem;
      color: #10b981;
      margin: 0;
      animation: fadeIn 0.3s ease;
    }
    .error-message {
      font-size: 0.8rem;
      color: #ef4444;
      margin: 0;
      animation: fadeIn 0.3s ease;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(-5px); }
      to { opacity: 1; transform: translateY(0); }
    }

    /* Bottom Bar */
    .footer-bottom {
      border-top: 1px solid #1e293b;
      padding: 24px 0;
      background: #0b0f19;
    }
    .footer-bottom-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .copyright-text {
      font-size: 0.825rem;
      color: #64748b;
    }
    .powered-text {
      font-size: 0.825rem;
      color: #64748b;
    }

    /* Responsive adjustments */
    @media (max-width: 1024px) {
      .footer-container {
        grid-template-columns: 1fr 1fr;
        gap: 40px;
      }
      .about-col, .newsletter-col {
        grid-column: span 2;
      }
    }

    @media (max-width: 640px) {
      .footer-wrap {
        padding-top: 48px;
      }
      .footer-container {
        grid-template-columns: 1fr;
        gap: 32px;
      }
      .about-col, .newsletter-col {
        grid-column: span 1;
      }
      .footer-bottom-container {
        flex-direction: column;
        gap: 12px;
        text-align: center;
      }
    }
  `]
})
export class FooterComponent {
  readonly currentYear = new Date().getFullYear();
  email = '';
  emailSuccess = signal(false);
  emailError = signal(false);

  constructor(private snack: MatSnackBar) {}

  subscribe(event: Event): void {
    event.preventDefault();
    this.clearError();
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!this.email || !emailRegex.test(this.email.trim())) {
      this.emailError.set(true);
      return;
    }

    // Success response
    this.emailSuccess.set(true);
    this.email = '';
    this.snack.open('🎉 Muvaffaqiyatli obuna bo\'lindi!', 'Yopish', {
      duration: 3000,
      panelClass: ['snackbar-success']
    });

    setTimeout(() => {
      this.emailSuccess.set(false);
    }, 4000);
  }

  clearError(): void {
    this.emailError.set(false);
    this.emailSuccess.set(false);
  }
}
