import { Injectable, inject } from '@angular/core';
import { Router, CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth.service';

/**
 * Guard que protege rutas privadas
 * Solo permite acceso si el usuario está autenticado
 */
@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  private authService = inject(AuthService);
  private router = inject(Router);

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {

    // Verificar si hay un token (suficiente para permitir acceso)
    // El perfil del usuario se cargará en segundo plano
    const hasToken = this.authService.getToken() !== null;

    if (hasToken) {
      console.log('[AuthGuard] Acceso permitido');
      return true;
    }

    // Si no hay token, redirigir al login
    // Guardar la URL intentada para redirigir después del login
    return this.router.createUrlTree(['/login'], {
      queryParams: { returnUrl: state.url }
    });
  }
}
