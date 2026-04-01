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
  email = '';
  password = '';
  errorMessage = '';
  isSubmitting = false;
  showPassword = false;

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
    this.errorMessage = '';

    try {
      await this.authService.login(this.email, this.password);
      await this.router.navigate(['/']);
    } catch (error) {
      this.errorMessage = this.getErrorMessage(error);
    } finally {
      this.isSubmitting = false;
    }
  }

  async register(): Promise<void> {
    if (!this.canSubmit) {
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';

    try {
      await this.authService.register(this.email, this.password);
      await this.router.navigate(['/']);
    } catch (error) {
      this.errorMessage = this.getErrorMessage(error);
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
}