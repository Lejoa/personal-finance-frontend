import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { MonthNavigatorComponent } from './month-navigator.component';
import { MonthStateService } from '../../../core/services/month-state/month-state.service';

describe('MonthNavigatorComponent', () => {
  let component: MonthNavigatorComponent;
  let fixture: ComponentFixture<MonthNavigatorComponent>;
  let monthStateServiceSpy: jasmine.SpyObj<MonthStateService>;
  const fixedMonth = new Date(2024, 4, 1); // mayo 2024

  beforeEach(async () => {
    monthStateServiceSpy = jasmine.createSpyObj('MonthStateService', ['setMonth'], {
      selectedMonth: fixedMonth
    });

    await TestBed.configureTestingModule({
      imports: [MonthNavigatorComponent],
      providers: [
        { provide: MonthStateService, useValue: monthStateServiceSpy }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(MonthNavigatorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('currentMonth getter', () => {
    it('should return selectedMonth from MonthStateService', () => {
      expect(component.currentMonth).toBe(fixedMonth);
    });
  });

  describe('displayLabel getter', () => {
    it('should return a capitalized month and year label in Spanish', () => {
      const label = component.displayLabel;
      expect(label.charAt(0)).toBe(label.charAt(0).toUpperCase());
      expect(label).toContain('2024');
    });
  });

  describe('goToPreviousMonth', () => {
    it('should call setMonth with the previous month', () => {
      component.goToPreviousMonth();
      const [called] = monthStateServiceSpy.setMonth.calls.mostRecent().args;
      expect(called.getFullYear()).toBe(2024);
      expect(called.getMonth()).toBe(3); // abril
    });

    it('should emit monthChange with the previous month', () => {
      const emitted: Date[] = [];
      component.monthChange.subscribe(d => emitted.push(d));

      component.goToPreviousMonth();

      expect(emitted.length).toBe(1);
      expect(emitted[0].getMonth()).toBe(3); // abril
    });
  });

  describe('goToNextMonth', () => {
    it('should call setMonth with the next month', () => {
      component.goToNextMonth();
      const [called] = monthStateServiceSpy.setMonth.calls.mostRecent().args;
      expect(called.getFullYear()).toBe(2024);
      expect(called.getMonth()).toBe(5); // junio
    });

    it('should emit monthChange with the next month', () => {
      const emitted: Date[] = [];
      component.monthChange.subscribe(d => emitted.push(d));

      component.goToNextMonth();

      expect(emitted.length).toBe(1);
      expect(emitted[0].getMonth()).toBe(5); // junio
    });

    it('should wrap from December to January of the next year', () => {
      monthStateServiceSpy = jasmine.createSpyObj('MonthStateService', ['setMonth'], {
        selectedMonth: new Date(2024, 11, 1) // diciembre
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (component as any).monthStateService = monthStateServiceSpy;

      component.goToNextMonth();

      const [called] = monthStateServiceSpy.setMonth.calls.mostRecent().args;
      expect(called.getFullYear()).toBe(2025);
      expect(called.getMonth()).toBe(0); // enero
    });
  });
});
