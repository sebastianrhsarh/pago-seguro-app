import { AsyncPipe } from '@angular/common';
import { NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  imports: [AsyncPipe, NgOptimizedImage, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
  styleUrl: './app.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class App {
  protected readonly title = signal('pago-seguro-frontend');
  protected readonly logoPath = 'assets/logo.png';
  protected readonly user$;
  protected readonly authReady$;
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  constructor() {
    this.user$ = this.authService.user$;
    this.authReady$ = this.authService.authReady$;
  }

  async logout(): Promise<void> {
    await this.authService.logout();
    await this.router.navigate(['/login']);
  }
}
