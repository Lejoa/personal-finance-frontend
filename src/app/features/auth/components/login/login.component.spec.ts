import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { Subject } from 'rxjs';
import { ActivatedRoute, Params } from '@angular/router';
import { LoginComponent } from './login.component';
import { AuthService } from '../../services/auth.service';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let queryParamsSubject: Subject<Params>;

  beforeEach(async () => {
    queryParamsSubject = new Subject<Params>();
    authServiceSpy = jasmine.createSpyObj('AuthService', ['loginWithGoogle']);

    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        { provide: ActivatedRoute, useValue: { queryParams: queryParamsSubject.asObservable() } },
        { provide: AuthService, useValue: authServiceSpy }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should leave errorMessage null when no error param is present', () => {
      queryParamsSubject.next({});
      expect(component.errorMessage).toBeNull();
    });

    it('should set errorMessage when error param is present', () => {
      queryParamsSubject.next({ error: 'oauth_failed' });
      expect(component.errorMessage).not.toBeNull();
    });
  });

  describe('loginWithGoogle', () => {
    it('should call authService.loginWithGoogle', () => {
      component.loginWithGoogle();
      expect(authServiceSpy.loginWithGoogle).toHaveBeenCalledOnceWith();
    });
  });

  describe('error message resolution via queryParams', () => {
    it('should set the oauth_failed message', () => {
      queryParamsSubject.next({ error: 'oauth_failed' });
      expect(component.errorMessage).toBe('Error al autenticar con Google. Por favor, intenta nuevamente.');
    });

    it('should set the session_expired message', () => {
      queryParamsSubject.next({ error: 'session_expired' });
      expect(component.errorMessage).toBe('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
    });

    it('should set the profile_fetch_failed message', () => {
      queryParamsSubject.next({ error: 'profile_fetch_failed' });
      expect(component.errorMessage).toBe('No se pudo obtener tu información de perfil. Intenta nuevamente.');
    });

    it('should set the invalid_callback message', () => {
      queryParamsSubject.next({ error: 'invalid_callback' });
      expect(component.errorMessage).toBe('Error en el proceso de autenticación. Por favor, intenta nuevamente.');
    });

    it('should use the custom message param when provided', () => {
      queryParamsSubject.next({ error: 'unknown_code', message: 'Mensaje personalizado' });
      expect(component.errorMessage).toBe('Mensaje personalizado');
    });

    it('should fall back to the generic message for an unknown error code', () => {
      queryParamsSubject.next({ error: 'some_unknown_error' });
      expect(component.errorMessage).toBe('Ha ocurrido un error. Por favor, intenta nuevamente.');
    });
  });
});
