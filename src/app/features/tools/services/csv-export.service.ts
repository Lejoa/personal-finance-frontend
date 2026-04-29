import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface CsvExportParams {
  type?: 'ingreso' | 'gasto';
  startDate?: string;
  endDate?: string;
  categoryId?: number;
}

@Injectable({ providedIn: 'root' })
export class CsvExportService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/api/transactions/export/csv`;

  exportCsv(params: CsvExportParams): Observable<void> {
    const httpParams = new HttpParams({ fromObject: this.buildParams(params) });

    return this.http.get(this.apiUrl, {
      params: httpParams,
      responseType: 'blob',
      observe: 'response',
    }).pipe(
      map((response) => {
        const blob = response.body!;
        const filename = this.extractFilename(response.headers) ?? 'transacciones.csv';
        this.triggerDownload(blob, filename);
      })
    );
  }

  private buildParams(params: CsvExportParams): Record<string, string> {
    return Object.fromEntries(
      Object.entries(params)
        .filter(([, v]) => v !== undefined && v !== '' && v !== null)
        .map(([k, v]) => [k, String(v)])
    );
  }

  private extractFilename(headers: HttpHeaders): string | null {
    const disposition = headers.get('Content-Disposition');
    const match = disposition?.match(/filename="?([^"]+)"?/);
    return match?.[1] ?? null;
  }

  private triggerDownload(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.style.display = 'none';
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  }
}
