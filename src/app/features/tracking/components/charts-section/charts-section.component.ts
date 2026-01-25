import { Component, ViewChild, OnInit, inject } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartType } from 'chart.js';
import { TrackingExpensesService } from '../../../../core/services/tracking-expenses/tracking-expenses.service';
import { DateRange } from '../../../../core/services/tracking-expenses/interfaces/tracking-expenses.interfaces';
import { TransactionService } from '../../../../shared/services/transaction.service';
import { Transaction, TransactionType } from '../../../../shared/models/transaction.model';

@Component({
  selector: 'app-charts-section',
  standalone: true,
  imports: [
    MatFormFieldModule, 
    MatDatepickerModule, 
    FormsModule, 
    ReactiveFormsModule,
    BaseChartDirective
  ],
  templateUrl: './charts-section.component.html',
  styleUrl: './charts-section.component.scss'
})
export class ChartsSectionComponent implements OnInit {
  private transactionService = inject(TransactionService);

  @ViewChild(BaseChartDirective) chart!: BaseChartDirective;

  chartType: ChartType = 'pie';
  currentTransactionType: TransactionType = 'gasto';

  chartData: ChartConfiguration['data'] = {
    labels: [],
    datasets: [{
      data: [],
      backgroundColor: []
    }]
  };

  chartOptions: ChartConfiguration['options'] = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom'
      }
    }
  };

  readonly today = new Date();
  readonly defaultStartDate = new Date(this.today.getFullYear(), this.today.getMonth() - 1, 1);
  readonly defaultEndDate = new Date(this.today.getFullYear(), this.today.getMonth(), 0);

  range = new FormGroup({
    start: new FormControl<Date>(this.defaultStartDate),
    end: new FormControl<Date>(this.defaultEndDate),
  });

  constructor(private trackingExpensesService: TrackingExpensesService) {}

  ngOnInit(): void {
    this.loadChartData();
  }

  loadChartData(): void {
    const startDate = this.range.get('start')?.value;
    const endDate = this.range.get('end')?.value;

    if (!startDate || !endDate) {
      return;
    }

    this.transactionService.getTransactionsByDateRange(
      startDate,
      endDate,
      this.currentTransactionType
    ).subscribe({
      next: (transactions) => {
        this.updateChartWithTransactions(transactions);
      },
      error: (error) => console.error('Error loading transactions:', error)
    });
  }

  private updateChartWithTransactions(transactions: Transaction[]): void {
    const categoryTotals = transactions.reduce((acc, transaction) => {
      const category = transaction.categoryName || 'Sin categoría';
      acc[category] = (acc[category] || 0) + transaction.amount;
      return acc;
    }, {} as Record<string, number>);

    const labels = Object.keys(categoryTotals);
    const data = Object.values(categoryTotals);
    const backgroundColor = this.generateColors(labels.length);

    this.chartData.labels = labels;
    this.chartData.datasets[0].data = data;
    this.chartData.datasets[0].backgroundColor = backgroundColor;

    this.chart?.update();
  }

  private generateColors(count: number): string[] {
    const baseColors = [
      '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
      '#FF9F40', '#FF6384', '#C9CBCF', '#4BC0C0', '#FF9F40',
      '#36A2EB', '#FFCE56'
    ];

    const colors: string[] = [];
    for (let i = 0; i < count; i++) {
      if (i < baseColors.length) {
        colors.push(baseColors[i]);
      } else {
        colors.push(this.generateRandomColor());
      }
    }
    return colors;
  }

  private generateRandomColor(): string {
    const hue = Math.floor(Math.random() * 360);
    return `hsl(${hue}, 70%, 60%)`;
  }

  toggleChartData(type: string): void {
    this.currentTransactionType = type === 'expenses' ? 'gasto' : 'ingreso';
    this.trackingExpensesService.setTransactionType(this.currentTransactionType);
    this.loadChartData();
  }

  onDateRangeSelected(): void {
    const startValue = this.range.get('start')?.value;
    const endValue = this.range.get('end')?.value;

    if (startValue && endValue && this.range.valid) {
      const dateRange: DateRange = {
        start: startValue,
        end: endValue
      };

      this.trackingExpensesService.setDateRange(dateRange);
      this.loadChartData();
    }
  }
}
