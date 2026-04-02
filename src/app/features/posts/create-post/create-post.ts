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
  private static readonly MAX_IMAGE_BYTES = 2 * 1024 * 1024;
  private static readonly REQUEST_TIMEOUT_MS = 25000;

  titulo = '';
  descripcion = '';
  precio: number | null = null;
  selectedFile: File | null = null;
  imagePreviewUrl: string | null = null;

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

    console.info('[CreatePost] Inicio publicar');

    const userId = this.authService.getCurrentUserId();
    if (!userId) {
      console.warn('[CreatePost] Usuario no autenticado al publicar');
      this.errorMessage = 'Debes iniciar sesion';
      await this.router.navigate(['/login']);
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';
    this.successMessage = '';

    try {
      let imageUrl: string | undefined;

      if (this.selectedFile) {
        console.info('[CreatePost] Subiendo imagen:', {
          name: this.selectedFile.name,
          size: this.selectedFile.size,
          type: this.selectedFile.type,
        });
        imageUrl = await this.withTimeout(
          this.postService.uploadImage(this.selectedFile),
          'La subida de imagen está tardando demasiado. Revisa Storage y vuelve a intentar.'
        );
        console.info('[CreatePost] Imagen subida OK, url obtenida');
      } else {
        console.info('[CreatePost] Publicacion sin imagen');
      }

      console.info('[CreatePost] Guardando post en Firestore');
      await this.withTimeout(
        this.postService.createPost({
          titulo: this.titulo.trim(),
          descripcion: this.descripcion.trim(),
          precio: Number(this.precio),
          estado: 'disponible',
          sellerId: userId,
          imageUrl,
          createdAt: new Date(),
        }),
        'No se pudo guardar la publicacion a tiempo. Intenta nuevamente.'
      );
      console.info('[CreatePost] Post guardado OK');

      this.ngZone.run(() => {
        this.resetForm();
        this.successMessage = 'Publicado con exito';
        this.isRedirecting = true;
      });

      setTimeout(() => {
        this.ngZone.run(() => {
          console.info('[CreatePost] Redirigiendo a /');
          this.router.navigate(['/']);
        });
      }, CreatePostComponent.REDIRECT_DELAY_MS);
    } catch (error) {
      console.error('[CreatePost] Error en publicar:', error);
      this.ngZone.run(() => {
        this.errorMessage = this.getPublishErrorMessage(error);
        this.isRedirecting = false;
      });
    } finally {
      this.ngZone.run(() => {
        this.isSubmitting = false;
      });
      console.info('[CreatePost] Fin publicar (finally)');
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

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;

    if (!file) {
      this.clearSelectedImage();
      return;
    }

    if (file.size > CreatePostComponent.MAX_IMAGE_BYTES) {
      this.errorMessage = 'La imagen supera el maximo de 2MB.';
      this.clearSelectedImage();
      input.value = '';
      return;
    }

    this.errorMessage = '';
    this.selectedFile = file;
    this.updatePreview(file);
  }

  removeSelectedImage(): void {
    this.clearSelectedImage();
  }

  openFilePicker(input: HTMLInputElement): void {
    input.click();
  }

  private resetForm(): void {
    this.titulo = '';
    this.descripcion = '';
    this.precio = null;
    this.clearSelectedImage();
  }

  private clearSelectedImage(): void {
    this.selectedFile = null;
    if (this.imagePreviewUrl) {
      URL.revokeObjectURL(this.imagePreviewUrl);
    }
    this.imagePreviewUrl = null;
  }

  private updatePreview(file: File): void {
    if (this.imagePreviewUrl) {
      URL.revokeObjectURL(this.imagePreviewUrl);
    }
    this.imagePreviewUrl = URL.createObjectURL(file);
  }

  private withTimeout<T>(promise: Promise<T>, message: string): Promise<T> {
    return Promise.race<T>([
      promise,
      new Promise<T>((_, reject) => {
        setTimeout(() => {
          console.error('[CreatePost] Timeout:', message);
          reject(new Error(message));
        }, CreatePostComponent.REQUEST_TIMEOUT_MS);
      })
    ]);
  }

  private getPublishErrorMessage(error: unknown): string {
    if (error && typeof error === 'object' && 'code' in error) {
      const code = String((error as { code: unknown }).code);

      if (code === 'storage/unauthorized') {
        return 'No tienes permisos para subir imagenes en Firebase Storage.';
      }

      if (code === 'storage/canceled') {
        return 'La subida de imagen fue cancelada.';
      }

      if (code === 'storage/retry-limit-exceeded') {
        return 'No se pudo subir la imagen por problemas de red.';
      }

      if (code.startsWith('storage/')) {
        return 'Error al subir imagen a Storage. Revisa configuracion y reglas.';
      }
    }

    if (error instanceof Error && error.message) {
      return error.message;
    }

    return 'No fue posible publicar el producto.';
  }
}