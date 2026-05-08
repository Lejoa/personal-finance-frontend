import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { Subject } from 'rxjs';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { CallbackComponent } from './callback.component';
import { AuthService } from '../../services/auth.service';

describe('CallbackComponent', () => {
  let component: CallbackComponent;
  let fixture: ComponentFixture<CallbackComponent>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let routerSpy: jasmine.SpyObj<Router>;
  let queryParamsSubject: Subject<Params>;

  beforeEach(async () => {
    queryParamsSubject = new Subject<Params>();
    authServiceSpy = jasmine.createSpyObj('AuthService', ['handleOAuthCallback']);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [CallbackComponent],
      providers: [
        { provide: ActivatedRoute, useValue: { queryParams: queryParamsSubject.asObservable() } },
        { provide: Router, useValue: routerSpy },
        { provide: AuthService, useValue: authServiceSpy }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(CallbackComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('processCallbackParams', () => {
    it('should call handleOAuthCallback with token and refreshToken when token param is present', () => {
      queryParamsSubject.next({ token: 'abc123', refreshToken: 'refresh456' });

      expect(authServiceSpy.handleOAuthCallback).toHaveBeenCalledOnceWith('abc123', 'refresh456');
      expect(routerSpy.navigate).not.toHaveBeenCalled();
    });

    it('should call handleOAuthCallback with undefined refreshToken when only token is present', () => {
      queryParamsSubject.next({ token: 'abc123' });

      expect(authServiceSpy.handleOAuthCallback).toHaveBeenCalledOnceWith('abc123', undefined);
      expect(routerSpy.navigate).not.toHaveBeenCalled();
    });

    it('should navigate to /login with error params when error param is present', () => {
      queryParamsSubject.next({ error: 'oauth_failed', message: 'Something went wrong' });

      expect(routerSpy.navigate).toHaveBeenCalledOnceWith(['/login'], {
        queryParams: { error: 'oauth_failed', message: 'Something went wrong' }
      });
      expect(authServiceSpy.handleOAuthCallback).not.toHaveBeenCalled();
    });

    it('should navigate to /login with invalid_callback when no token or error is present', () => {
      queryParamsSubject.next({});

      expect(routerSpy.navigate).toHaveBeenCalledOnceWith(['/login'], {
        queryParams: { error: 'invalid_callback' }
      });
      expect(authServiceSpy.handleOAuthCallback).not.toHaveBeenCalled();
    });
  });
});
