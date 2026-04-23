import { Component, Input, OnInit, inject } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { CategoryService } from '../../../../shared/services/category.service';
import { Category, CategoryType, CreateCategoryRequest, UpdateCategoryRequest } from '../../../../shared/models/category.model';

interface CategoryFormData {
  name: string;
  description: string;
  type: CategoryType;
}

@Component({
  selector: 'app-category-section',
  standalone: true,
  imports: [NgFor, NgIf, FormsModule, MatSnackBarModule],
  templateUrl: './category-section.component.html',
  styleUrl: './category-section.component.scss'
})
export class CategorySectionComponent implements OnInit {
  @Input() type!: CategoryType;

  private categoryService = inject(CategoryService);
  private snackBar = inject(MatSnackBar);

  categories: Category[] = [];

  isModalOpen = false;
  isEditMode = false;
  editingCategory: Category | null = null;
  isSaving = false;
  isDeleting = false;
  showDeleteConfirm = false;
  deleteError: string | null = null;

  form: CategoryFormData = { name: '', description: '', type: 'gasto' };

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
    this.loadCategories();
  }

  loadCategories(): void {
    this.categoryService.getCategories({ type: this.type }).subscribe(categories => {
      this.categories = categories;
    });
  }

  openCreateModal(): void {
    this.isEditMode = false;
    this.editingCategory = null;
    this.showDeleteConfirm = false;
    this.deleteError = null;
    this.form = { name: '', description: '', type: this.type };
    this.isModalOpen = true;
  }

  openEditModal(category: Category): void {
    this.isEditMode = true;
    this.editingCategory = category;
    this.showDeleteConfirm = false;
    this.deleteError = null;
    this.form = { name: category.name, description: category.description, type: category.type };
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.editingCategory = null;
    this.showDeleteConfirm = false;
    this.deleteError = null;
  }

  saveCategory(): void {
    if (!this.form.name.trim()) return;
    this.isSaving = true;

    if (this.isEditMode && this.editingCategory) {
      const req: UpdateCategoryRequest = {
        name: this.form.name.trim(),
        description: this.form.description.trim()
      };
      this.categoryService.updateCategory(this.editingCategory.id, req).subscribe({
        next: () => {
          this.isSaving = false;
          this.closeModal();
          this.loadCategories();
          this.snackBar.open('Categoría actualizada correctamente', 'Cerrar', {
            duration: 3000,
            horizontalPosition: 'center',
            verticalPosition: 'bottom',
            panelClass: ['snack-success']
          });
        },
        error: () => { this.isSaving = false; }
      });
    } else {
      const req: CreateCategoryRequest = {
        name: this.form.name.trim(),
        description: this.form.description.trim(),
        type: this.form.type
      };
      this.categoryService.createCategory(req).subscribe({
        next: () => {
          this.isSaving = false;
          this.closeModal();
          this.loadCategories();
          this.snackBar.open('Categoría creada correctamente', 'Cerrar', {
            duration: 3000,
            horizontalPosition: 'center',
            verticalPosition: 'bottom',
            panelClass: ['snack-success']
          });
        },
        error: () => { this.isSaving = false; }
      });
    }
  }

  confirmDelete(): void {
    this.deleteError = null;
    this.showDeleteConfirm = true;
  }

  deleteCategory(): void {
    if (!this.editingCategory) return;
    this.isDeleting = true;
    this.deleteError = null;
    this.categoryService.deleteCategory(this.editingCategory.id).subscribe({
      next: () => {
        this.isDeleting = false;
        this.closeModal();
        this.loadCategories();
        this.snackBar.open('Categoría eliminada', 'Cerrar', {
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'bottom',
          panelClass: ['snack-success']
        });
      },
      error: (err) => {
        this.isDeleting = false;
        this.showDeleteConfirm = false;
        this.deleteError = err?.error?.error ?? 'No se pudo eliminar la categoría.';
      }
    });
  }
}
