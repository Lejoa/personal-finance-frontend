import { Component } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { PieChartComponent } from '../pie-chart/pie-chart.component';

@Component({
  selector: 'app-charts-section',
  standalone: true,
  imports: [
    PieChartComponent,
    MatFormFieldModule, 
    MatDatepickerModule, 
    FormsModule, 
    ReactiveFormsModule,
  ],
  templateUrl: './charts-section.component.html',
  styleUrl: './charts-section.component.scss'
})
export class ChartsSectionComponent {
  readonly today = new Date();
  
  readonly defaultStartDate = new Date(this.today.getFullYear(), this.today.getMonth() - 1, 1);
  readonly defaultEndDate = new Date(this.today.getFullYear(), this.today.getMonth(), 0);
  
  readonly range = new FormGroup({
    start: new FormControl<Date>(this.defaultStartDate),
    end: new FormControl<Date>(this.defaultEndDate),
  });
}
