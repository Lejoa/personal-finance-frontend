import { Component } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartType } from 'chart.js';

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

  readonly today = new Date();
  
  readonly defaultStartDate = new Date(this.today.getFullYear(), this.today.getMonth() - 1, 1);
  readonly defaultEndDate = new Date(this.today.getFullYear(), this.today.getMonth(), 0);
  
  readonly range = new FormGroup({
    start: new FormControl<Date>(this.defaultStartDate),
    end: new FormControl<Date>(this.defaultEndDate),
  });
}
