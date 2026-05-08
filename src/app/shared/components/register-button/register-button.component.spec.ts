import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { RegisterButtonComponent } from './register-button.component';
import { TabService } from '../../../core/services/tab/tab.service';

describe('RegisterButtonComponent', () => {
  let component: RegisterButtonComponent;
  let fixture: ComponentFixture<RegisterButtonComponent>;
  let tabServiceSpy: jasmine.SpyObj<TabService>;

  beforeEach(async () => {
    tabServiceSpy = jasmine.createSpyObj('TabService', ['setActiveTab']);

    await TestBed.configureTestingModule({
      imports: [RegisterButtonComponent],
      providers: [
        { provide: TabService, useValue: tabServiceSpy }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(RegisterButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('navigateToCreate', () => {
    it('should call tabService.setActiveTab with "Create"', () => {
      component.navigateToCreate();
      expect(tabServiceSpy.setActiveTab).toHaveBeenCalledOnceWith('Create');
    });
  });
});
