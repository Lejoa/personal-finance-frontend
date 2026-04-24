import { Component, Input, Output, EventEmitter, inject, DestroyRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BudgetService } from '../../../../shared/services/budget.service';
import { BudgetCategoryView } from '../../interfaces';

@Component({
  selector: 'app-budget-category-card',
  standalone: true,
  imports: [FormsModule, CurrencyPipe, DatePipe, MatSnackBarModule],
  templateUrl: './budget-category-card.component.html',
  styleUrl: './budget-category-card.component.scss'
})
export class BudgetCategoryCardComponent {
  private budgetService = inject(BudgetService);
  private snackBar = inject(MatSnackBar);
  private destroyRef = inject(DestroyRef);

  @Input() category!: BudgetCategoryView;
  @Input() selectedMonth!: Date;
  @Output() categoryChanged = new EventEmitter<void>();

  isModalOpen = false;
  modalLimit = 0;
  isSaving = false;

  openEditModal(): void {
    this.modalLimit = this.category.limit;
    this.isModalOpen = true;
  }

  closeEditModal(): void {
    this.isModalOpen = false;
    this.modalLimit = 0;
    this.isSaving = false;
  }

  saveBudgetCategoryEdit(): void {
    if (!this.category.budgetId || !this.category.budgetCategoryId || this.modalLimit <= 0) return;
    this.isSaving = true;
    this.budgetService.updateBudgetCategoryAmount(
      this.category.budgetId,
      this.category.budgetCategoryId,
      this.modalLimit
    ).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
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
      error: () => {
        this.isSaving = false;
        this.snackBar.open('No se pudo actualizar el límite. Intenta de nuevo.', 'Cerrar', {
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'bottom',
          panelClass: ['snack-error']
        });
      }
    });
  }

  deleteBudgetCategory(): void {
    if (!this.category.budgetId || !this.category.budgetCategoryId) return;
    this.budgetService.deleteBudgetCategory(
      this.category.budgetId,
      this.category.budgetCategoryId
    ).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.snackBar.open('Categoría eliminada del presupuesto', 'Cerrar', {
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'bottom',
          panelClass: ['snack-success']
        });
        this.categoryChanged.emit();
      },
      error: () => {
        this.snackBar.open('No se pudo eliminar la categoría. Intenta de nuevo.', 'Cerrar', {
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'bottom',
          panelClass: ['snack-error']
        });
      }
    });
  }
}
