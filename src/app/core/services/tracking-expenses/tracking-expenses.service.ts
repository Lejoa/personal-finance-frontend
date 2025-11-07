import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface Transaction {
  name: string;
  amount: number;
  date: string;
  category: string;
}

export type TransactionType = 'expenses' | 'income';

@Injectable({
  providedIn: 'root'
})
export class TrackingExpensesService {
  private transactionTypeSubject = new BehaviorSubject<TransactionType>('expenses');
  readonly transactionType$ = this.transactionTypeSubject.asObservable();

  private expensesData: Transaction[] = [
    { name: 'Almuerzo', amount: 15, date: '2024-06-01', category: 'Comida' },
    { name: 'Transporte', amount: 10, date: '2024-06-02', category: 'Transporte' },
    { name: 'Cine', amount: 20, date: '2024-06-03', category: 'Entretenimiento' }
  ];

  private incomeData: Transaction[] = [
    { name: 'Salario', amount: 1500, date: '2024-06-01', category: 'Trabajo' },
    { name: 'Freelance', amount: 500, date: '2024-06-05', category: 'Proyectos' }
  ];

  getTransactionsByType(type: TransactionType): Transaction[] {
    return type === 'expenses' ? this.expensesData : this.incomeData;
  }

  setTransactionType(type: TransactionType): void {
    this.transactionTypeSubject.next(type);
  }

  constructor() { }
}
