import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-month-navigator',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './month-navigator.component.html',
  styleUrl: './month-navigator.component.scss'
})
export class MonthNavigatorComponent implements OnInit {
  @Input() initialMonth: Date = new Date();
  @Output() monthChange = new EventEmitter<Date>();

  currentMonth: Date = new Date();

  ngOnInit(): void {
    this.currentMonth = new Date(
      this.initialMonth.getFullYear(),
      this.initialMonth.getMonth(),
      1
    );
    this.monthChange.emit(new Date(this.currentMonth));
  }

  get displayLabel(): string {
    const label = this.currentMonth.toLocaleString('es-ES', {
      month: 'long',
      year: 'numeric'
    });
    return label.charAt(0).toUpperCase() + label.slice(1);
  }

  goToPreviousMonth(): void {
    this.currentMonth = new Date(
      this.currentMonth.getFullYear(),
      this.currentMonth.getMonth() - 1,
      1
    );
    this.monthChange.emit(new Date(this.currentMonth));
  }

  goToNextMonth(): void {
    this.currentMonth = new Date(
      this.currentMonth.getFullYear(),
      this.currentMonth.getMonth() + 1,
      1
    );
    this.monthChange.emit(new Date(this.currentMonth));
  }
}