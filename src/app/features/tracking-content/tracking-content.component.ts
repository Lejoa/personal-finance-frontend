import { Component } from '@angular/core';
import { TransactionHistoryComponent } from '../../shared/components/transaction-history/transaction-history.component';
import { ChartsSectionComponent } from './components/charts-section/charts-section.component';

@Component({
  selector: 'app-tracking-content',
  standalone: true,
  imports: [
    ChartsSectionComponent,
    TransactionHistoryComponent
  ],
  templateUrl: './tracking-content.component.html',
  styleUrl: './tracking-content.component.scss'
})
export class TrackingContentComponent {

}
