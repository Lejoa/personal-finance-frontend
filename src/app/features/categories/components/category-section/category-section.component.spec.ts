import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import { CategorySectionComponent } from './category-section.component';
import { CategoryService } from '../../../../shared/services/category.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Category } from '../../../../shared/models/category.model';

const mockCategory: Category = {
  id: 1,
  name: 'Comida',
  description: 'Gastos de alimentación',
  type: 'gasto'
};

describe('CategorySectionComponent', () => {
  let component: CategorySectionComponent;
  let fixture: ComponentFixture<CategorySectionComponent>;
  let categoryServiceSpy: jasmine.SpyObj<CategoryService>;
  let snackBarSpy: jasmine.SpyObj<MatSnackBar>;

  beforeEach(async () => {
    categoryServiceSpy = jasmine.createSpyObj('CategoryService', [
      'getCategories', 'createCategory', 'updateCategory', 'deleteCategory'
    ]);
    snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['open']);

    categoryServiceSpy.getCategories.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [CategorySectionComponent, NoopAnimationsModule],
      providers: [
        { provide: CategoryService, useValue: categoryServiceSpy },
        { provide: MatSnackBar,     useValue: snackBarSpy }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(CategorySectionComponent);
    component = fixture.componentInstance;
    component.type = 'gasto';
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('getters', () => {
    it('title should return "Categorías de Gasto" for type gasto', () => {
      expect(component.title).toBe('Categorías de Gasto');
    });

    it('title should return "Categorías de Ingreso" for type ingreso', () => {
      component.type = 'ingreso';
      expect(component.title).toBe('Categorías de Ingreso');
    });

    it('emptyMessage should return correct message for gasto', () => {
      expect(component.emptyMessage).toBe('Sin categorías de gasto');
    });

    it('ariaLabel should return correct label for gasto', () => {
      expect(component.ariaLabel).toBe('Añadir categoría de gasto');
    });
  });

  describe('ngOnInit', () => {
    it('should load categories filtered by type', () => {
      categoryServiceSpy.getCategories.and.returnValue(of([mockCategory]));
      component.ngOnInit();
      expect(categoryServiceSpy.getCategories).toHaveBeenCalledWith({ type: 'gasto' });
      expect(component.categories).toEqual([mockCategory]);
    });
  });

  describe('openCreateModal', () => {
    it('should open modal in create mode', () => {
      component.openCreateModal();
      expect(component.isModalOpen).toBeTrue();
      expect(component.isEditing).toBeFalse();
      expect(component.editingCategory).toBeNull();
      expect(component.categoryForm.name).toBe('');
      expect(component.categoryForm.type).toBe('gasto');
    });
  });

  describe('openEditModal', () => {
    it('should open modal in edit mode with category data', () => {
      component.openEditModal(mockCategory);
      expect(component.isModalOpen).toBeTrue();
      expect(component.isEditing).toBeTrue();
      expect(component.editingCategory).toEqual(mockCategory);
      expect(component.categoryForm.name).toBe(mockCategory.name);
    });
  });

  describe('closeModal', () => {
    it('should close the modal and reset editing state', () => {
      component.openEditModal(mockCategory);
      component.closeModal();
      expect(component.isModalOpen).toBeFalse();
      expect(component.editingCategory).toBeNull();
      expect(component.showDeleteConfirm).toBeFalse();
    });
  });

  describe('submitCategoryForm', () => {
    it('should do nothing when name is empty', () => {
      component.openCreateModal();
      component.categoryForm.name = '  ';
      component.submitCategoryForm();
      expect(categoryServiceSpy.createCategory).not.toHaveBeenCalled();
    });

    it('should call createCategory when not editing', () => {
      categoryServiceSpy.createCategory.and.returnValue(of(mockCategory));
      component.openCreateModal();
      component.categoryForm.name = 'Nueva';
      component.submitCategoryForm();
      expect(categoryServiceSpy.createCategory).toHaveBeenCalled();
    });

    it('should close modal and reload categories on create success', () => {
      categoryServiceSpy.createCategory.and.returnValue(of(mockCategory));
      categoryServiceSpy.getCategories.and.returnValue(of([mockCategory]));
      component.openCreateModal();
      component.categoryForm.name = 'Nueva';
      component.submitCategoryForm();
      expect(component.isModalOpen).toBeFalse();
      expect(component.isSaving).toBeFalse();
    });

    it('should call updateCategory when editing', () => {
      categoryServiceSpy.updateCategory.and.returnValue(of(mockCategory));
      component.openEditModal(mockCategory);
      component.categoryForm.name = 'Editada';
      component.submitCategoryForm();
      expect(categoryServiceSpy.updateCategory).toHaveBeenCalledWith(
        mockCategory.id,
        jasmine.objectContaining({ name: 'Editada' })
      );
    });

    it('should set isSaving to false on error', () => {
      categoryServiceSpy.createCategory.and.returnValue(throwError(() => new Error()));
      component.openCreateModal();
      component.categoryForm.name = 'Nueva';
      component.submitCategoryForm();
      expect(component.isSaving).toBeFalse();
    });
  });

  describe('requestDeleteConfirmation', () => {
    it('should show delete confirmation', () => {
      component.requestDeleteConfirmation();
      expect(component.showDeleteConfirm).toBeTrue();
      expect(component.deleteError).toBeNull();
    });
  });

  describe('deleteCategory', () => {
    it('should do nothing when no editingCategory', () => {
      component.editingCategory = null;
      component.deleteCategory();
      expect(categoryServiceSpy.deleteCategory).not.toHaveBeenCalled();
    });

    it('should call deleteCategory and close modal on success', () => {
      categoryServiceSpy.deleteCategory.and.returnValue(of(void 0));
      categoryServiceSpy.getCategories.and.returnValue(of([]));
      component.openEditModal(mockCategory);
      component.deleteCategory();
      expect(categoryServiceSpy.deleteCategory).toHaveBeenCalledWith(mockCategory.id);
      expect(component.isModalOpen).toBeFalse();
      expect(component.isDeleting).toBeFalse();
    });

    it('should set deleteError on error', () => {
      const error = { error: { error: 'Categoría en uso' } };
      categoryServiceSpy.deleteCategory.and.returnValue(throwError(() => error));
      component.openEditModal(mockCategory);
      component.deleteCategory();
      expect(component.deleteError).toBe('Categoría en uso');
      expect(component.isDeleting).toBeFalse();
    });
  });
});
