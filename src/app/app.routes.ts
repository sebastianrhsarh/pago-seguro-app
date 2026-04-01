import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login/login';
import { PostList } from './features/posts/post-list/post-list';
import { MyPurchases } from './features/transactions/my-purchases/my-purchases';
import { MySales } from './features/transactions/my-sales/my-sales';

export const routes: Routes = [
  { path: '', component: PostList },
  { path: 'login', component: LoginComponent },
  { path: 'mis-compras', component: MyPurchases },
  { path: 'mis-ventas', component: MySales },
  { path: '**', redirectTo: '', pathMatch: 'full' }
];
