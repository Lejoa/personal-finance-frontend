import { Component, OnInit, DestroyRef, EventEmitter, Output, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TabService } from '../../../core/services/tab/tab.service';

interface Tab {
  name: string;
  icon: string;
}

@Component({
  selector: 'app-footer-tabs',
  standalone: true,
  imports: [],
  templateUrl: './footer-tabs.component.html',
  styleUrl: './footer-tabs.component.scss'
})
export class FooterTabsComponent implements OnInit {
  private tabService = inject(TabService);
  private destroyRef = inject(DestroyRef);

  @Output() tabChange = new EventEmitter<string>();

  tabs: Tab[] = [
    { name: 'Home', icon: 'home' },
    { name: 'Tracking', icon: 'pie_chart' },
    { name: 'Budgets', icon: 'account_balance_wallet' },
    { name: 'Aprende', icon: 'school' },
    { name: 'Tools', icon: 'build' }
  ];

  activeTab = 'Home';

  ngOnInit(): void {
    this.tabService.activeTab$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(tab => { this.activeTab = tab; });
  }

  onTabChange(tab: string): void {
    this.activeTab = tab;
    this.tabService.setActiveTab(tab);
    this.tabChange.emit(tab);
  }
}
