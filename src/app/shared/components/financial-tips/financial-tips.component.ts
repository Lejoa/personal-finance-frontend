import { Component, Input, Output, EventEmitter } from '@angular/core';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-financial-tips',
  standalone: true,
  imports: [
    NgIf
  ],
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

  @Output() expand = new EventEmitter<void>();

  onExpand() {
    this.expand.emit();
  }
}
