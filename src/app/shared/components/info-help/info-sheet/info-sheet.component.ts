import { Component, inject, computed } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { InfoHelpService } from '../../../services/info-help/info-help.service';
import { InfoConcept } from '../../../interfaces/info-concept.interface';

@Component({
  selector: 'app-info-sheet',
  standalone: true,
  imports: [],
  templateUrl: './info-sheet.component.html',
  styleUrl: './info-sheet.component.scss'
})
export class InfoSheetComponent {
  private readonly infoHelpService = inject(InfoHelpService);
  private readonly sanitizer = inject(DomSanitizer);

  protected readonly concept = toSignal(this.infoHelpService.activeConcept$, {
    initialValue: null as InfoConcept | null
  });
  protected readonly isOpen = computed(() => this.concept() !== null);

  protected readonly safeExample = computed((): SafeHtml | null => {
    const html = this.concept()?.example;
    return html ? this.sanitizer.bypassSecurityTrustHtml(html) : null;
  });

  protected close(): void {
    this.infoHelpService.close();
  }
}
