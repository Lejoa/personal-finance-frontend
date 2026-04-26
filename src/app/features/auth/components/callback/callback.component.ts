import { Component, OnInit, inject, DestroyRef } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-callback',
  standalone: true,
  imports: [],
  templateUrl: './callback.component.html',
  styleUrl: './callback.component.scss'
})
export class CallbackComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private authService = inject(AuthService);
  private destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    this.route.queryParams
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(params => this.processCallbackParams(params));
  }

  private processCallbackParams(params: Params): void {
    const token = params['token'];
    const error = params['error'];

    if (token) {
      this.authService.handleOAuthCallback(token, params['refreshToken']);
    } else if (error) {
      this.router.navigate(['/login'], {
        queryParams: { error, message: params['message'] }
      });
    } else {
      this.router.navigate(['/login'], {
        queryParams: { error: 'invalid_callback' }
      });
    }
  }
}
