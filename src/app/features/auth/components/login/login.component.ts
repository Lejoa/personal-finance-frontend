import { Component, OnInit, inject, DestroyRef } from '@angular/core';
import { ActivatedRoute, Params } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private authService = inject(AuthService);
  private destroyRef = inject(DestroyRef);

  errorMessage: string | null = null;

  ngOnInit(): void {
    this.route.queryParams
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(params => this.initErrorFromQueryParams(params));
  }

  loginWithGoogle(): void {
    this.authService.loginWithGoogle();
  }

  private initErrorFromQueryParams(params: Params): void {
    const errorCode = params['error'];
    if (errorCode) {
      this.errorMessage = this.resolveErrorMessage(errorCode, params['message']);
    }
  }

  private resolveErrorMessage(errorCode: string, customMessage?: string): string {
    const errorMessages: Record<string, string> = {
      'oauth_failed': 'Error al autenticar con Google. Por favor, intenta nuevamente.',
      'session_expired': 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.',
      'profile_fetch_failed': 'No se pudo obtener tu información de perfil. Intenta nuevamente.',
      'invalid_callback': 'Error en el proceso de autenticación. Por favor, intenta nuevamente.',
    };

    return customMessage || errorMessages[errorCode] || 'Ha ocurrido un error. Por favor, intenta nuevamente.';
  }
}
