import { ChangeDetectorRef, Component, OnInit, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TransactionService } from '../../../core/services/transaction.service';
import { PostService } from '../../../core/services/post.service';
import { AuthService } from '../../../core/services/auth.service';
import { switchMap, forkJoin, of, take, map } from 'rxjs';
import { Post } from '../../../shared/models/post.interface';

type TransactionStatus = 'pendiente' | 'completado' | 'cancelado';
type SalesFilter = 'todas' | 'pendientes';
type SalePostStatus = Post['estado'] | 'desconocido';

interface SaleTransaction {
  id: string;
  postId: string;
  monto: number;
  estado: TransactionStatus;
  codigo?: string;
  createdAt?: unknown;
  titulo: string;
  postEstado: SalePostStatus;
}

@Component({
  selector: 'app-my-sales',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './my-sales.html',
  styleUrl: './my-sales.css',
})
export class MySales implements OnInit {
  transactions: SaleTransaction[] = [];
  codigoIngresadoMap: Record<string, string> = {};
  feedbackMap: Record<string, string> = {};
  selectedFilter: SalesFilter = 'todas';

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
          return of([] as SaleTransaction[]);
        }

        return this.transactionService.getTransactionsBySeller(user.uid).pipe(
          switchMap(txs => {
            if (!txs.length) return of([] as SaleTransaction[]);
            return forkJoin(
              txs.map(t =>
                this.postService.getPostById(t.postId).pipe(
                  take(1),
                  map(post => ({
                    ...t,
                    titulo: post?.titulo ?? t.postId,
                    postEstado: post?.estado ?? 'desconocido'
                  }) as SaleTransaction)
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
      error: (err) => console.error('Error al cargar mis ventas', err)
    });
  }

  validarCodigo(transaction: SaleTransaction): void {
    if (transaction.estado !== 'pendiente') {
      return;
    }

    const inputCodigo = (this.codigoIngresadoMap[transaction.id] ?? '').trim().toUpperCase();
    const expectedCodigo = (transaction.codigo ?? '').trim().toUpperCase();

    if (inputCodigo.length !== 6) {
      this.feedbackMap[transaction.id] = 'Ingresa un codigo valido de 6 caracteres.';
      return;
    }

    if (inputCodigo === expectedCodigo) {
      Promise.all([
        this.transactionService.updateTransactionStatus(transaction.id, 'completado'),
        this.postService.updatePostStatus(transaction.postId, 'vendido')
      ])
        .then(() => {
          this.feedbackMap[transaction.id] = '';
        })
        .catch(err => {
          this.feedbackMap[transaction.id] = 'No se pudo confirmar la entrega. Intenta nuevamente.';
          console.error('Error al actualizar transacción', err);
        });
    } else {
      this.feedbackMap[transaction.id] = 'Codigo incorrecto. Verifica el codigo del comprador.';
      console.error('Código incorrecto');
    }
  }

  updateCodigo(transactionId: string, value: string): void {
    this.codigoIngresadoMap[transactionId] = value.toUpperCase().slice(0, 6);
    if (this.feedbackMap[transactionId]) {
      this.feedbackMap[transactionId] = '';
    }
  }

  setFilter(filter: SalesFilter): void {
    this.selectedFilter = filter;
  }

  get filteredTransactions(): SaleTransaction[] {
    if (this.selectedFilter === 'pendientes') {
      return this.transactions.filter(transaction => transaction.estado === 'pendiente');
    }

    return this.transactions;
  }

  get totalVentasMonto(): number {
    return this.transactions
      .filter(transaction => transaction.estado !== 'cancelado')
      .reduce((total, transaction) => total + transaction.monto, 0);
  }

  get pendientesEntregaCount(): number {
    return this.transactions.filter(transaction => transaction.estado === 'pendiente').length;
  }

  get completadasMesCount(): number {
    const now = new Date();
    return this.transactions.filter(transaction => {
      if (transaction.estado !== 'completado') {
        return false;
      }

      const time = this.getTimeValue(transaction.createdAt);
      if (!time) {
        return false;
      }

      const date = new Date(time);
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    }).length;
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      maximumFractionDigits: 0,
    }).format(value);
  }

  getTransactionLabel(transaction: SaleTransaction): string {
    return `#${transaction.id.slice(0, 4).toUpperCase()}-${transaction.id.slice(-3).toUpperCase()}`;
  }

  getInitials(title: string): string {
    return title
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map(part => part[0]?.toUpperCase() ?? '')
      .join('');
  }

  getCompletionCopy(transaction: SaleTransaction): string {
    return `Fondos liberados ${this.formatDate(transaction.createdAt)}`;
  }

  private formatDate(value: unknown): string {
    const time = this.getTimeValue(value);

    if (!time) {
      return 'sin fecha';
    }

    return new Intl.DateTimeFormat('es-CL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(new Date(time));
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

