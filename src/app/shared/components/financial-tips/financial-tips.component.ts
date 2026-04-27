import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-financial-tips',
  standalone: true,
  imports: [],
  templateUrl: './financial-tips.component.html',
  styleUrl: './financial-tips.component.scss'
})
export class FinancialTipsComponent {
  @Input() title!: string;
  @Input() shortDescription?: string;
  @Input() description!: string;
  @Input() imageSrc?: string;
  @Input() author?: string;
  @Input() authorTitle?: string;
  @Input() reason?: string;

  @Output() expand = new EventEmitter<void>();

  emitExpand(): void {
    this.expand.emit();
  }
}