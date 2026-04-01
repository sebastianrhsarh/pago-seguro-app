import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { LoginComponent } from './features/auth/login/login';
import { CreatePostComponent } from './features/posts/create-post/create-post';
import { PostList } from './features/posts/post-list/post-list';
import { MyPurchases } from './features/transactions/my-purchases/my-purchases';
import { MySales } from './features/transactions/my-sales/my-sales';

export const routes: Routes = [
  { path: '', component: PostList },
  { path: 'login', component: LoginComponent },
  { path: 'crear-post', component: CreatePostComponent, canActivate: [authGuard] },
  { path: 'mis-compras', component: MyPurchases, canActivate: [authGuard] },
  { path: 'mis-ventas', component: MySales, canActivate: [authGuard] },
  { path: '**', redirectTo: '', pathMatch: 'full' }
];
