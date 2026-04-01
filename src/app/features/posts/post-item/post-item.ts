import { Component, Input } from '@angular/core';
import { Post } from '../../../shared/models/post.interface';

@Component({
  selector: 'app-post-item',
  standalone: true,
  imports: [],
  templateUrl: './post-item.html',
  styleUrl: './post-item.css',
})
export class PostItem {
  @Input() post!: Post;
}
