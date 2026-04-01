import { Component, OnInit, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TransactionService } from '../../../core/services/transaction.service';
import { PostService } from '../../../core/services/post.service';
import { AuthService } from '../../../core/services/auth.service';
import { switchMap, forkJoin, of, take, map } from 'rxjs';

@Component({
  selector: 'app-my-purchases',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './my-purchases.html',
  styleUrl: './my-purchases.css',
})
export class MyPurchases implements OnInit {
  transactions: any[] = [];

  constructor(
    private transactionService: TransactionService,
    private postService: PostService,
    private authService: AuthService,
    private ngZone: NgZone,
    private router: Router
  ) {}

  ngOnInit(): void {
    const buyerId = this.authService.getCurrentUserId();
    if (!buyerId) {
      this.router.navigate(['/login']);
      return;
    }

    this.transactionService.getTransactionsByBuyer(buyerId).pipe(
      switchMap(txs => {
        if (!txs.length) return of([]);
        return forkJoin(
          txs.map(t =>
            this.postService.getPostById(t.postId).pipe(
              take(1),
              map(post => ({
                ...t,
                titulo: post?.titulo ?? t.postId,
                postEstado: post?.estado ?? 'desconocido'
              }))
            )
          )
        );
      })
    ).subscribe({
      next: (txs) => {
        this.ngZone.run(() => {
          this.transactions = txs;
        });
      },
      error: (err) => console.error('Error al cargar mis compras', err)
    });
  }

  cancelarCompra(transaction: any): void {
    if (transaction.estado !== 'pendiente') {
      return;
    }

    Promise.all([
      this.transactionService.updateTransactionStatus(transaction.id, 'cancelado'),
      this.postService.updatePostStatus(transaction.postId, 'disponible')
    ])
      .then(() => {
        console.log('Compra cancelada y producto disponible nuevamente', transaction.id);
      })
      .catch((err) => {
        console.error('Error cancelando compra', err);
      });
  }
}
