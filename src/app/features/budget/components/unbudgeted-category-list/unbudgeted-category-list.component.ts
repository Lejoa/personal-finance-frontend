import { Component, Input, Output, EventEmitter, inject, DestroyRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EMPTY, catchError, switchMap, take, timer } from 'rxjs';
import { Budget } from '../../../../shared/models/budget.model';
import { BudgetService } from '../../../../shared/services/budget.service';
import { UnbudgetedCategory } from '../../interfaces';
import { InfoIconComponent } from '../../../../shared/components/info-help/info-icon/info-icon.component';
import { INFO_CONCEPTS } from '../../../../shared/data/info-concepts';

@Component({
  selector: 'app-unbudgeted-category-list',
  standalone: true,
  imports: [FormsModule, DatePipe, MatSnackBarModule, InfoIconComponent],
  templateUrl: './unbudgeted-category-list.component.html',
  styleUrl: './unbudgeted-category-list.component.scss'
})
export class UnbudgetedCategoryListComponent {
  protected readonly CONCEPTS = INFO_CONCEPTS;

  private budgetService = inject(BudgetService);
  private snackBar = inject(MatSnackBar);
  private destroyRef = inject(DestroyRef);

  @Input() categories: UnbudgetedCategory[] = [];
  @Input() selectedMonth!: Date;
  @Input() currentBudget: Budget | null = null;
  @Output() categoryAdded = new EventEmitter<void>();

  isModalOpen = false;
  selectedCategory: UnbudgetedCategory | null = null;
  modalLimit = 0;
  isSaving = false;

  openModal(cat: UnbudgetedCategory): void {
    this.selectedCategory = cat;
    this.modalLimit = 0;
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.selectedCategory = null;
    this.modalLimit = 0;
    this.isSaving = false;
  }

  saveBudgetCategoryLimit(): void {
    if (!this.selectedCategory || this.modalLimit <= 0) return;
    this.isSaving = true;

    const capturedCategoryId = this.selectedCategory.categoryId;
    const capturedLimit = this.modalLimit;

    this.budgetService.setBudgetForCategory(
      capturedCategoryId,
      capturedLimit,
      this.selectedMonth,
      this.currentBudget
    ).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (budget) => {
        this.closeModal();
        this.categoryAdded.emit();
        this.showSuccessSnackBar('Presupuesto fijado correctamente');
        this.showDelayedFeedback(budget.id!, capturedCategoryId, budget);
      },
      error: () => {
        this.isSaving = false;
        this.showErrorSnackBar('No se pudo fijar el presupuesto. Intenta de nuevo.');
      }
    });
  }

  private showDelayedFeedback(budgetId: number, categoryId: number, budget: Budget): void {
    const budgetCategoryId = budget.categories?.find(c => c.categoryId === categoryId)?.id;
    if (!budgetId || !budgetCategoryId) return;

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
      duration: 10000,
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
      panelClass: ['snack-info']
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
