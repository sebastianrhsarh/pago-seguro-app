import { Injectable } from '@angular/core';
import { Firestore, collection, addDoc, query, where, onSnapshot } from '@angular/fire/firestore';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TransactionService {
  constructor(private firestore: Firestore) {}

  createTransaction(data: any): Promise<void> {
    const transactionsCollection = collection(this.firestore, 'transactions');
    return addDoc(transactionsCollection, data).then(() => {
      console.log('Transacción registrada en Firestore', data);
    });
  }

  getTransactionsByBuyer(buyerId: string): Observable<any[]> {
    const transactionsCollection = collection(this.firestore, 'transactions');
    const q = query(transactionsCollection, where('buyerId', '==', buyerId));

    return new Observable<any[]>(subscriber => {
      const unsubscribe = onSnapshot(q, snap => {
        const items = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        subscriber.next(items);
      }, err => subscriber.error(err));

      return () => unsubscribe();
    });
  }
}