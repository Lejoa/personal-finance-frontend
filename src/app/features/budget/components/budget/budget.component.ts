import { Component, OnInit, inject } from '@angular/core';
import { NgIf, NgFor, AsyncPipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormGroup, FormControl } from '@angular/forms';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatNativeDateModule } from '@angular/material/core';
import { Budget, BudgetItem, CreateBudgetRequest } from '../../../../shared/models/budget.model';
import { Category } from '../../../../shared/models/category.model';
import { CategoryService } from '../../../../shared/services/category.service';
import { BudgetService } from '../../../../shared/services/budget.service';
import { A11yModule } from "@angular/cdk/a11y";
import { Observable, map, shareReplay } from 'rxjs';

@Component({
  selector: 'app-budget',
  standalone: true,
  imports: [
    NgIf,
    NgFor,
    AsyncPipe,
    FormsModule,
    ReactiveFormsModule,
    CurrencyPipe,
    MatExpansionModule,
    MatButtonModule,
    MatIconModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatNativeDateModule,
    A11yModule
],
  templateUrl: './budget.component.html',
  styleUrl: './budget.component.scss'
})
export class BudgetComponent implements OnInit {
  private categoryService = inject(CategoryService);
  private budgetService = inject(BudgetService);

  isModalOpen: boolean = false;
  budgets: Budget[] = [];

  // Date range form
  dateRange = new FormGroup({
    start: new FormControl<Date | null>(null),
    end: new FormControl<Date | null>(null)
  });

  // Categories
  expenseCategories$: Observable<Category[]> | null = null;

  // Items collection (with categoryId tracking)
  items: Array<BudgetItem & { categoryId?: number }> = [];

  // New item fields
  selectedCategoryId: number | null = null;
  newLimit: number = 0;

  // Edit item state
  editingIndex: number | null = null;
  editCategoryId: number | null = null;
  editLimit: number = 0;

  // Edit budget state
  editingBudgetId: number | null = null;
  isEditMode: boolean = false;

  ngOnInit(): void {
    this.loadExpenseCategories();
    this.loadBudgets();
  }

  private loadExpenseCategories(): void {
    this.expenseCategories$ = 
      this.categoryService.getCategories({ type: 'gasto' }).pipe(
        shareReplay(1)
      );
  }

  private loadBudgets(): void {
    
    this.budgetService.getBudgets().subscribe({
      next: (budgets) => {
        this.budgets = budgets;
      },
      error: (error) => {
        console.error('Error loading budgets:', error);
      }
    });
  }

  openModal(): void {
    this.isModalOpen = true;
    this.isEditMode = false;
    this.editingBudgetId = null;

    // Set default date range (current month)
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    this.dateRange.patchValue({
      start: firstDay,
      end: lastDay
    });

    this.items = [];
    this.selectedCategoryId = null;
    this.newLimit = 0;
    this.editingIndex = null;
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.isEditMode = false;
    this.editingBudgetId = null;
    this.items = [];
    this.selectedCategoryId = null;
    this.newLimit = 0;
    this.editingIndex = null;
  }

  openEditBudgetModal(budgetId: number): void {
    const budget = this.budgets.find(b => b.id === budgetId);
    if (budget) {
      this.isModalOpen = true;
      this.isEditMode = true;
      this.editingBudgetId = budgetId;
      this.dateRange.patchValue({
        start: budget.startDate,
        end: budget.endDate
      });

      // Map items with categoryId from categories if available
      if (budget.categories && budget.categories.length > 0) {
        this.items = budget.categories.map(cat => ({
          nombre: cat.categoryName,
          tope: cat.amount,
          categoryId: cat.categoryId
        }));
      } else {
        this.items = budget.items.map(item => ({...item}));
      }

      this.selectedCategoryId = null;
      this.newLimit = 0;
      this.editingIndex = null;
    }
  }

  addItem(): void {
    if (this.selectedCategoryId !== null && this.newLimit > 0) {
      // Get the category name from the observable
      this.expenseCategories$?.pipe(
        map(categories => categories.find(c => c.id === this.selectedCategoryId))
      ).subscribe(category => {
        if (category) {
          this.items.push({
            nombre: category.name,
            tope: this.newLimit,
            categoryId: category.id
          });
          this.selectedCategoryId = null;
          this.newLimit = 0;
        }
      });
    }
  }

