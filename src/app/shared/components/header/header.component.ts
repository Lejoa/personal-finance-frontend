import { Component, OnInit, DestroyRef, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable } from 'rxjs';
import { TabService } from '../../../core/services/tab/tab.service';
import { NotificationService } from '../../../core/services/notification/notification.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [AsyncPipe],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent implements OnInit {
  private tabService = inject(TabService);
  private notificationService = inject(NotificationService);
  private destroyRef = inject(DestroyRef);

  activeTab$: Observable<string> = this.tabService.activeTab$;
  unreadCount$: Observable<number> = this.notificationService.unreadCount$;

  ngOnInit(): void {
    this.notificationService.loadUnread()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe();
  }

  onBellClick(): void {
    this.markNotificationsAsRead();
    this.navigateToLearning();
  }

  private markNotificationsAsRead(): void {
    this.notificationService.markAllRead().subscribe();
  }

  private navigateToLearning(): void {
    this.tabService.setActiveTab('Aprende');
  }
}
