import { Component, Input, Output, EventEmitter, inject, DestroyRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EMPTY, catchError, switchMap, take, timer } from 'rxjs';
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

    const capturedBudgetId = this.category.budgetId;
    const capturedBudgetCategoryId = this.category.budgetCategoryId;
    const capturedLimit = this.modalLimit;

    this.budgetService.updateBudgetCategoryAmount(
      capturedBudgetId,
      capturedBudgetCategoryId,
      capturedLimit
    ).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.closeEditModal();
        this.categoryChanged.emit();
        this.showSuccessSnackBar('Límite actualizado correctamente');
        this.showDelayedFeedback(capturedBudgetId, capturedBudgetCategoryId);
      },
      error: () => {
        this.isSaving = false;
        this.showErrorSnackBar('No se pudo actualizar el límite. Intenta de nuevo.');
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
        this.showSuccessSnackBar('Categoría eliminada del presupuesto');
        this.categoryChanged.emit();
      },
      error: () => this.showErrorSnackBar('No se pudo eliminar la categoría. Intenta de nuevo.')
    });
  }

  private showDelayedFeedback(budgetId: number, budgetCategoryId: number): void {
    timer(3200).pipe(
      switchMap(() =>
        this.budgetService.getBudgetCategoryFeedback(budgetId, budgetCategoryId)
          .pipe(catchError(() => EMPTY))
      ),
      take(1)
    ).subscribe(feedback => {
      if (feedback) this.showInfoSnackBar(feedback);
    });
  }

  private showSuccessSnackBar(message: string): void {
    this.snackBar.open(message, 'Cerrar', {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
      panelClass: ['snack-success']
    });
  }

  private showInfoSnackBar(message: string): void {
    this.snackBar.open(message, 'Cerrar', {
      duration: 5000,
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
      panelClass: ['snack-info']
    });
  }

  private showErrorSnackBar(message: string): void {
    this.snackBar.open(message, 'Cerrar', {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
      panelClass: ['snack-error']
    });
  }
}
