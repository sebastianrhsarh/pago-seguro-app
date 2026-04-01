import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { PostService } from '../../../core/services/post.service';
import { Post } from '../../../shared/models/post.interface';
import { PostItem } from '../post-item/post-item';

@Component({
  selector: 'app-post-list',
  standalone: true,
  imports: [CommonModule, PostItem],
  templateUrl: './post-list.html',
  styleUrl: './post-list.css',
})
export class PostList implements OnInit {
  posts$!: Observable<Post[]>;

  constructor(private postService: PostService) {
    this.posts$ = this.postService.getPosts();
  }

  ngOnInit(): void {}
}
