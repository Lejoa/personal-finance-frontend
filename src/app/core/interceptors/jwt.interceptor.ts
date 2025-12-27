import { Injectable, Injector } from '@angular/core';
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
 * Interceptor HTTP que agrega autom�ticamente el token JWT
 * a todas las peticiones salientes y maneja errores de autenticaci�n
 * Intenta refrescar el token automaticamente cuando recibe error 401
 */
@Injectable()
export class JwtInterceptor implements HttpInterceptor {

  private isRefreshing = false;
  private refreshTokenSubject: BehaviorSubject<string | null> = new BehaviorSubject<string | null>(null);
  
  constructor(
    private injector: Injector,
    private router: Router
  ) {}

  // Lazy getter para AuthService para evitar dependencia circular
  private get authService(): AuthService {
    return this.injector.get(AuthService);
  }

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    // Obtener el token directamente de localStorage para evitar dependencia circular
    const token = localStorage.getItem('auth_token');

    // Si existe token, clonar la peticion y agregar el header Authorization
    if (token) {
      request = this.addTokenToRequest(request, token);
    }

    // Continuar con la peticion y manejar posibles errores de autenticaci�n
    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        // Si recibimos error 401 (Unauthorized), el token probablemente expir�
        if (error.status === 401) {
          // Verificar si la petición fallida NO es el refresh token endpoint 
          // para evitar bucles infinitos
          if(request.url.includes('api/token/refresh')) {
            console.error('[JWTInterceptor] Refresh token expirado, haciendo logout'); 
            this.authService.logout(false);
            return throwError(() => error);
          }
          
          // Intentar refrescar el token
          return this.handle401Error(request, next);
        }

        // Propagar el error para que lo manejen los componentes si es necesario
        return throwError(() => error);
      })
    );
  }

  /**
   * Agrega el token JWT al header Authorization de la petición 
   */
  private addTokenToRequest(request: HttpRequest<any>, token: string): HttpRequest<any> {
    return request.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    })
  }

  /**
   * Maneja errores 401 intentando refrescar el token
   */
  private handle401Error(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (!this.isRefreshing) {
      this.isRefreshing = true;
      this.refreshTokenSubject.next(null);

      console.log('[JWTInterceptor] Token expirado, intentando refrescar...');

      return this.authService.refreshAccessToken().pipe(
        switchMap((response) => {
          console.log('[JWTInterceptor] Token refrescado con éxito');
          this.isRefreshing = false;
          this.refreshTokenSubject.next(response.accessToken);

          // Reintentar la petición original con el nuevo token
          return next.handle(this.addTokenToRequest(
            request,
            response.accessToken
          ));
        }),
        catchError((error) => {
          console.error('[JWTInterceptor] Error al refrescar el token, haciendo logout');
          this.isRefreshing = false;
          this.authService.logout(false);
          this.router.navigate(['/login'], {
            queryParams: { error: 'session_expired'}
          });
          return throwError(() => error);
        })
      );
    } else {

      console.log('[JwtInterceptor] Ya hay un refersh en progreso, esperando ...');
      return this.refreshTokenSubject.pipe(
        filter( token => token != null ),
        take(1),
        switchMap( token => next.handle(
          this.addTokenToRequest(request, token!)
        ))
      );
    }
  }
}
