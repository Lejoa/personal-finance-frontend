import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap, catchError, throwError } from 'rxjs';
import { User, RefreshTokenResponse } from '../interfaces';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  // URL del backend
  private readonly API_URL = environment.apiUrl || 'https://localhost';

  // BehaviorSubject para el usuario autenticado (fuente de verdad)
  private currentUserSubject = new BehaviorSubject<User | null>(null);

  // Observable público para suscribirse al usuario actual
  public currentUser$: Observable<User | null> = this.currentUserSubject.asObservable();

  // Flag para evitar múltiples refresh simultáneos
  private isRefreshing = false;

  constructor() {
    // Al inicializar, verificar si hay un token guardado
    this.checkAuthStatus();
  }

  /**
   * Verifica si el usuario está autenticado al cargar la aplicación
   */
  private checkAuthStatus(): void {
    const token = this.getToken();
    if (token) {
      // Si hay token, intentar obtener los datos del usuario
      this.getUserProfile().subscribe({
        next: (user) => this.currentUserSubject.next(user),
        error: () => {
          // Si falla, intentar refrescar el token
          const refreshToken = this.getRefreshToken();
          if (refreshToken) {
            this.refreshAccessToken().subscribe({
              next: () => {
                // Después de refrescar, intentar obtener el perfil nuevamente
                this.getUserProfile().subscribe({
                  next: (user) => this.currentUserSubject.next(user),
                  error: () => this.logout()
                });
              },
              error: () => this.logout()
            });
          } else {
            this.logout();
          }
        }
      });
    }
  }

  /**
   * Inicia el flujo de autenticación OAuth con Google
   * Redirige al endpoint del backend que maneja OAuth
   */
  loginWithGoogle(): void {
    window.location.href = `${this.API_URL}/auth/google`;
  }

  /**
   * Procesa el callback de OAuth y guarda los tokens
   * @param token - Access token JWT recibido del backend
   * @param refreshToken - Refresh token recibido del backend
   */
  handleOAuthCallback(token: string, refreshToken?: string): void {
    this.saveToken(token);

    if (refreshToken) {
      this.saveRefreshToken(refreshToken);
    }

    // Obtener información del usuario desde el backend
    this.getUserProfile().subscribe({
      next: (user) => {
        this.currentUserSubject.next(user);
        // Redirigir a la página principal después del login exitoso
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
   * Obtiene la información del usuario autenticado desde el backend
   * Hace una petición al endpoint /api/me
   * @returns Observable con los datos del usuario
   */
  getUserProfile(): Observable<User> {
    return this.http.get<User>(`${this.API_URL}/api/me`).pipe(
      tap(user => {
        this.currentUserSubject.next(user);
      }),
      catchError(error => {
        console.error('[AuthService] Error al obtener perfil:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Refresca el access token usando el refresh token
   * @returns Observable con la respuesta de tokens renovados
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

    console.log('[AuthService] Refrescando access token...');

    return this.http.post<RefreshTokenResponse>(`${this.API_URL}/api/token/refresh`, {
      refreshToken
    }).pipe(
      tap(response => {
        console.log('[AuthService] Tokens refrescados exitosamente');
        // Guardar los nuevos tokens
        this.saveToken(response.accessToken);
        this.saveRefreshToken(response.refreshToken);
        this.isRefreshing = false;
      }),
      catchError(error => {
        console.error('[AuthService] Error al refrescar token:', error);
        this.isRefreshing = false;
        // Si el refresh falla, hacer logout
        this.logout();
        return throwError(() => error);
      })
    );
  }

  /**
   * Cierra la sesión del usuario
   * Limpia los tokens y redirige al login
   */
  logout(): void {
    const refreshToken = this.getRefreshToken();

    // Intentar revocar el refresh token en el backend
    if (refreshToken) {
      this.http.post(`${this.API_URL}/api/auth/logout`, { refreshToken }).subscribe({
        next: () => console.log('[AuthService] Logout exitoso en el backend'),
        error: (error) => console.error('[AuthService] Error al hacer logout en el backend:', error)
      });
    }

    // Limpiar tokens locales
    this.removeToken();
    this.removeRefreshToken();
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  /**
   * Guarda el access token JWT en el localStorage
   * @param token - Access token JWT
   */
  private saveToken(token: string): void {
    localStorage.setItem('auth_token', token);
  }

  /**
   * Obtiene el access token JWT del localStorage
   * @returns Access token JWT o null si no existe
   */
  getToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  /**
   * Elimina el access token JWT del localStorage
   */
  private removeToken(): void {
    localStorage.removeItem('auth_token');
  }

  /**
   * Guarda el refresh token en el localStorage
   * @param refreshToken - Refresh token
   */
  private saveRefreshToken(refreshToken: string): void {
    localStorage.setItem('refresh_token', refreshToken);
  }

  /**
   * Obtiene el refresh token del localStorage
   * @returns Refresh token o null si no existe
   */
  getRefreshToken(): string | null {
    return localStorage.getItem('refresh_token');
  }

  /**
   * Elimina el refresh token del localStorage
   */
  private removeRefreshToken(): void {
    localStorage.removeItem('refresh_token');
  }

  /**
   * Verifica si el usuario está autenticado
   * @returns true si hay token y usuario, false en caso contrario
   */
  isLoggedIn(): boolean {
    return this.getToken() !== null && this.currentUserSubject.value !== null;
  }

  /**
   * Obtiene el usuario actual de forma síncrona
   * @returns Usuario actual o null
   */
  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }
}
