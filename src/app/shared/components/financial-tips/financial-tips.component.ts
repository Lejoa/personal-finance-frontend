import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-financial-tips',
  standalone: true,
  imports: [],
  templateUrl: './financial-tips.component.html',
  styleUrl: './financial-tips.component.scss'
})
export class FinancialTipsComponent {
  @Input() title!: string;
  @Input() description!: string;
}
