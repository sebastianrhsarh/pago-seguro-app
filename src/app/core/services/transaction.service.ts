import { Injectable } from '@angular/core';
import { Firestore, collection, addDoc, query, where, onSnapshot, doc, updateDoc, getDocs, UpdateData, DocumentData } from '@angular/fire/firestore';
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

  getTransactionsBySeller(sellerId: string): Observable<any[]> {
    const transactionsCollection = collection(this.firestore, 'transactions');
    const q = query(transactionsCollection, where('sellerId', '==', sellerId));

    return new Observable<any[]>(subscriber => {
      const unsubscribe = onSnapshot(q, snap => {
        const items = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        subscriber.next(items);
      }, err => subscriber.error(err));

      return () => unsubscribe();
    });
  }

  updateTransactionStatus(transactionId: string, estado: string): Promise<void> {
    const ref = doc(this.firestore, `transactions/${transactionId}`);
    return updateDoc(ref, { estado });
  }

  updateTransaction(transactionId: string, data: UpdateData<DocumentData>): Promise<void> {
    const ref = doc(this.firestore, `transactions/${transactionId}`);
    return updateDoc(ref, data);
  }

  async getLatestTransactionByBuyerAndPost(buyerId: string, postId: string): Promise<any | null> {
    const transactionsCollection = collection(this.firestore, 'transactions');
    const q = query(
      transactionsCollection,
      where('buyerId', '==', buyerId),
      where('postId', '==', postId)
    );

    const snap = await getDocs(q);
    if (snap.empty) {
      return null;
    }

    const items = snap.docs.map(item => ({ id: item.id, ...item.data() }));
    items.sort((a: any, b: any) => this.getTimeValue(b.createdAt) - this.getTimeValue(a.createdAt));

    return items[0];
  }

  private getTimeValue(value: unknown): number {
    if (value && typeof value === 'object' && 'toDate' in value && typeof (value as { toDate: () => Date }).toDate === 'function') {
      return (value as { toDate: () => Date }).toDate().getTime();
    }

    if (value instanceof Date) {
      return value.getTime();
    }

    return 0;
  }
}