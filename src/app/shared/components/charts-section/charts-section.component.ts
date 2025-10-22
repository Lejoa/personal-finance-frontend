import { Component } from '@angular/core';
import { PieChartComponent } from '../pie-chart/pie-chart.component';

@Component({
  selector: 'app-charts-section',
  standalone: true,
  imports: [
    PieChartComponent
  ],
  templateUrl: './charts-section.component.html',
  styleUrl: './charts-section.component.scss'
})
export class ChartsSectionComponent {

}
