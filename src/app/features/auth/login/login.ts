import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { take } from 'rxjs';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class LoginComponent implements OnInit {
  private static readonly AUTH_TRANSITION_MS = 900;

  email = '';
  password = '';
  errorMessage = '';
  isSubmitting = false;
  showPassword = false;
  isAuthTransition = false;
  transitionMessage = 'Iniciando sesion segura...';

  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  ngOnInit(): void {
    this.authService.user$.pipe(take(1)).subscribe((user) => {
      if (user) {
        this.router.navigate(['/']);
      }
    });
  }

  async login(): Promise<void> {
    if (!this.canSubmit) {
      return;
    }

    this.isSubmitting = true;
    this.isAuthTransition = false;
    this.errorMessage = '';

    try {
      this.transitionMessage = 'Iniciando sesion segura...';
      await this.authService.login(this.email, this.password);
      this.isAuthTransition = true;
      await this.wait(LoginComponent.AUTH_TRANSITION_MS);
      await this.router.navigate(['/']);
    } catch (error) {
      this.errorMessage = this.getErrorMessage(error);
      this.isAuthTransition = false;
    } finally {
      this.isSubmitting = false;
    }
  }

  async register(): Promise<void> {
    if (!this.canSubmit) {
      return;
    }

    this.isSubmitting = true;
    this.isAuthTransition = false;
    this.errorMessage = '';

    try {
      this.transitionMessage = 'Creando cuenta segura...';
      await this.authService.register(this.email, this.password);
      this.isAuthTransition = true;
      await this.wait(LoginComponent.AUTH_TRANSITION_MS);
      await this.router.navigate(['/']);
    } catch (error) {
      this.errorMessage = this.getErrorMessage(error);
      this.isAuthTransition = false;
    } finally {
      this.isSubmitting = false;
    }
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  continueAsGuest(): void {
    this.router.navigate(['/']);
  }

  get canSubmit(): boolean {
    return !!this.email.trim() && !!this.password.trim() && !this.isSubmitting;
  }

  private getErrorMessage(error: unknown): string {
    if (error instanceof Error && error.message) {
      return error.message;
    }

    return 'No fue posible autenticar al usuario.';
  }

  private wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}