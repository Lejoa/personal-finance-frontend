import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { of } from 'rxjs';
import { ProfileMenuComponent } from './profile-menu.component';
import { AuthService } from '../../../auth/services/auth.service';

describe('ProfileMenuComponent', () => {
  let component: ProfileMenuComponent;
  let fixture: ComponentFixture<ProfileMenuComponent>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;

  beforeEach(async () => {
    authServiceSpy = jasmine.createSpyObj('AuthService', [], {
      currentUser$: of(null)
    });

    await TestBed.configureTestingModule({
      imports: [ProfileMenuComponent],
      providers: [
        { provide: AuthService, useValue: authServiceSpy }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(ProfileMenuComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('close', () => {
    it('should emit menuClosed', () => {
      const emitSpy = spyOn(component.menuClosed, 'emit');
      component.close();
      expect(emitSpy).toHaveBeenCalledOnceWith();
    });
  });

  describe('openCategories', () => {
    it('should emit categoriesClicked', () => {
      const emitSpy = spyOn(component.categoriesClicked, 'emit');
      component.openCategories();
      expect(emitSpy).toHaveBeenCalledOnceWith();
    });

    it('should also emit menuClosed when opening categories', () => {
      const closedSpy = spyOn(component.menuClosed, 'emit');
      component.openCategories();
      expect(closedSpy).toHaveBeenCalledOnceWith();
    });
  });
});
