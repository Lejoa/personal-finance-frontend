import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { Observable } from 'rxjs';
import { AuthService } from '../../../auth/services/auth.service';
import { User } from '../../../auth/interfaces';

@Component({
  selector: 'app-profile-menu',
  standalone: true,
  imports: [AsyncPipe],
  templateUrl: './profile-menu.component.html',
  styleUrl: './profile-menu.component.scss'
})
export class ProfileMenuComponent {
  @Input() isOpen = false;

  @Output() menuClosed = new EventEmitter<void>();

  private authService = inject(AuthService);

  currentUser$: Observable<User | null> = this.authService.currentUser$;

  close(): void {
    this.menuClosed.emit();
  }
}
