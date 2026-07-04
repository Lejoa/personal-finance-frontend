import { Component, OnInit, DestroyRef, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BehaviorSubject, Observable, map } from 'rxjs';
import { TabService } from '../../../core/services/tab/tab.service';
import { NotificationService } from '../../../core/services/notification/notification.service';
import { ProfileMenuComponent } from '../../../features/profile/components/profile-menu/profile-menu.component';

const TAB_LABELS: Record<string, string> = {
  Home: 'Inicio',
  Tracking: 'Finanzas',
  Create: 'Asistente Financiero',
  Budgets: 'Presupuestos',
  Learning: 'Aprende',
  Categories: 'Categorías',
  Tools: 'Herramientas'
};

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
  activeTabLabel$: Observable<string> = this.activeTab$.pipe(
    map(tab => TAB_LABELS[tab] ?? tab)
  );
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

  onCategoriesClicked(): void {
    this.tabService.setActiveTab('Categories');
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
