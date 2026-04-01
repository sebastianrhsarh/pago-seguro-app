import { Component, OnInit, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TransactionService } from '../../../core/services/transaction.service';
import { PostService } from '../../../core/services/post.service';
import { AuthService } from '../../../core/services/auth.service';
import { switchMap, forkJoin, of, take, map } from 'rxjs';

@Component({
  selector: 'app-my-sales',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './my-sales.html',
  styleUrl: './my-sales.css',
})
export class MySales implements OnInit {
  transactions: any[] = [];
  codigoIngresadoMap: { [key: string]: string } = {};

  constructor(
    private transactionService: TransactionService,
    private postService: PostService,
    private authService: AuthService,
    private ngZone: NgZone,
    private router: Router
  ) {}

  ngOnInit(): void {
    const sellerId = this.authService.getCurrentUserId();
    if (!sellerId) {
      this.router.navigate(['/login']);
      return;
    }

    this.transactionService.getTransactionsBySeller(sellerId).pipe(
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
      error: (err) => console.error('Error al cargar mis ventas', err)
    });
  }

  validarCodigo(transaction: any): void {
    const inputCodigo = this.codigoIngresadoMap[transaction.id] ?? '';
    if (inputCodigo === transaction.codigo) {
      Promise.all([
        this.transactionService.updateTransactionStatus(transaction.id, 'completado'),
        this.postService.updatePostStatus(transaction.postId, 'vendido')
      ])
        .then(() => {
          console.log('Transacción completada y post marcado como vendido', transaction.id);
        })
        .catch(err => {
          console.error('Error al actualizar transacción', err);
        });
    } else {
      console.error('Código incorrecto');
    }
  }
}

