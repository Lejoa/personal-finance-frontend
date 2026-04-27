import { Component, OnInit, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FinancialTipsComponent } from '../financial-tips/financial-tips.component';
import { TipService } from '../../services/tip.service';
import { FinancialTip } from '../../../features/learning/interfaces/learning-content.interfaces';
import { TabService } from '../../../core/services/tab/tab.service';
import { ChatService } from '../../../features/chat/services/chat.service';

@Component({
  selector: 'app-financial-literacy',
  standalone: true,
  imports: [FinancialTipsComponent],
  templateUrl: './financial-literacy.component.html',
  styleUrl: './financial-literacy.component.scss'
})
export class FinancialLiteracyComponent implements OnInit {
  private tipService = inject(TipService);
  private tabService = inject(TabService);
  private chatService = inject(ChatService);
  private destroyRef = inject(DestroyRef);

  tips: FinancialTip[] = [];
  isLoading = true;
  selectedTip?: FinancialTip;

  ngOnInit(): void {
    this.tipService.getRecommendedTips()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (tips) => {
          this.tips = tips;
          this.isLoading = false;
        },
        error: () => {
          this.isLoading = false;
        }
      });
  }

  selectTip(tip: FinancialTip): void {
    this.selectedTip = tip;
  }

  clearSelectedTip(): void {
    this.selectedTip = undefined;
  }

  learnMore(tip: FinancialTip): void {
    const message = `Quiero aprender más sobre este tema: "${tip.title}". ${tip.shortDescription ?? ''}`.trim();
    this.tabService.setActiveTab('Create');
    setTimeout(() => this.chatService.sendMessage(message));
  }
}