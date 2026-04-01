import { Component, inject, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { PostService } from '../../../core/services/post.service';

@Component({
  selector: 'app-create-post',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './create-post.html',
  styleUrl: './create-post.css',
})
export class CreatePostComponent {
  private static readonly REDIRECT_DELAY_MS = 3500;

  titulo = '';
  descripcion = '';
  precio: number | null = null;

  isSubmitting = false;
  isRedirecting = false;
  errorMessage = '';
  successMessage = '';

  private readonly authService = inject(AuthService);
  private readonly postService = inject(PostService);
  private readonly router = inject(Router);
  private readonly ngZone = inject(NgZone);

  async publicar(): Promise<void> {
    if (!this.canSubmit) {
      return;
    }

    const userId = this.authService.getCurrentUserId();
    if (!userId) {
      this.errorMessage = 'Debes iniciar sesion';
      await this.router.navigate(['/login']);
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';
    this.successMessage = '';

    try {
      await this.postService.createPost({
        titulo: this.titulo.trim(),
        descripcion: this.descripcion.trim(),
        precio: Number(this.precio),
        estado: 'disponible',
        sellerId: userId,
        createdAt: new Date(),
      });

      this.ngZone.run(() => {
        this.resetForm();
        this.successMessage = 'Publicado con exito';
        this.isRedirecting = true;
      });

      setTimeout(() => {
        this.ngZone.run(() => {
          this.router.navigate(['/']);
        });
      }, CreatePostComponent.REDIRECT_DELAY_MS);
    } catch (error) {
      this.ngZone.run(() => {
        this.errorMessage = error instanceof Error
          ? error.message
          : 'No fue posible publicar el producto.';
        this.isRedirecting = false;
      });
    } finally {
      this.ngZone.run(() => {
        this.isSubmitting = false;
      });
    }
  }

  get canSubmit(): boolean {
    return (
      !!this.titulo.trim() &&
      !!this.descripcion.trim() &&
      this.precio !== null &&
      this.precio > 0 &&
      !this.isSubmitting &&
      !this.isRedirecting
    );
  }

  private resetForm(): void {
    this.titulo = '';
    this.descripcion = '';
    this.precio = null;
  }
}