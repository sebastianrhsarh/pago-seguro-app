import { Injectable } from '@angular/core';
import { Firestore, collection, query, onSnapshot } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { Post } from '../../shared/models/post.interface';

@Injectable({
  providedIn: 'root'
})
export class PostService {
  constructor(private firestore: Firestore) {}

  getPosts(): Observable<Post[]> {
    const colRef = collection(this.firestore, 'posts');
    const q = query(colRef);
    return new Observable<Post[]>(subscriber => {
      const unsubscribe = onSnapshot(q, {
        next: (snap) => {
          const items = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Post[];
          subscriber.next(items);
        },
        error: (err) => subscriber.error(err)
      });
      return () => unsubscribe();
    });
  }
}