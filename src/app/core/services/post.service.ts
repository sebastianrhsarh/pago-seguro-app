import { Injectable } from '@angular/core';
import { Firestore, collection, query, onSnapshot, doc, updateDoc, addDoc, getDoc } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { Post } from '../../shared/models/post.interface';

export type CreatePostPayload = Omit<Post, 'id'>;

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
          const items = snap.docs
            .map(doc => ({ id: doc.id, ...doc.data() }) as Post)
            .sort((left, right) => {
              const statusDifference = this.getStatusPriority(left.estado) - this.getStatusPriority(right.estado);

              if (statusDifference !== 0) {
                return statusDifference;
              }

              return this.getCreatedAtMs(right.createdAt) - this.getCreatedAtMs(left.createdAt);
            });

          subscriber.next(items);
        },
        error: (err) => subscriber.error(err)
      });
      return () => unsubscribe();
    });
  }

  updatePostStatus(postId: string, estado: string) {
    const ref = doc(this.firestore, `posts/${postId}`);
    return updateDoc(ref, { estado });
  }

  createPost(post: CreatePostPayload) {
    const postsRef = collection(this.firestore, 'posts');
    return addDoc(postsRef, post);
  }

  getPostById(postId: string): Observable<Post | null> {
    const ref = doc(this.firestore, `posts/${postId}`);
    return new Observable<Post | null>(subscriber => {
      const unsubscribe = onSnapshot(ref, {
        next: (snap) => {
          if (snap.exists()) {
            subscriber.next({ id: snap.id, ...snap.data() } as Post);
          } else {
            subscriber.next(null);
          }
        },
        error: (err) => subscriber.error(err)
      });
      return () => unsubscribe();
    });
  }

  async getPostByIdOnce(postId: string): Promise<Post | null> {
    const ref = doc(this.firestore, `posts/${postId}`);
    const snap = await getDoc(ref);

    if (!snap.exists()) {
      return null;
    }

    return { id: snap.id, ...snap.data() } as Post;
  }

  private getCreatedAtMs(value: unknown): number {
    if (value instanceof Date) {
      return value.getTime();
    }

    if (typeof value === 'object' && value !== null && 'toDate' in value && typeof value.toDate === 'function') {
      const date = value.toDate();
      return date instanceof Date ? date.getTime() : 0;
    }

    if (typeof value === 'string' || typeof value === 'number') {
      const date = new Date(value);
      return Number.isNaN(date.getTime()) ? 0 : date.getTime();
    }

    return 0;
  }

  private getStatusPriority(estado: Post['estado']): number {
    switch (estado) {
      case 'disponible':
        return 0;
      case 'reservado':
        return 1;
      case 'vendido':
        return 2;
      default:
        return 99;
    }
  }
}