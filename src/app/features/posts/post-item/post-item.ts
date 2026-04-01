import { Component, Input } from '@angular/core';
import { Post } from '../../../shared/models/post.interface';
import { TransactionService } from '../../../core/services/transaction.service';
import { AuthService, User } from '../../../core/services/auth.service';

@Component({
  selector: 'app-post-item',
  standalone: true,
  imports: [],
  templateUrl: './post-item.html',
  styleUrl: './post-item.css',
})
export class PostItem {
  @Input() post!: Post;

  constructor(
    private transactionService: TransactionService,
    private authService: AuthService
  ) {}

  async onBuy(): Promise<void> {
    const currentUser = this.authService.getCurrentUser();
    console.log('Usuario actual:', currentUser);

    try {
      await this.transactionService.createTransaction(this.post);
      alert('Transacción creada exitosamente');
    } catch (error) {
      console.error('Error creando transacción:', error);
      alert('Error al crear la transacción');
    }
  }
}
