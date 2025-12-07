import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap, catchError, throwError } from 'rxjs';
import { User } from '../interfaces';
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

  // Observable público para suscribrise al usuario actual
  public currentUser$: Observable<User | null> = this.currentUserSubject.asObservable();

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
        error: () => this.logout()
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
   * Procesa el callback de OAuth y guarda el token
   * @param token - Token JWT recibido del backend
   */
  handleOAuthCallback(token: string): void {
    this.saveToken(token);

    // Obtener información del usuario desde el backend
    this.getUserProfile().subscribe({
      next: (user) => {
        this.currentUserSubject.next(user);
        // Redirigir a la página principal después del login exitoso
        this.router.navigate(['/']);
      },
      error: (error) => {
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
        console.error('Error al obtener perfil:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Cierra la sesión del usuario
   * Limpia el token y redirige al login
   */
  logout(): void {
    this.removeToken();
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  /**
   * Guarda el token JWT en el localStorage
   * @param token - Token JWT
   */
  private saveToken(token: string): void {
    localStorage.setItem('auth_token', token);
  }

  /**
   * Obtiene el token JWT del localStorage
   * @returns Token JWT o null si no existe
   */
  getToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  /**
   * Elimina el token JWT del localStorage
   */
  private removeToken(): void {
    localStorage.removeItem('auth_token');
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
