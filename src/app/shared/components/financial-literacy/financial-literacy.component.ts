import { Component } from '@angular/core';
import { FinancialTipsComponent } from '../financial-tips/financial-tips.component';

@Component({
  selector: 'app-financial-literacy',
  standalone: true,
  imports: [ 
    FinancialTipsComponent
  ],
  templateUrl: './financial-literacy.component.html',
  styleUrl: './financial-literacy.component.scss'
})
export class FinancialLiteracyComponent {

}
