import { Injectable, inject, Injector } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, switchMap, tap, catchError, throwError } from 'rxjs';
import { User, RefreshTokenResponse } from '../interfaces';
import { environment } from '../../../../environments/environment';
import { PlatformService } from '../../../core/services/platform/platform.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private injector = inject(Injector);
  private router = inject(Router);
  private platform = inject(PlatformService);

  // Lazy getter for HttpClient to break the circular dependency with the JWT interceptor
  private get http(): HttpClient {
    return this.injector.get(HttpClient);
  }

  private readonly apiUrl = environment.apiUrl || 'https://localhost';

  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$: Observable<User | null> = this.currentUserSubject.asObservable();

  // Guard against concurrent refresh calls
  private isRefreshing = false;

  constructor() {
    this.checkAuthStatus();
  }

  /**
   * Checks for an active session on application startup.
   * If a token exists, attempts to load the profile; on failure, attempts a token refresh.
   */
  private checkAuthStatus(): void {
    if (!this.getToken()) return;
    this.loadUserProfileOrRefresh();
  }

  private loadUserProfileOrRefresh(): void {
    this.getUserProfile().subscribe({
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      next: () => {},
      error: () => this.tryRefreshAndReloadProfile()
    });
  }

  private tryRefreshAndReloadProfile(): void {
    if (!this.getRefreshToken()) {
      this.logout(false);
      return;
    }

    this.refreshAccessToken().pipe(
      switchMap(() => this.getUserProfile())
    ).subscribe({
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      next: () => {},
      error: () => this.logout(false)
    });
  }

  /**
   * OAuth authentication dispatcher: delegates to the web or native flow based on the platform.
   *
   * Web: redirects the browser to the backend OAuth endpoint (standard flow).
   * Native: opens a Chrome Custom Tab and listens for the deep-link callback.
   */
  loginWithGoogle(): void {
    if (this.platform.isNative) {
      this.loginWithGoogleNative();
    } else {
      window.location.href = `${this.apiUrl}/auth/google`;
    }
  }

  /**
   * Native OAuth flow for Android using Capacitor.
   *
   * Dynamic imports are used so that Capacitor code is not bundled into the web build.
   * The bundler (esbuild) tree-shakes these imports when they are inside a branch
   * that never executes on web.
   *
   * Steps:
   * 1. Register the 'appUrlOpen' listener BEFORE opening the browser.
   *    When the backend redirects to personalfinance://auth/callback?token=X,
   *    Android routes the URL to MainActivity and Capacitor fires this event.
   * 2. Open a Chrome Custom Tab pointing to the backend OAuth endpoint,
   *    with ?client=android so the backend knows which scheme to redirect to.
   * 3. On receiving appUrlOpen: close the browser and process the tokens.
   */
  private loginWithGoogleNative(): void {
    Promise.all([
      import('@capacitor/app'),
      import('@capacitor/browser')
    ]).then(([{ App }, { Browser }]) => {

      // Register the deep-link listener before opening the browser
      App.addListener('appUrlOpen', async (event) => {
        const url = new URL(event.url);
        const token = url.searchParams.get('token');
        const refreshToken = url.searchParams.get('refreshToken');
        const error = url.searchParams.get('error');

        await Browser.close();

        if (token) {
          this.handleOAuthCallback(token, refreshToken ?? undefined);
        } else if (error) {
          console.error('[AuthService] Native callback error:', error);
          this.router.navigate(['/login']);
        }
      });

      Browser.open({ url: `${this.apiUrl}/auth/google?client=android` });
    });
  }

  /**
   * Persists tokens received from the OAuth callback to localStorage.
   */
  private persistTokens(token: string, refreshToken?: string): void {
    this.saveToken(token);
    if (refreshToken) {
      this.saveRefreshToken(refreshToken);
    }
  }

  /**
   * Handles the OAuth callback: saves tokens and loads the user profile.
   */
  handleOAuthCallback(token: string, refreshToken?: string): void {
    this.persistTokens(token, refreshToken);

    this.getUserProfile().subscribe({
      next: (user) => {
        this.currentUserSubject.next(user);
        this.router.navigate(['/']);
      },
      error: (error) => {
        console.error('[AuthService] Failed to load profile after OAuth callback:', error);
        this.logout();
        this.router.navigate(['/login'], {
          queryParams: { error: 'profile_fetch_failed' }
        });
      }
    });
  }

  /**
   * Fetches the authenticated user's profile from the backend.
   */
  getUserProfile(): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/api/me`).pipe(
      tap(user => this.currentUserSubject.next(user)),
      catchError(error => {
        console.error('[AuthService] Failed to fetch user profile:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Refreshes the access token using the stored refresh token.
   */
  refreshAccessToken(): Observable<RefreshTokenResponse> {
    const refreshToken = this.getRefreshToken();

    if (!refreshToken) {
      return throwError(() => new Error('No refresh token available'));
    }

    if (this.isRefreshing) {
      return throwError(() => new Error('Refresh already in progress'));
    }

    this.isRefreshing = true;

    return this.http.post<RefreshTokenResponse>(`${this.apiUrl}/api/token/refresh`, {
      refreshToken
    }).pipe(
      tap(response => {
        this.saveToken(response.accessToken);
        this.saveRefreshToken(response.refreshToken);
        this.isRefreshing = false;
      }),
      catchError(error => {
        console.error('[AuthService] Failed to refresh token:', error);
        this.isRefreshing = false;
        this.logout(false);
        return throwError(() => error);
      })
    );
  }

  /**
   * Logs out the user. Clears local tokens and redirects to the login page.
   * @param revokeOnBackend When true, revokes the refresh token on the backend (default: true).
   *   Skipped when already offline or in internal flows to avoid circular dependencies.
   */
  logout(revokeOnBackend = true): void {
    const refreshToken = this.getRefreshToken();

    if (refreshToken && revokeOnBackend) {
      this.http.post(`${this.apiUrl}/api/auth/logout`, { refreshToken }).subscribe({
        next: () => console.log('[AuthService] Backend logout successful'),
        error: (error) => console.error('[AuthService] Backend logout failed:', error)
      });
    }

    this.removeToken();
    this.removeRefreshToken();
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  private saveToken(token: string): void {
    localStorage.setItem('auth_token', token);
  }

  getToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  private removeToken(): void {
    localStorage.removeItem('auth_token');
  }

  private saveRefreshToken(refreshToken: string): void {
    localStorage.setItem('refresh_token', refreshToken);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem('refresh_token');
  }

  private removeRefreshToken(): void {
    localStorage.removeItem('refresh_token');
  }

  isLoggedIn(): boolean {
    return this.getToken() !== null && this.currentUserSubject.value !== null;
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }
}
