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
  private readonly clNumberFormatter = new Intl.NumberFormat('es-CL', {
    maximumFractionDigits: 0,
  });

  get isOwner(): boolean {
    const userId = this.authService.getCurrentUserId();
    return !!userId && this.post?.sellerId === userId;
  }

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {}

  ngOnChanges(_: SimpleChanges): void {}

  onCardClick(post: any): void {
    if (post?.id) {
      this.router.navigate(['/producto', post.id]);
    }
  }

  formatPrice(value: unknown): string {
    const amount = typeof value === 'number' ? value : Number(value ?? 0);
    return this.clNumberFormatter.format(Number.isFinite(amount) ? amount : 0);
  }
}
