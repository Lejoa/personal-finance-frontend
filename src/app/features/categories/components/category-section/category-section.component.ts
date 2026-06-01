import { Component, Input, OnInit, inject, DestroyRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CategoryService } from '../../../../shared/services/category.service';
import { Category, CategoryType, CreateCategoryRequest, UpdateCategoryRequest } from '../../../../shared/models/category.model';
import { CategoryFormData } from '../../interfaces';

@Component({
  selector: 'app-category-section',
  standalone: true,
  imports: [FormsModule, MatSnackBarModule],
  templateUrl: './category-section.component.html',
  styleUrl: './category-section.component.scss'
})
export class CategorySectionComponent implements OnInit {
  @Input() type!: CategoryType;

  private categoryService = inject(CategoryService);
  private snackBar = inject(MatSnackBar);
  private destroyRef = inject(DestroyRef);

  categories: Category[] = [];

  isModalOpen = false;
  isEditing = false;
  editingCategory: Category | null = null;
  isSaving = false;
  isDeleting = false;
  showDeleteConfirm = false;
  deleteError: string | null = null;

  categoryForm!: CategoryFormData;

  get title(): string {
    return this.type === 'ingreso' ? 'Categorías de Ingreso' : 'Categorías de Gasto';
  }

  get emptyMessage(): string {
    return this.type === 'ingreso' ? 'Sin categorías de ingreso' : 'Sin categorías de gasto';
  }

  get ariaLabel(): string {
    return this.type === 'ingreso' ? 'Añadir categoría de ingreso' : 'Añadir categoría de gasto';
  }

  ngOnInit(): void {
    this.fetchCategoriesByType();
  }

  fetchCategoriesByType(): void {
    this.categoryService.getCategories({ type: this.type })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(categories => { this.categories = categories; });
  }

  openCreateModal(): void {
    this.isEditing = false;
    this.editingCategory = null;
    this.showDeleteConfirm = false;
    this.deleteError = null;
    this.categoryForm = { name: '', description: '', type: this.type };
    this.isModalOpen = true;
  }

  openEditModal(category: Category): void {
    this.isEditing = true;
    this.editingCategory = category;
    this.showDeleteConfirm = false;
    this.deleteError = null;
    this.categoryForm = { name: category.name, description: category.description, type: category.type };
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.editingCategory = null;
    this.showDeleteConfirm = false;
    this.deleteError = null;
  }

  submitCategoryForm(): void {
    if (!this.categoryForm.name.trim()) return;
    this.isSaving = true;

    if (this.isEditing && this.editingCategory) {
      const req: UpdateCategoryRequest = {
        name: this.categoryForm.name.trim(),
        description: this.categoryForm.description.trim()
      };
      this.categoryService.updateCategory(this.editingCategory.id, req)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => this.onCategoryMutationSuccess('Categoría actualizada correctamente'),
          error: () => {
            this.isSaving = false;
            this.showErrorSnackBar('No se pudo guardar la categoría. Intenta de nuevo.');
          }
        });
    } else {
      const req: CreateCategoryRequest = {
        name: this.categoryForm.name.trim(),
        description: this.categoryForm.description.trim(),
        type: this.categoryForm.type
      };
      this.categoryService.createCategory(req)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => this.onCategoryMutationSuccess('Categoría creada correctamente'),
          error: () => {
            this.isSaving = false;
            this.showErrorSnackBar('No se pudo guardar la categoría. Intenta de nuevo.');
          }
        });
    }
  }

  requestDeleteConfirmation(): void {
    this.deleteError = null;
    this.showDeleteConfirm = true;
  }

  deleteCategory(): void {
    if (!this.editingCategory) return;
    this.isDeleting = true;
    this.deleteError = null;
    this.categoryService.deleteCategory(this.editingCategory.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.isDeleting = false;
          this.closeModal();
          this.fetchCategoriesByType();
          this.showSuccessSnackBar('Categoría eliminada');
        },
        error: (err) => {
          this.isDeleting = false;
          this.showDeleteConfirm = false;
          this.deleteError = err?.error?.error ?? 'No se pudo eliminar la categoría.';
        }
      });
  }

  private onCategoryMutationSuccess(message: string): void {
    this.isSaving = false;
    this.closeModal();
    this.fetchCategoriesByType();
    this.showSuccessSnackBar(message);
  }

  private showSuccessSnackBar(message: string): void {
    this.snackBar.open(message, 'Cerrar', {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
      panelClass: ['snack-success']
    });
  }

  private showErrorSnackBar(message: string): void {
    this.snackBar.open(message, 'Cerrar', {
      duration: 10000,
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
      panelClass: ['snack-error']
    });
  }
}
