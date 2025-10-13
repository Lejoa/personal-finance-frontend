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
    { name: 'Follow-up', icon: 'track_changes' },
    { name: 'Register', icon: 'add'},
    { name: 'Transactions', icon: 'account_balance_wallet' },
    { name: 'Learning', icon: 'learning'}
  ];

  activeTab = 'Home';

  constructor(private tabService: TabService) {}

  onTabChange(tab: string): void {
    this.tabService.setActiveTab(tab);
  }
}