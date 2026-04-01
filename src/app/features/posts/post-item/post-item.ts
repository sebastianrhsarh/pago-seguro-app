import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Post } from '../../../shared/models/post.interface';
import { TransactionService } from '../../../core/services/transaction.service';
import { PostService } from '../../../core/services/post.service';
import { AuthService, User } from '../../../core/services/auth.service';

@Component({
  selector: 'app-post-item',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './post-item.html',
  styleUrl: './post-item.css',
})
export class PostItem implements OnInit, OnChanges {
  @Input() post: any = null;

  constructor(
    private transactionService: TransactionService,
    private postService: PostService,
    private authService: AuthService
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

  comprar(post: any): void {
    console.log('EVENT: comprar() invocado');
    console.log('post passed to comprar:', post);
    console.log('post from @Input:', this.post);
    console.log('post.estado actual:', post?.estado);

    const user = this.authService.getCurrentUser();
    const buyerId = user?.id ?? 'user_1';

    if (!post) {
      console.error('No hay post disponible para comprar');
      return;
    }

    if (post.sellerId === buyerId) {
      console.error('No puedes comprar tu propio producto');
      return;
    }

    const codigo = this.generarCodigoTransaccion(6);
    console.log('codigo transaccion generado', codigo);

    const transaction = {
      buyerId,
      sellerId: post.sellerId,
      postId: post.id,
      monto: post.precio,
      estado: 'pendiente',
      codigo,
      createdAt: new Date()
    };

    console.log('transaccion a guardar', transaction);

    this.transactionService.createTransaction(transaction)
      .then(() => {
        console.log('Transacción guardada en Firestore:', transaction);
        return this.postService.updatePostStatus(post.id, 'vendido');
      })
      .then(() => {
        console.log('Estado del post actualizado a vendido', post.id);
      })
      .catch((err) => console.error('Error comprando:', err));
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
