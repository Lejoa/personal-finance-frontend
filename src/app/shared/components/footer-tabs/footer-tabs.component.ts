import { Component, EventEmitter,OnInit, OnDestroy, Output } from '@angular/core';
import { TabService } from '../../../core/services/tab/tab.service';
import { NgIf, NgFor } from '@angular/common';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-footer-tabs',
  standalone: true,
  imports: [NgFor, NgIf],
  templateUrl: './footer-tabs.component.html',
  styleUrl: './footer-tabs.component.scss'
})
export class FooterTabsComponent implements OnInit, OnDestroy {

  @Output() tabChange = new EventEmitter<string>(); // <-- Agrega esto

  tabs = [
    { name: 'Home', icon: 'home'},
    { name: 'Tracking', icon: 'track_changes' },
    { name: 'Create', icon: 'add'},
    { name: 'Budgets', icon: 'account_balance_wallet' },
    { name: 'Learning', icon: 'school'}
  ];

  activeTab = 'Home';
  private tabSubscription: Subscription = new Subscription();

  constructor(private tabService: TabService) {}
  
  ngOnInit(): void {
    this.tabSubscription = this.tabService.activeTab$.subscribe( tab => {
      this.activeTab = tab;
    })
  }

  ngOnDestroy(): void {
    this.tabSubscription.unsubscribe();
  }

  onTabChange(tab: string): void {
    this.activeTab = tab;
    this.tabService.setActiveTab(tab);
    this.tabChange.emit(tab); // <-- Emite el evento al padre
  }
}