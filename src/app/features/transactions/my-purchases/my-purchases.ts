import { Component, OnInit, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
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
    private ngZone: NgZone
  ) {}

  ngOnInit(): void {
    const buyerId = this.authService.getCurrentUserId() ?? this.authService.getDemoBuyerId();

    this.transactionService.getTransactionsByBuyer(buyerId).pipe(
      switchMap(txs => {
        if (!txs.length) return of([]);
        return forkJoin(
          txs.map(t =>
            this.postService.getPostById(t.postId).pipe(
              take(1),
              map(post => ({ ...t, titulo: post?.titulo ?? t.postId }))
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
}
