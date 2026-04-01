import { Component, OnInit, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TransactionService } from '../../../core/services/transaction.service';

@Component({
  selector: 'app-my-sales',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './my-sales.html',
  styleUrl: './my-sales.css',
})
export class MySales implements OnInit {
  transactions: any[] = [];
  sellerId = 'i3sjwuEcszRiB0LpLz6N';

  constructor(
    private transactionService: TransactionService,
    private ngZone: NgZone
  ) {}

  ngOnInit(): void {
    this.transactionService.getTransactionsBySeller(this.sellerId).subscribe({
      next: (txs) => {
        console.log('Mis ventas recibidas', txs);
        this.ngZone.run(() => {
          this.transactions = txs.map(t => ({ ...t, codigoIngresado: '' }));
        });
      },
      error: (err) => {
        console.error('Error al cargar mis ventas', err);
      }
    });
  }

  validarCodigo(transaction: any, inputCodigo: string): void {
    if (inputCodigo === transaction.codigo) {
      this.transactionService.updateTransactionStatus(transaction.id, 'completado')
        .then(() => {
          console.log('Estado de transacción actualizado a completado', transaction.id);
        })
        .catch(err => {
          console.error('Error al actualizar transacción', err);
        });
    } else {
      console.error('Código incorrecto');
    }
  }
}

