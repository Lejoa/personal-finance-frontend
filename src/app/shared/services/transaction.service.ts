import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, tap, map } from 'rxjs';
import { Transaction, TransactionType } from '../models/transaction.model';
import { environment } from '../../../environments/environment';

export interface TransactionFilters {
  type?: TransactionType;
  startDate?: string;
  endDate?: string;
  limit?: number;
}

interface TransactionsResponse {
  data: TransactionDTO[];
  total: number;
}

interface TransactionResponse {
  transaction: TransactionDTO;
}

interface TransactionCreateResponse {
  message: string;
  transaction: TransactionDTO;
}

interface TransactionDTO {
  id: number;
  name: string;
  type: string;
  amount: number;
  date: string;
  note?: string;
  categoryId?: number;
  categoryName?: string;
  createdAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class TransactionService {
  private http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/api/transactions`;

  private transactionsSubject = new BehaviorSubject<Transaction[]>([]);
  public transactions$ = this.transactionsSubject.asObservable();

  /** Obtiene transacciones con filtros opcionales */
  getTransactions(filters?: TransactionFilters): Observable<Transaction[]> {
    let params = new HttpParams();

    if (filters?.type) {
      params = params.set('type', filters.type);
    }
    if (filters?.startDate) {
      params = params.set('startDate', filters.startDate);
    }
    if (filters?.endDate) {
      params = params.set('endDate', filters.endDate);
    }
    if (filters?.limit) {
      params = params.set('limit', filters.limit.toString());
    }

    return this.http.get<TransactionsResponse>(this.apiUrl, { params }).pipe(
      map(response => response.data.map(dto => this.mapDtoToTransaction(dto))),
      tap(transactions => this.transactionsSubject.next(transactions))
    );
  }

  /** Obtiene las últimas N transacciones */
  getLatestTransactions(limit: number = 3): Observable<Transaction[]> {
    return this.getTransactions({ limit });
  }

  /** Obtiene transacciones por rango de fechas */
  getTransactionsByDateRange(
    startDate: Date,
    endDate: Date,
    type?: TransactionType
  ): Observable<Transaction[]> {
    return this.getTransactions({
      startDate: this.formatDate(startDate),
      endDate: this.formatDate(endDate),
      type
    });
  }

  /** Obtiene una transacción por ID */
  getTransactionById(id: number): Observable<Transaction> {
    return this.http.get<TransactionResponse>(`${this.apiUrl}/${id}`).pipe(
      map(response => this.mapDtoToTransaction(response.transaction))
    );
  }

  /** Crea una nueva transacción */
  createTransaction(transaction: Partial<Transaction>): Observable<Transaction> {
    const payload = this.mapTransactionToDto(transaction);
    return this.http.post<TransactionCreateResponse>(this.apiUrl, payload).pipe(
      map(response => this.mapDtoToTransaction(response.transaction)),
      tap(newTransaction => {
        const current = this.transactionsSubject.value;
        this.transactionsSubject.next([newTransaction, ...current]);
      })
    );
  }

  /** Actualiza una transacción existente */
  updateTransaction(id: number, transaction: Partial<Transaction>): Observable<Transaction> {
    const payload = this.mapTransactionToDto(transaction);
    return this.http.patch<TransactionCreateResponse>(`${this.apiUrl}/${id}`, payload).pipe(
      map(response => this.mapDtoToTransaction(response.transaction)),
      tap(updatedTransaction => {
        const current = this.transactionsSubject.value;
        const index = current.findIndex(t => t.id === id.toString());
        if (index !== -1) {
          current[index] = updatedTransaction;
          this.transactionsSubject.next([...current]);
        }
      })
    );
  }

  /** Elimina una transacción */
  deleteTransaction(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => {
        const current = this.transactionsSubject.value;
        this.transactionsSubject.next(current.filter(t => t.id !== id.toString()));
      })
    );
  }

  /** Obtiene el estado actual sin llamada HTTP */
  getCurrentTransactions(): Transaction[] {
    return this.transactionsSubject.value;
  }

  private mapDtoToTransaction(dto: TransactionDTO): Transaction {
    return {
      id: dto.id.toString(),
      name: dto.name,
      amount: dto.amount,
      date: new Date(dto.date),
      categoryId: dto.categoryId,
      categoryName: dto.categoryName,
      transactionType: dto.type === 'ingreso' ? 'ingreso' : 'gasto',
      createdAt: new Date(dto.createdAt)
    };
  }

  private mapTransactionToDto(transaction: Partial<Transaction>): Record<string, unknown> {
    const dto: Record<string, unknown> = {};

    if (transaction.name) dto['name'] = transaction.name;
    if (transaction.amount !== undefined) dto['amount'] = transaction.amount;
    if (transaction.date) dto['date'] = this.formatDate(transaction.date);
    if (transaction.transactionType) {
      dto['type'] = transaction.transactionType === 'ingreso' ? 'ingreso' : 'gasto';
    }
    if (transaction.categoryId !== undefined) dto['categoryId'] = transaction.categoryId;

    return dto;
  }

  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }
}