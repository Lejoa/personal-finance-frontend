import { Component } from '@angular/core';
import { FinancialTipsComponent } from '../../../../shared/components/financial-tips/financial-tips.component';
import { NgIf, NgFor } from '@angular/common';
import { FinancialTip } from '../../interfaces/learning-content.interfaces';
import { MOCK_TIPS } from '../../mocks-learning-content';

@Component({
  selector: 'app-learning-content',
  standalone: true,
  imports: [
    NgIf,
    NgFor,
    FinancialTipsComponent
  ],
  templateUrl: './learning-content.component.html',
  styleUrl: './learning-content.component.scss'
})
export class LearningContentComponent {

  tips = MOCK_TIPS

  selectedTip?: FinancialTip;

  onExpandTip(tip: FinancialTip) {
    this.selectedTip = tip;
  }

  closeDetail() {
    this.selectedTip = undefined;
  }

}
