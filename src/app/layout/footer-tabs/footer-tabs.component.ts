import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-footer-tabs',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './footer-tabs.component.html',
  styleUrl: './footer-tabs.component.scss'
})
export class FooterTabsComponent {
  activeTab: string = 'Home';

  @Output() tabChange = new EventEmitter<string>();

  tabs = [
    { name: 'Home', icon: 'home' },
    { name: 'Tracking', icon: 'track_changes' },
    { name: 'Create', icon: 'add' },
    { name: 'Budgets', icon: 'account_balance_wallet' },
    { name: 'Learning', icon: 'school' }
  ];

  setActiveTab(tabName: string) {
    this.activeTab = tabName;
    this.tabChange.emit(tabName);
  }
}