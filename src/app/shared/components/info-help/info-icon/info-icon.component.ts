import { Component, Input, inject } from '@angular/core';
import { InfoConcept } from '../../../interfaces/info-concept.interface';
import { InfoHelpService } from '../../../services/info-help/info-help.service';

@Component({
  selector: 'app-info-icon',
  standalone: true,
  imports: [],
  templateUrl: './info-icon.component.html',
  styleUrl: './info-icon.component.scss'
})
export class InfoIconComponent {
  @Input({ required: true }) concept!: InfoConcept;
  @Input() tone: 'dark' | 'light' = 'dark';

  private readonly infoHelpService = inject(InfoHelpService);

  open(event: Event): void {
    event.stopPropagation();
    this.infoHelpService.open(this.concept);
  }
}
