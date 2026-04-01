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
          const items = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Post[];
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
}