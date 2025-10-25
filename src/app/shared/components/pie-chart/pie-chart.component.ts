// src/app/shared/components/pie-chart/pie-chart.component.ts
import { Component } from '@angular/core';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartType } from 'chart.js';

@Component({
  selector: 'app-pie-chart',
  standalone: true,
  imports: [BaseChartDirective],
  templateUrl: './pie-chart.component.html',
  styleUrl: './pie-chart.component.scss'
})
export class PieChartComponent {
  chartType: ChartType = 'pie';

  chartData: ChartConfiguration['data'] = {
    labels: ['Comida', 'Transporte', 'Entretenimiento'],
    datasets: [{
      data: [300, 200, 100],
      backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56']
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
}
