import { Component, ViewChild, OnInit, OnChanges, Input, SimpleChanges, inject, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartType } from 'chart.js';
import { TransactionService } from '../../../../shared/services/transaction.service';
import { Transaction, TransactionType } from '../../../../shared/models/transaction.model';
import { TrackingExpensesService } from '../../../../core/services/tracking-expenses/tracking-expenses.service';

@Component({
  selector: 'app-charts-section',
  standalone: true,
  imports: [BaseChartDirective],
  templateUrl: './charts-section.component.html',
  styleUrl: './charts-section.component.scss'
})
export class ChartsSectionComponent implements OnInit, OnChanges {
  private transactionService = inject(TransactionService);
  private trackingExpensesService = inject(TrackingExpensesService);
  private destroyRef = inject(DestroyRef);

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
    this.fetchChartTransactions();
    this.transactionService.transactionChanged$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.fetchChartTransactions());
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['selectedMonth'] && !changes['selectedMonth'].firstChange) {
      this.fetchChartTransactions();
    }
  }

  setChartTransactionType(type: string): void {
    this.currentTransactionType = type === 'expenses' ? 'gasto' : 'ingreso';
    this.trackingExpensesService.setTransactionType(this.currentTransactionType);
    this.fetchChartTransactions();
  }

  fetchChartTransactions(): void {
    const start = new Date(this.selectedMonth.getFullYear(), this.selectedMonth.getMonth(), 1);
    const end   = new Date(this.selectedMonth.getFullYear(), this.selectedMonth.getMonth() + 1, 0);

    this.transactionService.getTransactionsByDateRange(start, end, this.currentTransactionType)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (transactions) => this.updateChartWithTransactions(transactions),
        error: () => {}
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
