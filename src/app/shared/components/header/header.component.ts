import { Component, OnInit } from '@angular/core';
import { AsyncPipe, NgIf } from '@angular/common';
import { Observable } from 'rxjs';
import { TabService } from '../../../core/services/tab/tab.service';
import { NotificationService } from '../../../core/services/notification/notification.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    AsyncPipe,
    NgIf
  ],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent implements OnInit {
  activeTab$: Observable<String>;
  unreadCount$: Observable<number>;

  constructor(
    private tabService: TabService,
    private notificationService: NotificationService
  ) {
    this.activeTab$ = this.tabService.activeTab$;
    this.unreadCount$ = this.notificationService.unreadCount$;
  }

  ngOnInit(): void {
    this.notificationService.loadUnread().subscribe();
  }

  onBellClick(): void {
    this.notificationService.markAllRead().subscribe();
    this.tabService.setActiveTab('Aprende');
  }
}