import { Component } from '@angular/core';
import { CsvExportComponent } from '../csv-export/csv-export.component';

@Component({
  selector: 'app-tools-content',
  standalone: true,
  imports: [CsvExportComponent],
  templateUrl: './tools-content.component.html',
  styleUrl: './tools-content.component.scss'
})
export class ToolsContentComponent {}
