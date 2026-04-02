import { ChangeDetectorRef, Component, OnDestroy, OnInit, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TransactionService } from '../../../core/services/transaction.service';
import { PostService } from '../../../core/services/post.service';
import { AuthService } from '../../../core/services/auth.service';
import { switchMap, forkJoin, of, take, map } from 'rxjs';
import { Post } from '../../../shared/models/post.interface';

type TransactionStatus = 'pendiente' | 'completado' | 'cancelado';
type PurchasePostStatus = Post['estado'] | 'desconocido';

interface PurchaseTransaction {
  id: string;
  postId: string;
  monto: number;
  estado: TransactionStatus;
  codigo?: string;
  createdAt?: unknown;
  titulo: string;
  imageUrl?: string;
  postEstado: PurchasePostStatus;
}

@Component({
  selector: 'app-my-purchases',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './my-purchases.html',
  styleUrl: './my-purchases.css',
})
export class MyPurchases implements OnInit, OnDestroy {
  private static readonly COPY_FEEDBACK_MS = 1800;

  transactions: PurchaseTransaction[] = [];
  copiedStateMap: Record<string, boolean> = {};
  private copyResetTimerMap: Record<string, ReturnType<typeof setTimeout> | undefined> = {};

  constructor(
    private transactionService: TransactionService,
    private postService: PostService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.authService.user$.pipe(
      take(1),
      switchMap(user => {
        if (!user) {
          this.router.navigate(['/login']);
          return of([] as PurchaseTransaction[]);
        }

        return this.transactionService.getTransactionsByBuyer(user.uid).pipe(
          switchMap(txs => {
            if (!txs.length) return of([] as PurchaseTransaction[]);
            return forkJoin(
              txs.map(t =>
                this.postService.getPostById(t.postId).pipe(
                  take(1),
                  map(post => ({
                    ...t,
                    titulo: post?.titulo ?? t.postId,
                    imageUrl: post?.imageUrl,
                    postEstado: post?.estado ?? 'desconocido'
                  }) as PurchaseTransaction)
                )
              )
            );
          })
        );
      })
    ).subscribe({
      next: (txs) => {
        this.ngZone.run(() => {
          this.transactions = [...txs].sort((left, right) => this.getTimeValue(right.createdAt) - this.getTimeValue(left.createdAt));
          this.cdr.detectChanges();
        });
      },
      error: (err) => console.error('Error al cargar mis compras', err)
    });
  }

  cancelarCompra(transaction: PurchaseTransaction): void {
    if (transaction.estado !== 'pendiente') {
      return;
    }

    Promise.all([
      this.transactionService.updateTransactionStatus(transaction.id, 'cancelado'),
      this.postService.updatePostStatus(transaction.postId, 'disponible')
    ])
      .then(() => {})
      .catch((err) => {
        console.error('Error cancelando compra', err);
      });
  }

  ngOnDestroy(): void {
    for (const timer of Object.values(this.copyResetTimerMap)) {
      if (timer) {
        clearTimeout(timer);
      }
    }
  }

  get activeTransactions(): PurchaseTransaction[] {
    return this.transactions.filter(transaction => transaction.estado === 'pendiente');
  }

  get historyTransactions(): PurchaseTransaction[] {
    return this.transactions.filter(transaction => transaction.estado !== 'pendiente');
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      maximumFractionDigits: 0,
    }).format(value);
  }

  formatDate(value: unknown): string {
    const time = this.getTimeValue(value);

    if (!time) {
      return 'Fecha no disponible';
    }

    return new Intl.DateTimeFormat('es-CL', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(new Date(time));
  }

  getHistoryCopy(transaction: PurchaseTransaction): string {
    if (transaction.estado === 'completado') {
      return `Comprado el ${this.formatDate(transaction.createdAt)}`;
    }

    return `Cancelado el ${this.formatDate(transaction.createdAt)}`;
  }

  async copySecurityCode(transaction: PurchaseTransaction): Promise<void> {
    const code = (transaction.codigo ?? '').trim();
    if (!code) {
      return;
    }

    try {
      await navigator.clipboard.writeText(code);
      this.copiedStateMap[transaction.id] = true;

      const existingTimer = this.copyResetTimerMap[transaction.id];
      if (existingTimer) {
        clearTimeout(existingTimer);
      }

      this.copyResetTimerMap[transaction.id] = setTimeout(() => {
        this.copiedStateMap[transaction.id] = false;
        this.cdr.detectChanges();
      }, MyPurchases.COPY_FEEDBACK_MS);

      this.cdr.detectChanges();
    } catch (error) {
      console.error('No se pudo copiar el código.', error);
    }
  }

  private getTimeValue(value: unknown): number {
    if (value && typeof value === 'object' && 'toDate' in value && typeof (value as { toDate: () => Date }).toDate === 'function') {
      return (value as { toDate: () => Date }).toDate().getTime();
    }

    if (value instanceof Date) {
      return value.getTime();
    }

    if (typeof value === 'string' || typeof value === 'number') {
      const parsedDate = new Date(value);
      return Number.isNaN(parsedDate.getTime()) ? 0 : parsedDate.getTime();
    }

    return 0;
  }
}
