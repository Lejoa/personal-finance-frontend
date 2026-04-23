import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Budget } from '../../../../shared/models/budget.model';
import { BudgetService } from '../../../../shared/services/budget.service';

export interface UnbudgetedCategory {
  categoryId: number;
  categoryName: string;
  spent: number;
}

@Component({
  selector: 'app-unbudgeted-category-list',
  standalone: true,
  imports: [CommonModule, FormsModule, MatSnackBarModule],
  templateUrl: './unbudgeted-category-list.component.html',
  styleUrl: './unbudgeted-category-list.component.scss'
})
export class UnbudgetedCategoryListComponent {
  private budgetService = inject(BudgetService);
  private snackBar = inject(MatSnackBar);

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

  confirm(): void {
    if (!this.selectedCategory || this.modalLimit <= 0) return;
    this.isSaving = true;
    this.budgetService.setBudgetForCategory(
      this.selectedCategory.categoryId,
      this.modalLimit,
      this.selectedMonth,
      this.currentBudget
    ).subscribe({
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
      error: () => { this.isSaving = false; }
    });
  }
}
