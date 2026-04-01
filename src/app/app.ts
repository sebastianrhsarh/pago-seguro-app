import { AsyncPipe } from '@angular/common';
import { Component, signal } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [AsyncPipe, RouterOutlet, RouterLink],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('pago-seguro-frontend');
  protected readonly user$;

  constructor(private authService: AuthService) {
    this.user$ = this.authService.user$;
  }
}
