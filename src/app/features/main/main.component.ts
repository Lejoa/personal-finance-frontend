import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from '../../shared/components/header/header.component';
import { FooterTabsComponent } from '../../shared/components/footer-tabs/footer-tabs.component';
import { TransactionHistoryComponent } from '../../shared/components/transaction-history/transaction-history.component';
import { FinancialLiteracyComponent } from '../../shared/components/financial-literacy/financial-literacy.component';
import { RegisterButtonComponent } from '../../shared/components/register-button/register-button.component';
import { SynchronizationCardComponent } from '../../shared/components/synchronization-card/synchronization-card.component';
import { TrackingContentComponent } from '../../shared/components/tracking-content/tracking-content.component';
import { Subscription } from 'rxjs';
import { TabService } from '../../core/services/tab/tab.service';
import { NgIf } from '@angular/common';
import { LearningContentComponent } from '../learning/components/learning-content/learning-content.component';
import { ChatContentComponent } from '../chat/components/chat-content/chat-content.component';

/**
 * Componente principal de la aplicación (protegido por AuthGuard)
 * Contiene el layout completo: header, contenido dinámico y footer
 */
@Component({
  selector: 'app-main',
  standalone: true,
  imports: [
    NgIf,
    RouterOutlet,
    HeaderComponent,
    FooterTabsComponent,
    TransactionHistoryComponent,
    FinancialLiteracyComponent,
    RegisterButtonComponent,
    SynchronizationCardComponent,
    TrackingContentComponent,
    ChatContentComponent,
    LearningContentComponent,
  ],
  templateUrl: './main.component.html',
  styleUrl: './main.component.scss'
})
export class MainComponent implements OnInit, OnDestroy {
  activeTab: string = 'Home';
  private tabSubscription: Subscription = new Subscription();

  constructor(private tabService: TabService) {}

  ngOnInit() {
    this.tabSubscription = this.tabService.activeTab$.subscribe(
      tab => { this.activeTab = tab }
    );
  }

  onTabChange(tab: string) {
    this.activeTab = tab;
  }

  ngOnDestroy() {
    this.tabSubscription.unsubscribe();
  }
}
