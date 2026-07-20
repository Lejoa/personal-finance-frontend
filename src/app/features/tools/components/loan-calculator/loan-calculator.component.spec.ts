import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import { LoanCalculatorComponent } from './loan-calculator.component';
import { LoanCalculatorService } from '../../services/loan-calculator.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SavedLoanCalculation } from '../../../../shared/models/loan.model';

const mockSaved: SavedLoanCalculation = {
  id: 1,
  name: 'Préstamo casa',
  amount: 10000000,
  annualRate: 12,
  termMonths: 24,
  extraPayment: 0,
  frequency: 'monthly',
  periodicPayment: 470735,
  totalInterest: 1297640,
  totalPaid: 11297640,
  createdAt: '2024-05-01T00:00:00Z'
};

describe('LoanCalculatorComponent', () => {
  let component: LoanCalculatorComponent;
  let fixture: ComponentFixture<LoanCalculatorComponent>;
  let loanServiceSpy: jasmine.SpyObj<LoanCalculatorService>;
  let snackBarSpy: jasmine.SpyObj<MatSnackBar>;

  beforeEach(async () => {
    loanServiceSpy = jasmine.createSpyObj('LoanCalculatorService', [
      'getCalculations', 'saveCalculation', 'deleteCalculation'
    ]);
    snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['open']);

    loanServiceSpy.getCalculations.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [LoanCalculatorComponent, NoopAnimationsModule],
      providers: [
        { provide: LoanCalculatorService, useValue: loanServiceSpy },
        { provide: MatSnackBar,           useValue: snackBarSpy }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(LoanCalculatorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should load saved calculations', () => {
      loanServiceSpy.getCalculations.and.returnValue(of([mockSaved]));
      component.ngOnInit();
      expect(component.savedCalculations).toEqual([mockSaved]);
    });
  });

  describe('togglePanel', () => {
    it('should open the panel', () => {
      component.togglePanel();
      expect(component.isPanelOpen).toBeTrue();
    });

    it('should close the panel and reset all fields', () => {
      component.isPanelOpen = true;
      component.amount = 5000;
      component.togglePanel();
      expect(component.isPanelOpen).toBeFalse();
      expect(component.amount).toBeNull();
    });
  });

  describe('frequencyLabel', () => {
    it('should return "Mensual" for monthly frequency', () => {
      component.frequency = 'monthly';
      expect(component.frequencyLabel()).toBe('Mensual');
    });

    it('should return "Quincenal" for biweekly frequency', () => {
      component.frequency = 'biweekly';
      expect(component.frequencyLabel()).toBe('Quincenal');
    });

    it('should return "Semanal" for weekly frequency', () => {
      component.frequency = 'weekly';
      expect(component.frequencyLabel()).toBe('Semanal');
    });
  });

  describe('calculate', () => {
    it('should set errorMessage when required fields are missing', () => {
      component.amount = null;
      component.calculate();
      expect(component.errorMessage).toBe('Completa los campos obligatorios.');
      expect(component.showResults).toBeFalse();
    });

    it('should set errorMessage when values are invalid', () => {
      component.amount = -1000;
      component.annualRate = 12;
      component.termMonths = 24;
      component.calculate();
      expect(component.errorMessage).toBe('Ingresa valores válidos.');
    });

    it('should compute result and set showResults to true with valid inputs', fakeAsync(() => {
      component.amount = 10000000;
      component.annualRate = 12;
      component.termMonths = 24;
      component.calculate();
      tick(100);
      expect(component.result).not.toBeNull();
      expect(component.showResults).toBeTrue();
      expect(component.result!.amount).toBe(10000000);
      expect(component.amortizationTable.length).toBeGreaterThan(0);
    }));

    it('should set activeTab to breakdown after calculation', fakeAsync(() => {
      component.amount = 10000000;
      component.annualRate = 12;
      component.termMonths = 24;
      component.calculate();
      tick(100);
      expect(component.activeTab).toBe('breakdown');
    }));
  });

  describe('closeResults', () => {
    it('should hide results and clear currentSavedId', () => {
      component.showResults = true;
      component.currentSavedId = 1;
      component.closeResults();
      expect(component.showResults).toBeFalse();
      expect(component.currentSavedId).toBeNull();
    });
  });

  describe('setTab', () => {
    it('should update activeTab', fakeAsync(() => {
      component.setTab('breakdown');
      tick(100);
      expect(component.activeTab).toBe('breakdown');
    }));
  });

  describe('openSaveModal / closeSaveModal', () => {
    it('should open the save modal', () => {
      component.openSaveModal();
      expect(component.showSaveModal).toBeTrue();
    });

    it('should close the save modal and clear saveName', () => {
      component.saveName = 'test';
      component.showSaveModal = true;
      component.closeSaveModal();
      expect(component.showSaveModal).toBeFalse();
      expect(component.saveName).toBe('');
    });
  });

  describe('confirmSave', () => {
    beforeEach(fakeAsync(() => {
      component.amount = 10000000;
      component.annualRate = 12;
      component.termMonths = 24;
      component.calculate();
      tick(100);
    }));

    it('should do nothing when saveName is empty', () => {
      component.saveName = '';
      component.confirmSave();
      expect(loanServiceSpy.saveCalculation).not.toHaveBeenCalled();
    });

    it('should save and prepend to savedCalculations on success', () => {
      loanServiceSpy.saveCalculation.and.returnValue(of(mockSaved));
      component.saveName = 'Préstamo casa';
      component.confirmSave();
      expect(component.savedCalculations[0]).toEqual(mockSaved);
      expect(component.currentSavedId).toBe(mockSaved.id);
      expect(component.isSaving).toBeFalse();
      expect(component.showSaveModal).toBeFalse();
    });

    it('should set isSaving to false on error', () => {
      loanServiceSpy.saveCalculation.and.returnValue(throwError(() => new Error()));
      component.saveName = 'Préstamo';
      component.confirmSave();
      expect(component.isSaving).toBeFalse();
    });
  });

  describe('deleteCurrentCalculation', () => {
    it('should do nothing when currentSavedId is null', () => {
      component.currentSavedId = null;
      component.deleteCurrentCalculation();
      expect(loanServiceSpy.deleteCalculation).not.toHaveBeenCalled();
    });

    it('should remove from savedCalculations and hide results on success', () => {
      loanServiceSpy.deleteCalculation.and.returnValue(of(void 0));
      component.savedCalculations = [mockSaved];
      component.currentSavedId = mockSaved.id;
      component.showResults = true;
      component.deleteCurrentCalculation();
      expect(component.savedCalculations.length).toBe(0);
      expect(component.showResults).toBeFalse();
      expect(component.isDeletingCurrent).toBeFalse();
    });

    it('should set isDeletingCurrent to false on error', () => {
      loanServiceSpy.deleteCalculation.and.returnValue(throwError(() => new Error()));
      component.currentSavedId = 1;
      component.deleteCurrentCalculation();
      expect(component.isDeletingCurrent).toBeFalse();
    });
  });

  describe('deleteCalculation', () => {
    it('should remove the calculation from the list on success', () => {
      loanServiceSpy.deleteCalculation.and.returnValue(of(void 0));
      component.savedCalculations = [mockSaved];
      component.deleteCalculation(mockSaved.id);
      expect(component.savedCalculations.length).toBe(0);
      expect(component.isDeleting).toBeNull();
    });

    it('should set isDeleting to null on error', () => {
      loanServiceSpy.deleteCalculation.and.returnValue(throwError(() => new Error()));
      component.deleteCalculation(99);
      expect(component.isDeleting).toBeNull();
    });
  });

  describe('loadSavedCalculation', () => {
    it('should populate form fields and trigger calculate', fakeAsync(() => {
      loanServiceSpy.getCalculations.and.returnValue(of([]));
      component.loadSavedCalculation(mockSaved);
      tick(100);
      expect(component.amount).toBe(mockSaved.amount);
      expect(component.annualRate).toBe(mockSaved.annualRate);
      expect(component.termMonths).toBe(mockSaved.termMonths);
      expect(component.frequency).toBe(mockSaved.frequency);
      expect(component.currentSavedId).toBe(mockSaved.id);
      expect(component.showResults).toBeTrue();
    }));
  });
});
