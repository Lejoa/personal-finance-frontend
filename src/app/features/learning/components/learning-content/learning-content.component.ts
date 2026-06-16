import { Component, OnInit, inject, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FinancialTipsComponent } from '../../../../shared/components/financial-tips/financial-tips.component';
import { FinancialTip, FinancialAnalysis } from '../../interfaces/learning-content.interfaces';
import { TipService } from '../../../../shared/services/tip.service';
import { TabService } from '../../../../core/services/tab/tab.service';
import { ChatService } from '../../../chat/services/chat.service';
import { AnalysisService } from '../../services/analysis.service';
import { AnalysisCardComponent } from '../analysis-card/analysis-card.component';
import { InfoIconComponent } from '../../../../shared/components/info-help/info-icon/info-icon.component';
import { INFO_CONCEPTS } from '../../../../shared/data/info-concepts';

@Component({
  selector: 'app-learning-content',
  standalone: true,
  imports: [
    FinancialTipsComponent,
    AnalysisCardComponent,
    InfoIconComponent,
  ],
  templateUrl: './learning-content.component.html',
  styleUrl: './learning-content.component.scss'
})
export class LearningContentComponent implements OnInit {
  protected readonly CONCEPTS = INFO_CONCEPTS;

  private tipService = inject(TipService);
  private tabService = inject(TabService);
  private chatService = inject(ChatService);
  private analysisService = inject(AnalysisService);
  private destroyRef = inject(DestroyRef);

  tips: FinancialTip[] = [];
  analyses: FinancialAnalysis[] = [];
  isLoading = true;
  isLoadingAnalyses = true;
  analysesError = false;
  selectedTip?: FinancialTip;

  ngOnInit(): void {
    this.loadTips();
    this.loadAnalyses();
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

  markAnalysisAsRead(id: number): void {
    this.analysisService.markAsRead(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (updated) => {
          this.analyses = this.analyses.map(a => a.id === updated.id ? updated : a);
        }
      });
  }

  private loadTips(): void {
    this.tipService.getRecommendedTips()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (tips) => { this.tips = tips; this.isLoading = false; },
        error: () => { this.isLoading = false; }
      });
  }

  private loadAnalyses(): void {
    this.isLoadingAnalyses = true;
    this.analysesError = false;
    this.analysisService.getAnalyses()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (analyses) => {
          this.analyses = analyses;
          this.isLoadingAnalyses = false;
        },
        error: () => {
          this.analyses = [];
          this.isLoadingAnalyses = false;
          this.analysesError = true;
        }
      });
  }
}
