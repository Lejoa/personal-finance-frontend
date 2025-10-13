import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './shared/components/header/header.component';
import { FooterTabsComponent } from './shared/components/footer-tabs/footer-tabs.component';
import { TransactionHistoryComponent } from './shared/components/transaction-history/transaction-history.component';
import { FinancialLiteracyComponent } from './shared/components/financial-literacy/financial-literacy.component';
import { RegisterButtonComponent } from './shared/components/register-button/register-button.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet, 
    HeaderComponent, 
    FooterTabsComponent,
    TransactionHistoryComponent,
    FinancialLiteracyComponent,
    RegisterButtonComponent
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

