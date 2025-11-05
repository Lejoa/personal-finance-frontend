import { Component } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { TabService } from '../../../core/services/tab/tab.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    AsyncPipe,
    CommonModule
  ],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})

export class HeaderComponent {
  activeTab$: Observable<String>;
  
  constructor(private tabService: TabService) {
      this.activeTab$ = this.tabService.activeTab$;
  }
}