import { Injectable } from '@angular/core';
import { Firestore, collection, addDoc } from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root'
})
export class TransactionService {
  constructor(private firestore: Firestore) {}

  async createTransaction(post: any): Promise<void> {
    const transactionsCollection = collection(this.firestore, 'transactions');
    const transactionData = {
      buyerId: 'user123', // Hardcodeado por ahora
      sellerId: post.sellerId,
      postId: post.id,
      monto: post.precio,
      estado: 'pendiente',
      createdAt: new Date()
    };
    await addDoc(transactionsCollection, transactionData);
  }
}