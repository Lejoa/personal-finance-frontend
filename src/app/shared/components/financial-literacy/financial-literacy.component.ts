import { Component, OnInit, inject } from '@angular/core';
import { NgIf, NgFor } from '@angular/common';
import { FinancialTipsComponent } from '../financial-tips/financial-tips.component';
import { TipService } from '../../services/tip.service';
import { FinancialTip } from '../../../features/learning/interfaces/learning-content.interfaces';

@Component({
  selector: 'app-financial-literacy',
  standalone: true,
  imports: [
    NgIf,
    NgFor,
    FinancialTipsComponent
  ],
  templateUrl: './financial-literacy.component.html',
  styleUrl: './financial-literacy.component.scss'
})
export class FinancialLiteracyComponent implements OnInit {
  private tipService = inject(TipService);

  tips: FinancialTip[] = [];
  isLoading = true;

  ngOnInit(): void {
    this.tipService.getRecommendedTips().subscribe({
      next: (tips) => {
        this.tips = tips;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }
}
