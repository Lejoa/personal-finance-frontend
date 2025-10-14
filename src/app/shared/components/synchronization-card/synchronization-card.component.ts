import { Component, Input } from '@angular/core';


@Component({
  selector: 'app-synchronization-card',
  standalone: true,
  imports: [],
  templateUrl: './synchronization-card.component.html',
  styleUrl: './synchronization-card.component.scss'
})
export class SynchronizationCardComponent {
  @Input() name!: string;
  @Input() amount!: number;
  @Input() date!: string;
  @Input() category!: string;
}
