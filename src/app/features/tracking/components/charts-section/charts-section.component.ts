import { Component, ViewChild } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartType } from 'chart.js';
import { TrackingExpensesService } from '../../../../core/services/tracking-expenses/tracking-expenses.service';
import { DateRange } from '../../../../core/services/tracking-expenses/interfaces/tracking-expenses.interfaces';

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
export class ChartsSectionComponent {
  @ViewChild(BaseChartDirective) chart!: BaseChartDirective;

  chartType: ChartType = 'pie';

  foo = {
      labels: ['Comida', 'Transporte', 'Entretenimiento', 'Salud'],
      data: [500, 600, 100, 100],
      backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0']
  };

  foo2 = {
      labels: ['Salario', 'Asesoría', 'Freelance', 'Inversiones'],
      data: [800, 300, 200, 100],
      backgroundColor: ['#FF9F40', '#9966FF', '#FF6384', '#36A2EB']
  };

  chartData: ChartConfiguration['data'] = {
    labels: this.foo.labels,
    datasets: [{
      data: this.foo.data,
      backgroundColor: this.foo.backgroundColor
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

  toggleChartData(type: string): void {
    if (type === 'expenses') {
      this.chartData.labels = this.foo.labels;
      this.chartData.datasets[0].data = this.foo.data;
      this.chartData.datasets[0].backgroundColor = this.foo.backgroundColor;
      this.trackingExpensesService.setTransactionType('expenses');
    } else {
      this.chartData.labels = this.foo2.labels;
      this.chartData.datasets[0].data = this.foo2.data;
      this.chartData.datasets[0].backgroundColor = this.foo2.backgroundColor;
      this.trackingExpensesService.setTransactionType('income');
    }
    this.chart?.update();
  }

  onDateRangeSelected(): void {
    const startValue = this.range.get('start')?.value;
    const endValue = this.range.get('end')?.value;

    console.log('[DatePicker] Range selected:', { start: startValue, end: endValue });

    if (startValue && endValue && this.range.valid) {
      const dateRange: DateRange = {
        start: startValue,
        end: endValue
      };

      console.log('[DatePicker] Valid range, updating service:', dateRange);
      this.trackingExpensesService.setDateRange(dateRange);
    } else {
      console.warn('[DatePicker] Invalid range, missing start or end date');
    }
  }
}
