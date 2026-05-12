import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, Subject, tap, map, forkJoin } from 'rxjs';
import { Transaction, TransactionType, TransactionStatus } from '../models/transaction.model';
import { environment } from '../../../environments/environment';

export interface TransactionFilters {
  type?: TransactionType;
  startDate?: string;
  endDate?: string;
  limit?: number;
  sync?: TransactionStatus;
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
  synchronized: string;
  source?: 'manual' | 'sms';
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

  private transactionChangedSubject = new Subject<void>();
  /** Emits whenever a transaction is created, updated or deleted */
  public transactionChanged$ = this.transactionChangedSubject.asObservable();

  /** Fetches transactions with optional filters */
  getTransactions(filters?: TransactionFilters): Observable<Transaction[]> {
    let params = new HttpParams();

    if (filters?.type) {
      params = params.set('type', filters.type);
    }
    if (filters?.sync) {
      params = params.set('sync', filters.sync);
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

    return this.http.get<TransactionsResponse>(this.apiUrl, { params })
            .pipe(
              map(response => response.data.map(dto => this.mapDtoToTransaction(dto))),
              tap(transactions => this.transactionsSubject.next(transactions))
            );
  }

  /** Fetches the latest N transactions */
  getLatestTransactions(limit = 3): Observable<Transaction[]> {
    return this.getTransactions({ limit });
  }

  /** Fetches transactions within a date range */
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

  /** Fetches transactions within a date range without updating the shared BehaviorSubject */
  getTransactionsQuiet(filters?: TransactionFilters): Observable<Transaction[]> {
    let params = new HttpParams();
    if (filters?.type) params = params.set('type', filters.type);
    if (filters?.startDate) params = params.set('startDate', filters.startDate);
    if (filters?.endDate) params = params.set('endDate', filters.endDate);
    return this.http.get<TransactionsResponse>(this.apiUrl, { params })
      .pipe(map(response => response.data.map(dto => this.mapDtoToTransaction(dto))));
  }

  /** Fetches a transaction by ID */
  getTransactionById(id: number): Observable<Transaction> {
    return this.http.get<TransactionResponse>(`${this.apiUrl}/${id}`)
            .pipe(
              map(response => this.mapDtoToTransaction(response.transaction))
            );
  }

  getTransactionsUnsynced(): Observable<Transaction[]> {
    return this.getTransactions({ sync: 'pending' });
  }

  /** Sets synchronized='done' on every transaction in the array, in parallel */
  approveAllPending(transactions: Transaction[]): Observable<Transaction[]> {
    const updates = transactions.map(t =>
      this.updateTransaction(Number(t.id), { synchronized: 'done' })
    );
    return forkJoin(updates);
  }

  /**
   * Approves or rejects transactions based on the set of approved IDs.
   * IDs in approvedIds → synchronized='done'; all others → synchronized='rejected'.
   */
  batchApprove(transactions: Transaction[], approvedIds: Set<string>): Observable<Transaction[]> {
    const updates = transactions.map(t =>
      this.updateTransaction(Number(t.id), {
        synchronized: approvedIds.has(t.id!) ? 'done' : 'rejected'
      })
    );
    return forkJoin(updates);
  }

  /** Creates a new transaction */
  createTransaction(transaction: Partial<Transaction>): Observable<Transaction> {
    const payload = this.mapTransactionToDto(transaction);
    return this.http.post<TransactionCreateResponse>(this.apiUrl, payload).pipe(
      map(response => this.mapDtoToTransaction(response.transaction)),
      tap(newTransaction => {
        const current = this.transactionsSubject.value;
        this.transactionsSubject.next([newTransaction, ...current]);
        this.transactionChangedSubject.next();
      })
    );
  }

  /** Updates an existing transaction */
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
        this.transactionChangedSubject.next();
      })
    );
  }

  /** Requests the formative feedback message for a confirmed transaction */
  getFeedback(transactionId: number): Observable<{ feedback: string | null }> {
    return this.http.post<{ feedback: string | null }>(`${this.apiUrl}/${transactionId}/feedback`, {});
  }

  /** Deletes a transaction */
  deleteTransaction(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => {
        const current = this.transactionsSubject.value;
        this.transactionsSubject.next(current.filter(t => t.id !== id.toString()));
        this.transactionChangedSubject.next();
      })
    );
  }

  /** Returns the current cached transactions without making an HTTP call */
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
      note: dto.note,
      synchronized: dto.synchronized as 'pending' | 'done' | 'rejected',
      status: dto.synchronized as TransactionStatus,
      transactionType: dto.type === 'ingreso' ? 'ingreso' : 'gasto',
      source: dto.source,
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
    if (transaction.note !== undefined) dto['note'] = transaction.note;
    const sync = transaction.synchronized ?? transaction.status;
    if (sync) dto['synchronized'] = sync;
    // Forward the source to the backend ('manual' | 'sms') for traceability
    if (transaction.source) dto['source'] = transaction.source;

    return dto;
  }

  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }
}