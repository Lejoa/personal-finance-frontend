import { Injectable, Injector, inject } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, catchError, throwError, switchMap, BehaviorSubject, take, filter } from 'rxjs';
import { Router } from '@angular/router';
import { AuthService } from '../../features/auth/services/auth.service';

/**
 * HTTP interceptor that automatically attaches the JWT access token
 * to every outgoing request and handles authentication errors.
 * Attempts a transparent token refresh when a 401 response is received.
 */
@Injectable()
export class JwtInterceptor implements HttpInterceptor {

  private injector = inject(Injector);
  private router = inject(Router);

  private isRefreshing = false;
  private refreshTokenSubject = new BehaviorSubject<string | null>(null);

  // Lazy getter to break the circular dependency between the interceptor and AuthService
  private get authService(): AuthService {
    return this.injector.get(AuthService);
  }

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const token = localStorage.getItem('auth_token');

    if (token) {
      request = this.addTokenToRequest(request, token);
    }

    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401) {
          if (request.url.includes('api/token/refresh')) {
            console.error('[JwtInterceptor] Refresh token expired, logging out');
            this.authService.logout(false);
            return throwError(() => error);
          }

          return this.handle401Error(request, next);
        }

        return throwError(() => error);
      })
    );
  }

  private addTokenToRequest(request: HttpRequest<unknown>, token: string): HttpRequest<unknown> {
    return request.clone({
      setHeaders: { Authorization: `Bearer ${token}` }
    });
  }

  private handle401Error(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    if (!this.isRefreshing) {
      this.isRefreshing = true;
      this.refreshTokenSubject.next(null);

      return this.authService.refreshAccessToken().pipe(
        switchMap((response) => {
          this.isRefreshing = false;
          this.refreshTokenSubject.next(response.accessToken);
          return next.handle(this.addTokenToRequest(request, response.accessToken));
        }),
        catchError((error) => {
          console.error('[JwtInterceptor] Failed to refresh token, logging out');
          this.isRefreshing = false;
          this.authService.logout(false);
          this.router.navigate(['/login'], { queryParams: { error: 'session_expired' } });
          return throwError(() => error);
        })
      );
    }

    return this.refreshTokenSubject.pipe(
      filter(token => token !== null),
      take(1),
      switchMap(token => next.handle(this.addTokenToRequest(request, token!)))
    );
  }
}
