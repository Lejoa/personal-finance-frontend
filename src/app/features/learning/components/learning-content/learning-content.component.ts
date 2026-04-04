import { Component, OnInit, inject } from '@angular/core';
import { FinancialTipsComponent } from '../../../../shared/components/financial-tips/financial-tips.component';
import { NgIf, NgFor } from '@angular/common';
import { FinancialTip } from '../../interfaces/learning-content.interfaces';
import { TipService } from '../../../../shared/services/tip.service';
import { TabService } from '../../../../core/services/tab/tab.service';
import { ChatService } from '../../../chat/services/chat.service';

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
export class LearningContentComponent implements OnInit {
  private tipService = inject(TipService);
  private tabService = inject(TabService);
  private chatService = inject(ChatService);

  tips: FinancialTip[] = [];
  isLoading = true;
  selectedTip?: FinancialTip;

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

  onExpandTip(tip: FinancialTip) {
    this.selectedTip = tip;
  }

  closeDetail() {
    this.selectedTip = undefined;
  }

  learnMore(tip: FinancialTip): void {
    const message = `Quiero aprender más sobre este tema: "${tip.title}". ${tip.shortDescription ?? ''}`.trim();
    this.tabService.setActiveTab('Create');
    setTimeout(() => this.chatService.sendMessage(message));
  }
}
