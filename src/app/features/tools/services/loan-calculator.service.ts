import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  CreateLoanCalculationRequest,
  SavedLoanCalculation,
} from '../../../shared/models/loan.model';

interface ApiListResponse {
  data: SavedLoanCalculation[];
  total: number;
}

interface ApiCreateResponse {
  message: string;
  calculation: SavedLoanCalculation;
}

@Injectable({ providedIn: 'root' })
export class LoanCalculatorService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/api/loan-calculations`;

  getCalculations(): Observable<SavedLoanCalculation[]> {
    return this.http.get<ApiListResponse>(this.apiUrl).pipe(map((r) => r.data));
  }

  saveCalculation(data: CreateLoanCalculationRequest): Observable<SavedLoanCalculation> {
    return this.http
      .post<ApiCreateResponse>(this.apiUrl, data)
      .pipe(map((r) => r.calculation));
  }

  deleteCalculation(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
