import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-transaction-card',
  standalone: true,
  imports: [],
  templateUrl: './transaction-card.component.html',
  styleUrl: './transaction-card.component.scss'
})
export class TransactionCardComponent {
  @Input() name!: string;
  @Input() amount!: number;
  @Input() date!: string;
  @Input() category!: string;
}
