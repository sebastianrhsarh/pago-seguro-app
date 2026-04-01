import { Routes } from '@angular/router';
import { PostList } from './features/posts/post-list/post-list';
import { MyPurchases } from './features/transactions/my-purchases/my-purchases';

export const routes: Routes = [
  { path: '', component: PostList },
  { path: 'mis-compras', component: MyPurchases },
  { path: '**', redirectTo: '', pathMatch: 'full' }
];
