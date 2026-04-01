import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-post-item',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './post-item.html',
  styleUrl: './post-item.css',
})
export class PostItem implements OnInit, OnChanges {
  @Input() post: any = null;

  get isOwner(): boolean {
    const userId = this.authService.getCurrentUserId();
    return !!userId && this.post?.sellerId === userId;
  }

  constructor(
    private authService: AuthService,
    private router: Router
  ) {
    console.log('PostItem constructor');
  }

  ngOnInit(): void {
    console.log('PostItem ngOnInit, post:', this.post);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['post']) {
      console.log('PostItem ngOnChanges, post actualizado:', this.post);
    }
  }

  onCardClick(post: any): void {
    if (post?.id) {
      this.router.navigate(['/producto', post.id]);
    }
  }
}
