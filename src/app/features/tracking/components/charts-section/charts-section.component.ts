import { Component, ViewChild, OnInit, OnChanges, OnDestroy, Input, SimpleChanges, inject } from '@angular/core';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartType } from 'chart.js';
import { TransactionService } from '../../../../shared/services/transaction.service';
import { Transaction, TransactionType } from '../../../../shared/models/transaction.model';
import { TrackingExpensesService } from '../../../../core/services/tracking-expenses/tracking-expenses.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-charts-section',
  standalone: true,
  imports: [BaseChartDirective],
  templateUrl: './charts-section.component.html',
  styleUrl: './charts-section.component.scss'
})
export class ChartsSectionComponent implements OnInit, OnChanges, OnDestroy {
  private transactionService = inject(TransactionService);
  private trackingExpensesService = inject(TrackingExpensesService);
  private subscription = new Subscription();

  @Input() selectedMonth: Date = new Date();
  @ViewChild(BaseChartDirective) chart!: BaseChartDirective;

  chartType: ChartType = 'pie';
  currentTransactionType: TransactionType = 'gasto';

  chartData: ChartConfiguration['data'] = {
    labels: [],
    datasets: [{ data: [], backgroundColor: [] }]
  };

  chartOptions: ChartConfiguration['options'] = {
    responsive: true,
    plugins: { legend: { position: 'bottom' } }
  };

  ngOnInit(): void {
    this.loadChartData();
    this.subscription.add(
      this.transactionService.transactionChanged$.subscribe(() => this.loadChartData())
    );
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['selectedMonth'] && !changes['selectedMonth'].firstChange) {
      this.loadChartData();
    }
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  toggleChartData(type: string): void {
    this.currentTransactionType = type === 'expenses' ? 'gasto' : 'ingreso';
    this.trackingExpensesService.setTransactionType(this.currentTransactionType);
    this.loadChartData();
  }

  loadChartData(): void {
    const start = new Date(this.selectedMonth.getFullYear(), this.selectedMonth.getMonth(), 1);
    const end   = new Date(this.selectedMonth.getFullYear(), this.selectedMonth.getMonth() + 1, 0);

    this.transactionService.getTransactionsByDateRange(start, end, this.currentTransactionType).subscribe({
      next: (transactions) => this.updateChartWithTransactions(transactions),
      error: (error) => console.error('Error loading chart data:', error)
    });
  }

  private updateChartWithTransactions(transactions: Transaction[]): void {
    const categoryTotals = transactions.reduce((acc, t) => {
      const cat = t.categoryName || 'Sin categoría';
      acc[cat] = (acc[cat] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);

    const labels = Object.keys(categoryTotals);
    const data   = Object.values(categoryTotals);

    this.chartData = {
      labels,
      datasets: [{ data, backgroundColor: this.generateColors(labels.length) }]
    };

    this.chart?.update();
  }

  private generateColors(count: number): string[] {
    const base = [
      '#E53935', '#FF7043', '#FFA726', '#FFCA28', '#D4E157',
      '#66BB6A', '#26C6DA', '#42A5F5', '#7E57C2', '#EC407A'
    ];
    return Array.from({ length: count }, (_, i) =>
      i < base.length ? base[i] : `hsl(${Math.floor(Math.random() * 360)}, 70%, 60%)`
    );
  }
}
