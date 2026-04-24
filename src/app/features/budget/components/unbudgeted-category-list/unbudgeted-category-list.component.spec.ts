import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { UnbudgetedCategoryListComponent } from './unbudgeted-category-list.component';
import { BudgetService } from '../../../../shared/services/budget.service';
import { UnbudgetedCategory } from '../../interfaces';
import { Budget } from '../../../../shared/models/budget.model';

const MOCK_CATEGORIES: UnbudgetedCategory[] = [
  { categoryId: 2, categoryName: 'Transporte', spent: 50000 },
  { categoryId: 3, categoryName: 'Ocio',       spent: 0     }
];

const MOCK_BUDGET: Budget = {
  id: 1,
  startDate: new Date('2026-04-01'),
  endDate: new Date('2026-04-30'),
  items: [],
  categories: []
};

describe('UnbudgetedCategoryListComponent', () => {
  let component: UnbudgetedCategoryListComponent;
  let fixture: ComponentFixture<UnbudgetedCategoryListComponent>;
  let budgetServiceSpy: jasmine.SpyObj<BudgetService>;
  let snackBar: MatSnackBar;

  beforeEach(async () => {
    budgetServiceSpy = jasmine.createSpyObj('BudgetService', ['setBudgetForCategory']);

    await TestBed.configureTestingModule({
      imports: [UnbudgetedCategoryListComponent, NoopAnimationsModule],
      providers: [
        { provide: BudgetService, useValue: budgetServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(UnbudgetedCategoryListComponent);
    component = fixture.componentInstance;
    component.categories = MOCK_CATEGORIES;
    component.selectedMonth = new Date('2026-04-01');
    component.currentBudget = MOCK_BUDGET;

    // Obtener MatSnackBar del injector del fixture y espiar su método open
    snackBar = fixture.debugElement.injector.get(MatSnackBar);
    spyOn(snackBar, 'open');

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('openModal', () => {
    it('sets selectedCategory and opens modal', () => {
      component.openModal(MOCK_CATEGORIES[0]);

      expect(component.isModalOpen).toBeTrue();
      expect(component.selectedCategory).toBe(MOCK_CATEGORIES[0]);
      expect(component.modalLimit).toBe(0);
    });
  });

  describe('closeModal', () => {
    it('closes modal and resets all state', () => {
      component.openModal(MOCK_CATEGORIES[0]);
      component.modalLimit = 300000;
      component.closeModal();

      expect(component.isModalOpen).toBeFalse();
      expect(component.selectedCategory).toBeNull();
      expect(component.modalLimit).toBe(0);
      expect(component.isSaving).toBeFalse();
    });
  });

  describe('saveBudgetCategoryLimit', () => {
    it('calls setBudgetForCategory with correct arguments', fakeAsync(() => {
      budgetServiceSpy.setBudgetForCategory.and.returnValue(of(MOCK_BUDGET));
      component.openModal(MOCK_CATEGORIES[0]);
      component.modalLimit = 300000;

      component.saveBudgetCategoryLimit();
      tick();

      expect(budgetServiceSpy.setBudgetForCategory).toHaveBeenCalledWith(
        2,
        300000,
        component.selectedMonth,
        MOCK_BUDGET
      );
    }));

    it('emits categoryAdded and closes modal on success', fakeAsync(() => {
      budgetServiceSpy.setBudgetForCategory.and.returnValue(of(MOCK_BUDGET));
      const emitSpy = spyOn(component.categoryAdded, 'emit');
      component.openModal(MOCK_CATEGORIES[0]);
      component.modalLimit = 300000;

      component.saveBudgetCategoryLimit();
      tick();

      expect(emitSpy).toHaveBeenCalled();
      expect(component.isModalOpen).toBeFalse();
    }));

    it('shows success snack bar on success', fakeAsync(() => {
      budgetServiceSpy.setBudgetForCategory.and.returnValue(of(MOCK_BUDGET));
      component.openModal(MOCK_CATEGORIES[0]);
      component.modalLimit = 300000;

      component.saveBudgetCategoryLimit();
      tick();

      expect(snackBar.open).toHaveBeenCalledWith(
        jasmine.stringContaining('fijado'),
        jasmine.any(String),
        jasmine.objectContaining({ panelClass: ['snack-success'] })
      );
    }));

    it('shows error snack bar and resets isSaving on error', fakeAsync(() => {
      budgetServiceSpy.setBudgetForCategory.and.returnValue(throwError(() => new Error()));
      component.openModal(MOCK_CATEGORIES[0]);
      component.modalLimit = 300000;

      component.saveBudgetCategoryLimit();
      tick();

      expect(component.isSaving).toBeFalse();
      expect(snackBar.open).toHaveBeenCalledWith(
        jasmine.stringContaining('No se pudo'),
        jasmine.any(String),
        jasmine.objectContaining({ panelClass: ['snack-error'] })
      );
    }));

    it('does nothing when selectedCategory is null', () => {
      component.modalLimit = 300000;

      component.saveBudgetCategoryLimit();

      expect(budgetServiceSpy.setBudgetForCategory).not.toHaveBeenCalled();
    });

    it('does nothing when modalLimit is 0', () => {
      component.openModal(MOCK_CATEGORIES[0]);
      component.modalLimit = 0;

      component.saveBudgetCategoryLimit();

      expect(budgetServiceSpy.setBudgetForCategory).not.toHaveBeenCalled();
    });
  });
});
