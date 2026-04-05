import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface NotificationItem {
  id: number;
  message: string;
  referenceId: number;
  createdAt: string;
}

export interface NotificationSummary {
  count: number;
  notifications: NotificationItem[];
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/api/notifications`;

  private unreadCountSubject = new BehaviorSubject<number>(0);
  readonly unreadCount$ = this.unreadCountSubject.asObservable();

  loadUnread(): Observable<NotificationSummary> {
    return this.http.get<NotificationSummary>(`${this.apiUrl}/unread`).pipe(
      tap(summary => this.unreadCountSubject.next(summary.count))
    );
  }

  markAllRead(): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/read`, {}).pipe(
      tap(() => this.unreadCountSubject.next(0))
    );
  }
}