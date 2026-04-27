import { Component, EventEmitter, Output, inject } from '@angular/core';
import { MonthStateService } from '../../../core/services/month-state/month-state.service';

@Component({
  selector: 'app-month-navigator',
  standalone: true,
  imports: [],
  templateUrl: './month-navigator.component.html',
  styleUrl: './month-navigator.component.scss'
})
export class MonthNavigatorComponent {
  private monthStateService = inject(MonthStateService);

  @Output() monthChange = new EventEmitter<Date>();

  get currentMonth(): Date {
    return this.monthStateService.selectedMonth;
  }

  get displayLabel(): string {
    const label = this.currentMonth.toLocaleString('es-ES', {
      month: 'long',
      year: 'numeric'
    });
    return label.charAt(0).toUpperCase() + label.slice(1);
  }

  goToPreviousMonth(): void {
    this.navigateToMonth(-1);
  }

  goToNextMonth(): void {
    this.navigateToMonth(1);
  }

  private navigateToMonth(offset: number): void {
    const current = this.currentMonth;
    const next = new Date(current.getFullYear(), current.getMonth() + offset, 1);
    this.monthStateService.setMonth(next);
    this.monthChange.emit(new Date(next));
  }
}