import { Component, OnInit, inject } from '@angular/core';
import { CurrencyPipe, NgIf } from '@angular/common';
import { BudgetService } from '../../services/budget.service';
import { TransactionService } from '../../services/transaction.service';
import { Budget } from '../../models/budget.model';
import { Transaction } from '../../models/transaction.model';
@Component({
  selector: 'app-balance',
  standalone: true,
  imports: [
    CurrencyPipe,
    NgIf
  ],
  templateUrl: './balance.component.html',
  styleUrl: './balance.component.scss'
})
export class BalanceComponent implements OnInit {

  private budgetService = inject(BudgetService);
  private transactionService = inject(TransactionService);

  income: number = 0;
  expenses: number = 0;
  balance: number = 0;

  activeBudget: Budget | null = null;
  budgetDateRange: string = '';
  hasActiveBudget: boolean = false;

  ngOnInit(): void {
    this.loadActiveBudget();
  }

  private loadActiveBudget(): void {
    this.budgetService.getBudgets().subscribe({
      next: (budgets) => {
        this.activeBudget = this.findActiveBudget(budgets);
        if (this.activeBudget) {
          this.hasActiveBudget = true;
          this.budgetDateRange = this.formatBudgetDateRange(this.activeBudget);
          this.loadTransactionsForBudget(this.activeBudget);
        } else {
          this.hasActiveBudget = false;
          this.budgetDateRange = '';
          this.resetBalanceValues();
        }
      },
      error: (error) => {
        console.error('Error loading budgets:', error);
        this.hasActiveBudget = false;
        this.resetBalanceValues();
      }
    });
  }

  private loadTransactionsForBudget(budget: Budget): void {
    this.transactionService.getTransactionsByDateRange(
      budget.startDate,
      budget.endDate
    ).subscribe({
      next: (transactions) => {
        this.calculateBalanceValues(transactions);
      },
      error: (error) => {
        console.error('Error loading transactions:', error);
        this.resetBalanceValues();
      }
    });
  }

  private calculateBalanceValues(transactions: Transaction[]): void {
    this.income = transactions
      .filter(t => t.transactionType === 'ingreso')
      .reduce((total, t) => total + t.amount, 0);

    this.expenses = transactions
      .filter(t => t.transactionType === 'gasto')
      .reduce((total, t) => total + t.amount, 0);

    this.balance = this.income - this.expenses;
  }

  private resetBalanceValues(): void {
    this.income = 0;
    this.expenses = 0;
    this.balance = 0;
  }

  private findActiveBudget(budgets: Budget[]): Budget | null {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return budgets.find(budget => {
      const startDate = new Date(budget.startDate);
      const endDate = new Date(budget.endDate);
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(0, 0, 0, 0);

      return today >= startDate && today <= endDate;
    }) || null;
  }

  private formatBudgetDateRange(budget: Budget): string {
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
}
