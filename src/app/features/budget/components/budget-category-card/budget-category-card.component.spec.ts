import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BudgetCategoryCardComponent } from './budget-category-card.component';
import { BudgetService } from '../../../../shared/services/budget.service';
import { BudgetCategoryView } from '../../interfaces';

const MOCK_CATEGORY: BudgetCategoryView = {
  categoryId: 1,
  categoryName: 'Alimentación',
  limit: 500000,
  spent: 200000,
  remaining: 300000,
  isOverBudget: false,
  budgetId: 10,
  budgetCategoryId: 20
};

describe('BudgetCategoryCardComponent', () => {
  let component: BudgetCategoryCardComponent;
  let fixture: ComponentFixture<BudgetCategoryCardComponent>;
  let budgetServiceSpy: jasmine.SpyObj<BudgetService>;
  let snackBar: MatSnackBar;

  beforeEach(async () => {
    budgetServiceSpy = jasmine.createSpyObj('BudgetService', ['updateBudgetCategoryAmount', 'deleteBudgetCategory']);

    await TestBed.configureTestingModule({
      imports: [BudgetCategoryCardComponent, NoopAnimationsModule],
      providers: [
        { provide: BudgetService, useValue: budgetServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(BudgetCategoryCardComponent);
    component = fixture.componentInstance;
    component.category = MOCK_CATEGORY;
    component.selectedMonth = new Date('2026-04-01');

    // Obtener MatSnackBar del injector del fixture y espiar su método open
    snackBar = fixture.debugElement.injector.get(MatSnackBar);
    spyOn(snackBar, 'open');

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('openEditModal', () => {
    it('opens modal and pre-fills modalLimit with current limit', () => {
      component.openEditModal();

      expect(component.isModalOpen).toBeTrue();
      expect(component.modalLimit).toBe(MOCK_CATEGORY.limit);
    });
  });

  describe('closeEditModal', () => {
    it('closes modal and resets state', () => {
      component.openEditModal();
      component.closeEditModal();

      expect(component.isModalOpen).toBeFalse();
      expect(component.modalLimit).toBe(0);
      expect(component.isSaving).toBeFalse();
    });
  });

  describe('saveBudgetCategoryEdit', () => {
    it('calls updateBudgetCategoryAmount with correct arguments', fakeAsync(() => {
      budgetServiceSpy.updateBudgetCategoryAmount.and.returnValue(of(undefined));
      component.openEditModal();
      component.modalLimit = 600000;

      component.saveBudgetCategoryEdit();
      tick();

      expect(budgetServiceSpy.updateBudgetCategoryAmount).toHaveBeenCalledWith(10, 20, 600000);
    }));

    it('emits categoryChanged and closes modal on success', fakeAsync(() => {
      budgetServiceSpy.updateBudgetCategoryAmount.and.returnValue(of(undefined));
      const emitSpy = spyOn(component.categoryChanged, 'emit');
      component.openEditModal();
      component.modalLimit = 600000;

      component.saveBudgetCategoryEdit();
      tick();

      expect(emitSpy).toHaveBeenCalled();
      expect(component.isModalOpen).toBeFalse();
    }));

    it('shows success snack bar on success', fakeAsync(() => {
      budgetServiceSpy.updateBudgetCategoryAmount.and.returnValue(of(undefined));
      component.openEditModal();
      component.modalLimit = 600000;

      component.saveBudgetCategoryEdit();
      tick();

      expect(snackBar.open).toHaveBeenCalledWith(
        jasmine.stringContaining('actualizado'),
        jasmine.any(String),
        jasmine.objectContaining({ panelClass: ['snack-success'] })
      );
    }));

    it('shows error snack bar and resets isSaving on error', fakeAsync(() => {
      budgetServiceSpy.updateBudgetCategoryAmount.and.returnValue(throwError(() => new Error()));
      component.openEditModal();
      component.modalLimit = 600000;

      component.saveBudgetCategoryEdit();
      tick();

      expect(component.isSaving).toBeFalse();
      expect(snackBar.open).toHaveBeenCalledWith(
        jasmine.stringContaining('No se pudo'),
        jasmine.any(String),
        jasmine.objectContaining({ panelClass: ['snack-error'] })
      );
    }));

    it('does nothing when modalLimit is 0', () => {
      component.openEditModal();
      component.modalLimit = 0;

      component.saveBudgetCategoryEdit();

      expect(budgetServiceSpy.updateBudgetCategoryAmount).not.toHaveBeenCalled();
    });
  });

  describe('deleteBudgetCategory', () => {
    it('calls deleteBudgetCategory service with correct ids', fakeAsync(() => {
      budgetServiceSpy.deleteBudgetCategory.and.returnValue(of(undefined));

      component.deleteBudgetCategory();
      tick();

      expect(budgetServiceSpy.deleteBudgetCategory).toHaveBeenCalledWith(10, 20);
    }));

    it('emits categoryChanged on success', fakeAsync(() => {
      budgetServiceSpy.deleteBudgetCategory.and.returnValue(of(undefined));
      const emitSpy = spyOn(component.categoryChanged, 'emit');

      component.deleteBudgetCategory();
      tick();

      expect(emitSpy).toHaveBeenCalled();
    }));

    it('shows success snack bar on success', fakeAsync(() => {
      budgetServiceSpy.deleteBudgetCategory.and.returnValue(of(undefined));

      component.deleteBudgetCategory();
      tick();

      expect(snackBar.open).toHaveBeenCalledWith(
        jasmine.stringContaining('eliminada'),
        jasmine.any(String),
        jasmine.objectContaining({ panelClass: ['snack-success'] })
      );
    }));

    it('shows error snack bar on error', fakeAsync(() => {
      budgetServiceSpy.deleteBudgetCategory.and.returnValue(throwError(() => new Error()));

      component.deleteBudgetCategory();
      tick();

      expect(snackBar.open).toHaveBeenCalledWith(
        jasmine.stringContaining('No se pudo'),
        jasmine.any(String),
        jasmine.objectContaining({ panelClass: ['snack-error'] })
      );
    }));
  });
});
