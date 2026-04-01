import { CommonModule, Location } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NgZone } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';
import { PostService } from '../../../core/services/post.service';
import { TransactionService } from '../../../core/services/transaction.service';

@Component({
  selector: 'app-post-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './post-detail.html',
  styleUrl: './post-detail.css',
})
export class PostDetailComponent {
  post: any = null;
  isLoading = true;
  isProcessingPurchase = false;
  errorMessage = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private location: Location,
    private ngZone: NgZone,
    private postService: PostService,
    private transactionService: TransactionService,
    private authService: AuthService
  ) {}

  async ngOnInit(): Promise<void> {
    const postId = this.route.snapshot.paramMap.get('id');
    if (!postId) {
      this.ngZone.run(() => {
        this.errorMessage = 'No encontramos el identificador del producto.';
        this.isLoading = false;
      });
      return;
    }

    try {
      const loadedPost = await this.postService.getPostByIdOnce(postId);
      this.ngZone.run(() => {
        this.post = loadedPost;
        if (!loadedPost) {
          this.errorMessage = 'Este producto no existe o ya no está disponible.';
        }
      });
    } catch {
      this.ngZone.run(() => {
        this.errorMessage = 'No pudimos cargar este producto.';
      });
    } finally {
      this.ngZone.run(() => {
        this.isLoading = false;
      });
    }
  }

  get isOwner(): boolean {
    const userId = this.authService.getCurrentUserId();
    return !!userId && this.post?.sellerId === userId;
  }

  goBack(): void {
    this.location.back();
  }

  async iniciarCompraSegura(): Promise<void> {
    if (!this.post || this.isProcessingPurchase) {
      return;
    }

    if (this.post.estado !== 'disponible') {
      this.errorMessage = 'Este producto no está disponible para compra.';
      return;
    }

    const userId = this.authService.getCurrentUserId();
    if (!userId) {
      await this.router.navigate(['/login']);
      return;
    }

    if (this.post.sellerId === userId) {
      this.errorMessage = 'No puedes comprar tu propio producto.';
      return;
    }

    this.isProcessingPurchase = true;
    this.errorMessage = '';

    const codigo = this.generarCodigoTransaccion(6);

    try {
      const latestTransaction = await this.transactionService.getLatestTransactionByBuyerAndPost(userId, this.post.id);

      if (latestTransaction?.estado === 'pendiente') {
        await this.postService.updatePostStatus(this.post.id, 'reservado');
        await this.router.navigate(['/mis-compras']);
        return;
      }

      if (latestTransaction?.estado === 'cancelado') {
        await this.transactionService.updateTransaction(latestTransaction.id, {
          estado: 'pendiente',
          codigo,
          createdAt: new Date()
        });
        await this.postService.updatePostStatus(this.post.id, 'reservado');
        await this.router.navigate(['/mis-compras']);
        return;
      }

      await this.transactionService.createTransaction({
        buyerId: userId,
        sellerId: this.post.sellerId,
        postId: this.post.id,
        monto: this.post.precio,
        estado: 'pendiente',
        codigo,
        createdAt: new Date()
      });

      await this.postService.updatePostStatus(this.post.id, 'reservado');
      await this.router.navigate(['/mis-compras']);
    } catch {
      this.errorMessage = 'No fue posible iniciar la compra segura. Intenta nuevamente.';
    } finally {
      this.isProcessingPurchase = false;
    }
  }

  private generarCodigoTransaccion(length = 6): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < length; i++) {
      const idx = Math.floor(Math.random() * chars.length);
      code += chars[idx];
    }
    return code;
  }
}