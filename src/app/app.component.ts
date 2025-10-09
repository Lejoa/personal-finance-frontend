import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './layout/header/header.component';
import { FooterTabsComponent } from './layout/footer-tabs/footer-tabs.component';
import { TransactionCardComponent } from './shared/components/transaction-card/transaction-card.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet, 
    HeaderComponent, 
    FooterTabsComponent,
    TransactionCardComponent
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'personal finance frontend';
  activeTab: string = 'Home';

  onTabChange(tab: string) {
    this.activeTab = tab;
  }
}

