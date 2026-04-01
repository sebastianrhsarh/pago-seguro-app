import { Routes } from '@angular/router';
import { PostList } from './features/posts/post-list/post-list';

export const routes: Routes = [
  { path: '', component: PostList },
  { path: '**', redirectTo: '', pathMatch: 'full' }
];
