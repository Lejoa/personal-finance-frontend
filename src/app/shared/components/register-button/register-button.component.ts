import { Component, inject } from '@angular/core';
import { TabService } from '../../../core/services/tab/tab.service';

@Component({
  selector: 'app-register-button',
  standalone: true,
  imports: [],
  templateUrl: './register-button.component.html',
  styleUrl: './register-button.component.scss'
})
export class RegisterButtonComponent {
  private tabService = inject(TabService);

  navigateToCreate(): void {
    this.tabService.setActiveTab('Create');
  }
}