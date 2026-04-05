import { Component, Input, Output, EventEmitter } from '@angular/core';
import { NgIf } from '@angular/common';
import { FinancialAnalysis } from '../../services/analysis.service';
import { MarkdownPipe } from '../../pipes/markdown.pipe';

@Component({
  selector: 'app-analysis-card',
  standalone: true,
  imports: [NgIf, MarkdownPipe],
  templateUrl: './analysis-card.component.html',
  styleUrl: './analysis-card.component.scss'
})
export class AnalysisCardComponent {
  @Input({ required: true }) analysis!: FinancialAnalysis;
  @Output() read = new EventEmitter<number>();

  isExpanded = false;

  get title(): string {
    const [year, month] = this.analysis.period.split('-');
    const monthNames: Record<string, string> = {
      '01': 'enero', '02': 'febrero', '03': 'marzo', '04': 'abril',
      '05': 'mayo', '06': 'junio', '07': 'julio', '08': 'agosto',
      '09': 'septiembre', '10': 'octubre', '11': 'noviembre', '12': 'diciembre'
    };
    const monthName = monthNames[month] ?? month;
    const label = this.analysis.checkpoint === 'mid' ? 'Mediados de' : 'Cierre de';
    return `${label} ${monthName} ${year}`;
  }

  toggle(): void {
    this.isExpanded = !this.isExpanded;
    if (this.isExpanded && !this.analysis.isRead) {
      this.analysis = { ...this.analysis, isRead: true };
      this.read.emit(this.analysis.id);
    }
  }
}