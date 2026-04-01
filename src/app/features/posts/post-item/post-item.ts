import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TransactionService } from '../../../core/services/transaction.service';
import { PostService } from '../../../core/services/post.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-post-item',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './post-item.html',
  styleUrl: './post-item.css',
})
export class PostItem implements OnInit, OnChanges {
  @Input() post: any = null;

  get isOwner(): boolean {
    const userId = this.authService.getCurrentUserId();
    return !!userId && this.post?.sellerId === userId;
  }

  constructor(
    private transactionService: TransactionService,
    private postService: PostService,
    private authService: AuthService,
    private router: Router
  ) {
    console.log('PostItem constructor');
  }

  ngOnInit(): void {
    console.log('PostItem ngOnInit, post:', this.post);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['post']) {
      console.log('PostItem ngOnChanges, post actualizado:', this.post);
    }
  }

  async comprar(post: any): Promise<void> {
    console.log('EVENT: comprar() invocado');
    console.log('post passed to comprar:', post);
    console.log('post from @Input:', this.post);
    console.log('post.estado actual:', post?.estado);

    if (!post) {
      console.error('No hay post disponible para comprar');
      return;
    }

    if (post.estado !== 'disponible') {
      console.error('El producto no está disponible para compra');
      return;
    }

    const userId = this.authService.getCurrentUserId();
    if (!userId) {
      console.error('Debes iniciar sesión');
      this.router.navigate(['/login']);
      return;
    }

    if (post.sellerId === userId) {
      console.error('No puedes comprar tu propio producto');
      return;
    }

    const codigo = this.generarCodigoTransaccion(6);
    console.log('codigo transaccion generado', codigo);

    try {
      const latestTransaction = await this.transactionService.getLatestTransactionByBuyerAndPost(userId, post.id);

      if (latestTransaction?.estado === 'pendiente') {
        console.log('Ya existe una compra pendiente para este producto, se reutiliza.');
        await this.postService.updatePostStatus(post.id, 'reservado');
        await this.router.navigate(['/mis-compras']);
        return;
      }

      if (latestTransaction?.estado === 'cancelado') {
        await this.transactionService.updateTransaction(latestTransaction.id, {
          estado: 'pendiente',
          codigo,
          createdAt: new Date()
        });
        await this.postService.updatePostStatus(post.id, 'reservado');
        await this.router.navigate(['/mis-compras']);
        return;
      }
    } catch (err) {
      console.error('Error consultando transacciones previas', err);
      return;
    }

    const transaction = {
      buyerId: userId,
      sellerId: post.sellerId,
      postId: post.id,
      monto: post.precio,
      estado: 'pendiente',
      codigo,
      createdAt: new Date()
    };

    console.log('transaccion a guardar', transaction);

    try {
      await this.transactionService.createTransaction(transaction);
      console.log('Transacción guardada en Firestore:', transaction);
      await this.postService.updatePostStatus(post.id, 'reservado');
      console.log('Estado del post actualizado a reservado', post.id);
      await this.router.navigate(['/mis-compras']);
    } catch (err) {
      console.error('Error comprando:', err);
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
