import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { BudgetService } from '../../../../shared/services/budget.service';

export interface BudgetCategoryView {
  categoryId: number;
  categoryName: string;
  limit: number;
  spent: number;
  remaining: number;
  isOverBudget: boolean;
  budgetId?: number;
  budgetCategoryId?: number;
}

@Component({
  selector: 'app-budget-category-card',
  standalone: true,
  imports: [CommonModule, FormsModule, MatSnackBarModule],
  templateUrl: './budget-category-card.component.html',
  styleUrl: './budget-category-card.component.scss'
})
export class BudgetCategoryCardComponent {
  private budgetService = inject(BudgetService);
  private snackBar = inject(MatSnackBar);

  @Input() category!: BudgetCategoryView;
  @Input() selectedMonth!: Date;
  @Output() categoryChanged = new EventEmitter<void>();

  isEditModalOpen = false;
  editModalLimit = 0;
  isEditSaving = false;

  openEditModal(): void {
    this.editModalLimit = this.category.limit;
    this.isEditModalOpen = true;
  }

  closeEditModal(): void {
    this.isEditModalOpen = false;
    this.editModalLimit = 0;
    this.isEditSaving = false;
  }

  confirmEdit(): void {
    if (!this.category.budgetId || !this.category.budgetCategoryId || this.editModalLimit <= 0) return;
    this.isEditSaving = true;
    this.budgetService.updateBudgetCategoryAmount(
      this.category.budgetId,
      this.category.budgetCategoryId,
      this.editModalLimit
    ).subscribe({
      next: () => {
        this.snackBar.open('Límite actualizado correctamente', 'Cerrar', {
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'bottom',
          panelClass: ['snack-success']
        });
        this.closeEditModal();
        this.categoryChanged.emit();
      },
      error: () => { this.isEditSaving = false; }
    });
  }

  delete(): void {
    if (!this.category.budgetId || !this.category.budgetCategoryId) return;
    this.budgetService.deleteBudgetCategory(
      this.category.budgetId,
      this.category.budgetCategoryId
    ).subscribe({
      next: () => {
        this.snackBar.open('Categoría eliminada del presupuesto', 'Cerrar', {
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'bottom',
          panelClass: ['snack-success']
        });
        this.categoryChanged.emit();
      },
      error: (err) => console.error('Error deleting budget category:', err)
    });
  }
}
