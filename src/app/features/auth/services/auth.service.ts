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

  // Lazy getter para HttpClient para evitar dependencia circular con el interceptor
  private get http(): HttpClient {
    return this.injector.get(HttpClient);
  }

  private readonly apiUrl = environment.apiUrl || 'https://localhost';

  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$: Observable<User | null> = this.currentUserSubject.asObservable();

  // Flag para evitar múltiples refresh simultáneos
  private isRefreshing = false;

  constructor() {
    this.checkAuthStatus();
  }

  /**
   * Verifica si hay sesión activa al cargar la aplicación.
   * Si hay token, intenta cargar el perfil; si falla, intenta refrescar.
   */
  private checkAuthStatus(): void {
    if (!this.getToken()) return;
    this.loadUserProfileOrRefresh();
  }

  private loadUserProfileOrRefresh(): void {
    this.getUserProfile().subscribe({
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
      next: () => {},
      error: () => this.logout(false)
    });
  }

  /**
   * Dispatcher de autenticación OAuth: delega al flujo web o nativo según la plataforma.
   *
   * En web: redirige el browser al endpoint OAuth del backend (flujo original).
   * En nativo: abre un Chrome Custom Tab y escucha el deep link del callback.
   */
  loginWithGoogle(): void {
    if (this.platform.isNative) {
      this.loginWithGoogleNative();
    } else {
      window.location.href = `${this.apiUrl}/auth/google`;
    }
  }

  /**
   * Flujo OAuth nativo para Android usando Capacitor.
   *
   * Usa imports dinámicos para evitar que el código de Capacitor se incluya
   * en la build web. El bundler (esbuild) hace tree-shaking de estos imports
   * cuando están dentro de un branch que nunca se ejecuta en web.
   *
   * Pasos:
   * 1. Registrar listener 'appUrlOpen' ANTES de abrir el browser.
   *    Cuando el backend redirige a personalfinance://auth/callback?token=X,
   *    Android enruta la URL a MainActivity y Capacitor dispara este evento.
   * 2. Abrir Chrome Custom Tab apuntando al endpoint OAuth del backend,
   *    con ?client=android para que el backend sepa a qué scheme redirigir.
   * 3. Al recibir appUrlOpen: cerrar el browser y procesar los tokens.
   */
  private loginWithGoogleNative(): void {
    Promise.all([
      import('@capacitor/app'),
      import('@capacitor/browser')
    ]).then(([{ App }, { Browser }]) => {

      // Registrar el listener del deep link antes de abrir el browser
      App.addListener('appUrlOpen', async (event) => {
        const url = new URL(event.url);
        const token = url.searchParams.get('token');
        const refreshToken = url.searchParams.get('refreshToken');
        const error = url.searchParams.get('error');

        await Browser.close();

        if (token) {
          this.handleOAuthCallback(token, refreshToken ?? undefined);
        } else if (error) {
          console.error('[AuthService] Error en callback nativo:', error);
          this.router.navigate(['/login']);
        }
      });

      Browser.open({ url: `${this.apiUrl}/auth/google?client=android` });
    });
  }

  /**
   * Persiste los tokens recibidos del callback OAuth en localStorage.
   */
  private persistTokens(token: string, refreshToken?: string): void {
    this.saveToken(token);
    if (refreshToken) {
      this.saveRefreshToken(refreshToken);
    }
  }

  /**
   * Procesa el callback de OAuth: guarda los tokens y carga el perfil del usuario.
   */
  handleOAuthCallback(token: string, refreshToken?: string): void {
    this.persistTokens(token, refreshToken);

    this.getUserProfile().subscribe({
      next: (user) => {
        this.currentUserSubject.next(user);
        this.router.navigate(['/']);
      },
      error: (error) => {
        console.error('[AuthService] Error al obtener perfil después del callback:', error);
        this.logout();
        this.router.navigate(['/login'], {
          queryParams: { error: 'profile_fetch_failed' }
        });
      }
    });
  }

  /**
   * Obtiene el perfil del usuario autenticado desde el backend.
   */
  getUserProfile(): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/api/me`).pipe(
      tap(user => this.currentUserSubject.next(user)),
      catchError(error => {
        console.error('[AuthService] Error al obtener perfil:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Refresca el access token usando el refresh token almacenado.
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
        console.error('[AuthService] Error al refrescar token:', error);
        this.isRefreshing = false;
        this.logout(false);
        return throwError(() => error);
      })
    );
  }

  /**
   * Cierra la sesión del usuario. Limpia tokens locales y redirige al login.
   * @param revokeOnBackend Si es true, revoca el refresh token en el backend (default: true).
   *   Se omite cuando ya estamos offline o en flujos internos para evitar dependencia circular.
   */
  logout(revokeOnBackend: boolean = true): void {
    const refreshToken = this.getRefreshToken();

    if (refreshToken && revokeOnBackend) {
      this.http.post(`${this.apiUrl}/api/auth/logout`, { refreshToken }).subscribe({
        next: () => console.log('[AuthService] Logout exitoso en el backend'),
        error: (error) => console.error('[AuthService] Error al hacer logout en el backend:', error)
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
