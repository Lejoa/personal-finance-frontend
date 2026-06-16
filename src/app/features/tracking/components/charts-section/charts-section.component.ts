import { Component, ViewChild, OnChanges, Input, Output, EventEmitter, SimpleChanges } from '@angular/core';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartType } from 'chart.js';
import { Transaction, TransactionType } from '../../../../shared/models/transaction.model';
import { InfoIconComponent } from '../../../../shared/components/info-help/info-icon/info-icon.component';
import { INFO_CONCEPTS } from '../../../../shared/data/info-concepts';
import { InfoConcept } from '../../../../shared/interfaces/info-concept.interface';

@Component({
  selector: 'app-charts-section',
  standalone: true,
  imports: [BaseChartDirective, InfoIconComponent],
  templateUrl: './charts-section.component.html',
  styleUrl: './charts-section.component.scss'
})
export class ChartsSectionComponent implements OnChanges {
  protected readonly CONCEPTS = INFO_CONCEPTS;

  @Input() transactions: Transaction[] = [];
  @Input() allTransactions: Transaction[] = [];
  @Input() prevMonthExpenses: Transaction[] = [];
  @Input() prevMonthIncomes: Transaction[] = [];
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

  get gastoInfoConcept(): InfoConcept {
    const expenses = this.allTransactions.filter(t => t.transactionType === 'gasto');
    if (!expenses.length) return this.CONCEPTS['gasto'];

    // Top category this month
    const totals: Record<string, number> = {};
    for (const t of expenses) {
      const cat = t.categoryName || 'Sin categoría';
      totals[cat] = (totals[cat] || 0) + t.amount;
    }
    const [topName, topAmount] = Object.entries(totals).sort((a, b) => b[1] - a[1])[0];
    const totalExpenses = expenses.reduce((s, t) => s + t.amount, 0);
    const progress = totalExpenses ? Math.round((topAmount / totalExpenses) * 100) : 0;

    // Same category last month
    const prevTotal = this.prevMonthExpenses
      .filter(t => (t.categoryName || 'Sin categoría') === topName)
      .reduce((s, t) => s + t.amount, 0);

    const fmtPrev = this.formatCOP(prevTotal);
    const example =
      `Este mes tu mayor gasto ha sido en la categoría ` +
      `<strong style="font-weight:700">"${topName}"</strong>; ` +
      `el mes pasado tus gastos para esta categoría fueron ` +
      `<strong style="color:#E53935;font-weight:700">${fmtPrev}</strong>.`;

    return {
      ...this.CONCEPTS['gasto'],
      example,
      exampleProgress: progress,
      exampleStat: `${progress}% del total de tus gastos del mes`
    };
  }

  get ingresoInfoConcept(): InfoConcept {
    const incomes = this.allTransactions.filter(t => t.transactionType === 'ingreso');
    const currentTotal = incomes.reduce((s, t) => s + t.amount, 0);
    const prevTotal = this.prevMonthIncomes.reduce((s, t) => s + t.amount, 0);

    if (!currentTotal && !prevTotal) return this.CONCEPTS['ingreso'];

    const fmtCurrent = this.formatCOP(currentTotal);
    const fmtPrev    = this.formatCOP(prevTotal);

    const pctChange = prevTotal
      ? Math.round(((currentTotal - prevTotal) / prevTotal) * 100)
      : 0;
    const progress = Math.min(Math.abs(pctChange), 100);
    const sign = pctChange >= 0 ? '+' : '';

    const example =
      `Este mes tus ingresos variables son ` +
      `<strong style="color:#43A047;font-weight:700">${fmtCurrent}</strong>; ` +
      `el mes pasado fueron ` +
      `<strong style="color:#43A047;font-weight:700">${fmtPrev}</strong>.`;

    return {
      ...this.CONCEPTS['ingreso'],
      example,
      exampleProgress: progress,
      exampleStat: `${sign}${pctChange}% vs. el mes anterior`
    };
  }

  private formatCOP(amount: number): string {
    return '$' + Math.round(amount).toLocaleString('es-CO');
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
