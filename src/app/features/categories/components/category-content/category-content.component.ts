import { Component, OnInit } from '@angular/core';
import { NgFor, NgIf, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CategoryService } from '../../../../shared/services/category.service';
import { Category, CategoryType, CreateCategoryRequest, UpdateCategoryRequest } from '../../../../shared/models/category.model';

interface CategoryFormData {
  name: string;
  description: string;
  type: CategoryType;
}

@Component({
  selector: 'app-category-content',
  standalone: true,
  imports: [NgFor, NgIf, NgClass, FormsModule],
  templateUrl: './category-content.component.html',
  styleUrl: './category-content.component.scss'
})
export class CategoryContentComponent implements OnInit {
  incomeCategories: Category[] = [];
  expenseCategories: Category[] = [];

  isModalOpen = false;
  isEditMode = false;
  editingCategory: Category | null = null;
  isSaving = false;
  isDeleting = false;
  showDeleteConfirm = false;

  form: CategoryFormData = { name: '', description: '', type: 'gasto' };

  constructor(private categoryService: CategoryService) {}

  ngOnInit(): void {
    this.loadCategories();
  }

  loadCategories(): void {
    this.categoryService.getCategories().subscribe(categories => {
      this.incomeCategories = categories.filter(c => c.type === 'ingreso');
      this.expenseCategories = categories.filter(c => c.type === 'gasto');
    });
  }

  openCreateModal(type: CategoryType): void {
    this.isEditMode = false;
    this.editingCategory = null;
    this.showDeleteConfirm = false;
    this.form = { name: '', description: '', type };
    this.isModalOpen = true;
  }

  openEditModal(category: Category): void {
    this.isEditMode = true;
    this.editingCategory = category;
    this.showDeleteConfirm = false;
    this.form = { name: category.name, description: category.description, type: category.type };
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.editingCategory = null;
    this.showDeleteConfirm = false;
  }

  saveCategory(): void {
    if (!this.form.name.trim()) return;
    this.isSaving = true;

    if (this.isEditMode && this.editingCategory) {
      const req: UpdateCategoryRequest = { name: this.form.name.trim(), description: this.form.description.trim() };
      this.categoryService.updateCategory(this.editingCategory.id, req).subscribe({
        next: () => { this.isSaving = false; this.closeModal(); this.loadCategories(); },
        error: () => { this.isSaving = false; }
      });
    } else {
      const req: CreateCategoryRequest = { name: this.form.name.trim(), description: this.form.description.trim() };
      this.categoryService.createCategory(req).subscribe({
        next: () => { this.isSaving = false; this.closeModal(); this.loadCategories(); },
        error: () => { this.isSaving = false; }
      });
    }
  }

  confirmDelete(): void {
    this.showDeleteConfirm = true;
  }

  deleteCategory(): void {
    if (!this.editingCategory) return;
    this.isDeleting = true;
    this.categoryService.deleteCategory(this.editingCategory.id).subscribe({
      next: () => { this.isDeleting = false; this.closeModal(); this.loadCategories(); },
      error: () => { this.isDeleting = false; }
    });
  }

  getCategoryIcon(type: CategoryType): string {
    return type === 'ingreso' ? '↑' : '↓';
  }
}