  removeItem(index: number): void {
    this.items.splice(index, 1);
    if (this.editingIndex === index) {
      this.cancelEditItem();
    }
  }

  startEditItem(index: number): void {
    this.editingIndex = index;
    const itemName = this.items[index].nombre;

    // Find the category ID based on the item name
    this.expenseCategories$?.pipe(
      map(categories => categories.find(c => c.name === itemName))
    ).subscribe(category => {
      this.editCategoryId = category?.id ?? null;
    });

    this.editLimit = this.items[index].tope;
  }

  saveEditItem(): void {
    if (this.editingIndex !== null &&
        this.editCategoryId !== null &&
        this.editLimit > 0) {

      this.expenseCategories$?.pipe(
        map(categories => categories.find(c => c.id === this.editCategoryId))
      ).subscribe(category => {
        if (category && this.editingIndex !== null) {
          this.items[this.editingIndex] = {
            nombre: category.name,
            tope: this.editLimit,
            categoryId: category.id
          };
          this.cancelEditItem();
        }
      });
    }
  }

  cancelEditItem(): void {
    this.editingIndex = null;
    this.editCategoryId = null;
    this.editLimit = 0;
  }

  isEditing(index: number): boolean {
    return this.editingIndex === index;
  }

  saveBudget(): void {
    const startDate = this.dateRange.value.start;
    const endDate = this.dateRange.value.end;

    if (this.items.length > 0 && startDate && endDate) {
      const categories = this.items
      .filter( item => item.categoryId !== undefined)
      .map( item => ({
        categoryId: item.categoryId!,
        amount: item.tope
      }))

      if (categories.length === 0) {
        console.error('No valid categories to save.');
        return;
      }

      if (this.isEditMode && this.editingBudgetId) {
        const updateRequest = {
          startDate: this.formatDate(startDate),
          endDate: this.formatDate(endDate),
          categories: categories
        };

        this.budgetService.updateBudget(
          Number(this.editingBudgetId), updateRequest).subscribe({
            next: (updatedBudget) => {
              const budgetIndex = this.budgets.findIndex(
                b => b.id === updatedBudget.id
              );
              if (budgetIndex !== -1) {
                this.budgets[budgetIndex] = updatedBudget;
              }
              this.closeModal();
            },
            error: (error) => {
              console.error('Error updating budget:', error);
            }
          });
      } else {
        const createRequest: CreateBudgetRequest = { 
          startDate: this.formatDate(startDate),
          endDate: this.formatDate(endDate),
          categories: categories
        };
        this.budgetService.createBudget(createRequest).subscribe({
          next: (newBudget) => {
            this.budgets.push(newBudget);
            this.closeModal();
          },
          error: (error) => {
            console.error('Error creating budget:', error);
          }
        });
      }      
    }
  }

  deleteBudget(budgetId: number): void {
    this.budgetService.deleteBudget(budgetId).subscribe({
      next: () => {
        const budgetIndex = this.budgets.findIndex(b => b.id === budgetId);
        if (budgetIndex !== -1) {
          this.budgets.splice(budgetIndex, 1);
        }
      },
      error: (error) => {
        console.error('Error deleting budget:', error);
      }
    });
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  getDateRangeDisplay(budget: Budget): string {
    const startDate = new Date(budget.startDate);
    const endDate = new Date(budget.endDate);

    const startDay = startDate.getDate();
    const startMonth = startDate.toLocaleString('es-ES', { month: 'short' });
    const endDay = endDate.getDate();
    const endMonth = endDate.toLocaleString('es-ES', { month: 'short' });
    const year = endDate.getFullYear();

    if (startMonth === endMonth) {
      return `${startDay}-${endDay} ${startMonth} ${year}`;
    }
    return `${startDay} ${startMonth} - ${endDay} ${endMonth} ${year}`;
  }

  getTotalBudget(budget: Budget): number {
    return budget.items.reduce((total, item) => total + item.tope, 0);
  }
}
