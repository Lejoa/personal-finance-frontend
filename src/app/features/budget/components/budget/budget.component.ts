import { Component } from '@angular/core';
import { NgIf, NgFor } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CurrencyPipe } from '@angular/common';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Budget, BudgetItem } from '../../../../shared/models/budget.model';
import { A11yModule } from "@angular/cdk/a11y";

@Component({
  selector: 'app-budget',
  standalone: true,
  imports: [
    NgIf,
    NgFor,
    FormsModule,
    CurrencyPipe,
    MatExpansionModule,
    MatButtonModule,
    MatIconModule,
    A11yModule
],
  templateUrl: './budget.component.html',
  styleUrl: './budget.component.scss'
})
export class BudgetComponent {
  isModalOpen: boolean = false;
  budgets: Budget[] = [];

  // Main modal fields
  month: number = new Date().getMonth() + 1;
  year: number = new Date().getFullYear();

  // Items collection
  items: BudgetItem[] = [];

  // New item fields
  newName: string = '';
  newLimit: number = 0;

  // Edit item state
  editingIndex: number | null = null;
  editName: string = '';
  editLimit: number = 0;

  // Edit budget state
  editingBudgetId: string | null = null;
  isEditMode: boolean = false;

  openModal(): void {
    this.isModalOpen = true;
    this.isEditMode = false;
    this.editingBudgetId = null;
    this.month = new Date().getMonth() + 1;
    this.year = new Date().getFullYear();
    this.items = [];
    this.newName = '';
    this.newLimit = 0;
    this.editingIndex = null;
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.isEditMode = false;
    this.editingBudgetId = null;
    this.items = [];
    this.newName = '';
    this.newLimit = 0;
    this.editingIndex = null;
  }

  openEditBudgetModal(budgetId: string): void {
    const budget = this.budgets.find(b => b.id === budgetId);
    if (budget) {
      this.isModalOpen = true;
      this.isEditMode = true;
      this.editingBudgetId = budgetId;
      this.month = budget.mes;
      this.year = budget.anio;
      this.items = budget.items.map(item => ({...item}));
      this.newName = '';
      this.newLimit = 0;
      this.editingIndex = null;
    }
  }

  addItem(): void {
    if (this.newName.trim() && this.newLimit > 0) {
      this.items.push({
        nombre: this.newName.trim(),
        tope: this.newLimit
      });
      this.newName = '';
      this.newLimit = 0;
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
    this.editName = this.items[index].nombre;
    this.editLimit = this.items[index].tope;
  }

  saveEditItem(): void {
    if (  this.editingIndex !== null && 
          this.editName.trim() &&
          this.editLimit > 0
        ) {
          this.items[this.editingIndex] = {
            nombre: this.editName.trim(),
            tope: this.editLimit
          };
          this.cancelEditItem();
      }    
  }

  cancelEditItem(): void {
    this.editingIndex = null;
    this.editName = '';
    this.editLimit = 0;
  }

  isEditing(index: number): boolean {
    return this.editingIndex === index;
  }

  saveBudget(): void {
    if (this.items.length > 0) {
      if(this.isEditMode && this.editingBudgetId) {
        const budgetIndex = this.budgets.findIndex( b => b.id === this.editingBudgetId)
        if(budgetIndex !== -1) {
          this.budgets[budgetIndex] = {
            ...this.budgets[budgetIndex],
            mes: this.month,
            anio: this.year,
            items: [...this.items]
          }
        }
      } else {
        const newBudget: Budget = {
          id: Date.now().toString(),
          mes: this.month,
          anio: this.year,
          items: [...this.items],
          createdAt: new Date()
        };

        this.budgets.push(newBudget);
      }
      
      this.closeModal();
    }
  }

  deleteBudget(budgetId: string): void {
    const budgetIndex = this.budgets.findIndex( b => b.id === budgetId);
    if(budgetIndex !== -1) {
      this.budgets.splice(budgetIndex, 1);
    }
  }

  getMonthName(month: number): string {
    const months = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    return months[month - 1] || '';
  }

  getTotalBudget(budget: Budget): number {
    return budget.items.reduce((total, item) => total + item.tope, 0);
  }
}
