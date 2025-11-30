import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';

/**
 * Componente de login que muestra la pantalla de autenticación
 * Permite iniciar sesión con Google OAuth
 */
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private authService = inject(AuthService);

  // Mensaje de error para mostrar al usuario
  errorMessage: string | null = null;

  ngOnInit(): void {
    // Verificar si hay errores en los query params
    this.route.queryParams.subscribe(params => {
      const error = params['error'];
      const message = params['message'];

      if (error) {
        this.errorMessage = this.getErrorMessage(error, message);
      }
    });
  }

  /**
   * Inicia el flujo de autenticación con Google
   */
  loginWithGoogle(): void {
    this.authService.loginWithGoogle();
  }

  /**
   * Obtiene un mensaje de error amigable basado en el código de error
   * @param errorCode  - Código de error
   * @param customMessage -  Mensaje personalizado (opcional)
   * @returns Mensaje de error para mostrar al usuario
   */
  private getErrorMessage(errorCode: string, customMessage?: string): string {
    const errorMessages: { [key: string]: string } = {
      'oauth_failed': 'Error al autenticar con Google. Por favor, intenta nuevamente.',
      'session_expired': 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.',
      'profile_fetch_failed': 'No se pudo obtener tu información de perfil. Intenta nuevamente.',
      'invalid_callback': 'Error en el proceso de autenticación. Por favor, intenta nuevamente.',
    };

    return customMessage || errorMessages[errorCode] || 'Ha ocurrido un error. Por favor, intenta nuevamente.';
  }
}
