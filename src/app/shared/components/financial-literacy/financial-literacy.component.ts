import { Component, OnInit, inject } from '@angular/core';
import { NgIf, NgFor } from '@angular/common';
import { FinancialTipsComponent } from '../financial-tips/financial-tips.component';
import { TipService } from '../../services/tip.service';
import { FinancialTip } from '../../../features/learning/interfaces/learning-content.interfaces';
import { TabService } from '../../../core/services/tab/tab.service';
import { ChatService } from '../../../features/chat/services/chat.service';


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
