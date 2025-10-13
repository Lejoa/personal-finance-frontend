import { Component, EventEmitter, Output } from '@angular/core';
import { TabService } from '../../../core/services/tab/tab.service';
import { NgIf, NgFor } from '@angular/common';

@Component({
  selector: 'app-footer-tabs',
  standalone: true,
  imports: [NgFor, NgIf],
  templateUrl: './footer-tabs.component.html',
  styleUrl: './footer-tabs.component.scss'
})
export class FooterTabsComponent {

  tabs = [
    { name: 'Home', icon: 'home'},
    { name: 'Tracking', icon: 'track_changes' },
    { name: 'Create', icon: 'add'},
    { name: 'Budgets', icon: 'account_balance_wallet' },
    { name: 'Learning', icon: 'school'}
  ];

  activeTab = 'Home';

  constructor(private tabService: TabService) {}

  onTabChange(tab: string): void {
    this.activeTab = tab;
    this.tabService.setActiveTab(tab);
  }
}