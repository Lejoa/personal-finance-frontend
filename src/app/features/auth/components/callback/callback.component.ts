import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { AuthService } from '../../services/auth.service';

/**
 * Componente que maneja el callback de OAuth después de la autenticación con Google
 * Procesa el token JWT y redirige al usuario
 */
@Component({
  selector: 'app-callback',
  standalone: true,
  imports: [],
  templateUrl: './callback.component.html',
  styleUrl: './callback.component.scss'
})
export class CallbackComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private authService = inject(AuthService);

  // Subject para manejar la desuscripción
  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    console.log('[CallbackComponent] Iniciando procesamiento del callback');

    // Obtener el token, refresh token y posibles errores de los query params
    this.route.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
       console.log('[CallbackComponent] Query params recibidos:');

        const token = params['token'];
        const refreshToken = params['refreshToken'];  
        const error = params['error'];
        const message = params['message'];

        if (token) {
          console.log('[CallbackComponent] Token y refreshToken recibidos, procesando con AuthService...');
          // Si hay token, procesarlo con el servicio de autenticación
          // Pasar ambos tokens (access token y refresh token)
          this.authService.handleOAuthCallback(token, refreshToken);
        } else if (error) {
          // Si hay error, redirigir al login con el mensaje de error
          console.error('[CallbackComponent] Error en OAuth callback:', error, message);
          this.router.navigate(['/login'], {
            queryParams: { error, message }
          });
        } else {
          // Si no hay ni token ni error, callback inválido
          console.error('[CallbackComponent] Callback OAuth inválido: sin token ni error.');
          this.router.navigate(['/login'], {
            queryParams: { error: 'invalid_callback' }
          });
        }
      });
  }

  ngOnDestroy(): void {
    // Limpiar suscripciones
    this.destroy$.next();
    this.destroy$.complete();
  }
}
