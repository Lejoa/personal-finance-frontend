import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface FinancialAnalysis {
  id: number;
  period: string;
  checkpoint: 'mid' | 'end';
  content: string;
  isRead: boolean;
  generatedAt: string;
}

interface AnalysisListResponse {
  data: FinancialAnalysis[];
  total: number;
}

interface AnalysisShowResponse {
  analysis: FinancialAnalysis;
}

@Injectable({
  providedIn: 'root'
})
export class AnalysisService {
  private http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/api/analyses`;

  getAnalyses(): Observable<FinancialAnalysis[]> {
    return this.http.get<AnalysisListResponse>(this.apiUrl).pipe(
      map(response => response.data)
    );
  }

  markAsRead(id: number): Observable<FinancialAnalysis> {
    return this.http.get<AnalysisShowResponse>(`${this.apiUrl}/${id}`).pipe(
      map(response => response.analysis)
    );
  }
}