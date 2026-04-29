import { Component, OnInit, DestroyRef, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BehaviorSubject, Observable } from 'rxjs';
import { TabService } from '../../../core/services/tab/tab.service';
import { NotificationService } from '../../../core/services/notification/notification.service';
import { ProfileMenuComponent } from '../../../features/profile/components/profile-menu/profile-menu.component';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [AsyncPipe, ProfileMenuComponent],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent implements OnInit {
  private tabService = inject(TabService);
  private notificationService = inject(NotificationService);
  private destroyRef = inject(DestroyRef);

  activeTab$: Observable<string> = this.tabService.activeTab$;
  unreadCount$: Observable<number> = this.notificationService.unreadCount$;

  private isMenuOpenSubject = new BehaviorSubject<boolean>(false);
  isMenuOpen$: Observable<boolean> = this.isMenuOpenSubject.asObservable();

  ngOnInit(): void {
    this.notificationService.loadUnread()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe();
  }

  onProfileClick(): void {
    this.isMenuOpenSubject.next(true);
  }

  closeMenu(): void {
    this.isMenuOpenSubject.next(false);
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
