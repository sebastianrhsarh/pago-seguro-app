import { EnvironmentInjector, Injectable, inject, runInInjectionContext } from '@angular/core';
import { Firestore, collection, addDoc, query, where, onSnapshot, doc, updateDoc, getDocs, UpdateData, DocumentData } from '@angular/fire/firestore';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TransactionService {
  private readonly injector = inject(EnvironmentInjector);

  constructor(private firestore: Firestore) {}

  createTransaction(data: any): Promise<void> {
    const transactionsCollection = this.inContext(() => collection(this.firestore, 'transactions'));
    return this.inContext(() => addDoc(transactionsCollection, data)).then(() => {
      console.log('Transacción registrada en Firestore', data);
    });
  }

  getTransactionsByBuyer(buyerId: string): Observable<any[]> {
    const transactionsCollection = this.inContext(() => collection(this.firestore, 'transactions'));
    const q = this.inContext(() => query(transactionsCollection, where('buyerId', '==', buyerId)));

    return new Observable<any[]>(subscriber => {
      const unsubscribe = this.inContext(() => onSnapshot(q, snap => {
        const items = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        subscriber.next(items);
      }, err => subscriber.error(err)));

      return () => unsubscribe();
    });
  }

  getTransactionsBySeller(sellerId: string): Observable<any[]> {
    const transactionsCollection = this.inContext(() => collection(this.firestore, 'transactions'));
    const q = this.inContext(() => query(transactionsCollection, where('sellerId', '==', sellerId)));

    return new Observable<any[]>(subscriber => {
      const unsubscribe = this.inContext(() => onSnapshot(q, snap => {
        const items = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        subscriber.next(items);
      }, err => subscriber.error(err)));

      return () => unsubscribe();
    });
  }

  updateTransactionStatus(transactionId: string, estado: string): Promise<void> {
    const ref = this.inContext(() => doc(this.firestore, `transactions/${transactionId}`));
    return this.inContext(() => updateDoc(ref, { estado }));
  }

  updateTransaction(transactionId: string, data: UpdateData<DocumentData>): Promise<void> {
    const ref = this.inContext(() => doc(this.firestore, `transactions/${transactionId}`));
    return this.inContext(() => updateDoc(ref, data));
  }

  async getLatestTransactionByBuyerAndPost(buyerId: string, postId: string): Promise<any | null> {
    const transactionsCollection = this.inContext(() => collection(this.firestore, 'transactions'));
    const q = this.inContext(() => query(
      transactionsCollection,
      where('buyerId', '==', buyerId),
      where('postId', '==', postId)
    ));

    const snap = await this.inContext(() => getDocs(q));
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

  private inContext<T>(fn: () => T): T {
    return runInInjectionContext(this.injector, fn);
  }
}