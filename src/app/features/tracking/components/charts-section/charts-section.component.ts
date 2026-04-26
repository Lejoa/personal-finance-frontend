import { Component, ViewChild, OnChanges, Input, Output, EventEmitter, SimpleChanges } from '@angular/core';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartType } from 'chart.js';
import { Transaction, TransactionType } from '../../../../shared/models/transaction.model';

@Component({
  selector: 'app-charts-section',
  standalone: true,
  imports: [BaseChartDirective],
  templateUrl: './charts-section.component.html',
  styleUrl: './charts-section.component.scss'
})
export class ChartsSectionComponent implements OnChanges {
  @Input() transactions: Transaction[] = [];
  @Input() selectedMonth: Date = new Date();
  @Output() transactionTypeChange = new EventEmitter<TransactionType>();

  @ViewChild(BaseChartDirective) chart!: BaseChartDirective;

  chartType: ChartType = 'pie';

  chartData: ChartConfiguration['data'] = {
    labels: [],
    datasets: [{ data: [], backgroundColor: [] }]
  };

  chartOptions: ChartConfiguration['options'] = {
    responsive: true,
    plugins: { legend: { position: 'bottom' } }
  };

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['transactions']) {
      this.updateChartWithTransactions(this.transactions);
    }
  }

  setChartTransactionType(type: string): void {
    const transactionType: TransactionType = type === 'expenses' ? 'gasto' : 'ingreso';
    this.transactionTypeChange.emit(transactionType);
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
