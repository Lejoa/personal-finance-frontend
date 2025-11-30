import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { AuthService } from '../../features/auth/services/auth.service';

/**
 * Interceptor HTTP que agrega autom�ticamente el token JWT
 * a todas las peticiones salientes y maneja errores de autenticaci�n
 */
@Injectable()
export class JwtInterceptor implements HttpInterceptor {

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    // Obtener el token del servicio de autenticaci�n
    const token = this.authService.getToken();

    // Si existe token, clonar la peticion y agregar el header Authorization
    if (token) {
      request = request.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
    }

    // Continuar con la peticion y manejar posibles errores de autenticaci�n
    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        // Si recibimos error 401 (Unauthorized), el token probablemente expir�
        if (error.status === 401) {
          // Cerrar sesi�n y redirigir al login
          this.authService.logout();
          this.router.navigate(['/login'], {
            queryParams: { error: 'session_expired' }
          });
        }

        // Propagar el error para que lo manejen los componentes si es necesario
        return throwError(() => error);
      })
    );
  }
}
