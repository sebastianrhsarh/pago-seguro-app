import { Component, OnInit, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TransactionService } from '../../../core/services/transaction.service';

@Component({
  selector: 'app-my-purchases',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './my-purchases.html',
  styleUrl: './my-purchases.css',
})
export class MyPurchases implements OnInit {
  transactions: any[] = [];
  buyerId = 'user_1';

  constructor(
    private transactionService: TransactionService,
    private ngZone: NgZone
  ) {}

  ngOnInit(): void {
    this.transactionService.getTransactionsByBuyer(this.buyerId).subscribe({
      next: (txs) => {
        console.log('Mis compras recibidas', txs);
        this.ngZone.run(() => {
          this.transactions = txs;
        });
      },
      error: (err) => {
        console.error('Error al cargar mis compras', err);
      }
    });
  }
}
