import { Component, Input, Output, EventEmitter, inject, DestroyRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Budget } from '../../../../shared/models/budget.model';
import { BudgetService } from '../../../../shared/services/budget.service';
import { UnbudgetedCategory } from '../../interfaces';

@Component({
  selector: 'app-unbudgeted-category-list',
  standalone: true,
  imports: [FormsModule, DatePipe, MatSnackBarModule],
  templateUrl: './unbudgeted-category-list.component.html',
  styleUrl: './unbudgeted-category-list.component.scss'
})
export class UnbudgetedCategoryListComponent {
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
    this.budgetService.setBudgetForCategory(
      this.selectedCategory.categoryId,
      this.modalLimit,
      this.selectedMonth,
      this.currentBudget
    ).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.snackBar.open('Presupuesto fijado correctamente', 'Cerrar', {
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'bottom',
          panelClass: ['snack-success']
        });
        this.closeModal();
        this.categoryAdded.emit();
      },
      error: () => {
        this.isSaving = false;
        this.snackBar.open('No se pudo fijar el presupuesto. Intenta de nuevo.', 'Cerrar', {
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'bottom',
          panelClass: ['snack-error']
        });
      }
    });
  }
}
