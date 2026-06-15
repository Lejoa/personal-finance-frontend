import { Injectable, inject } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { OnboardingStateService } from '../services/onboarding-state.service';

@Injectable({ providedIn: 'root' })
export class OnboardingGuard implements CanActivate {
  private readonly onboardingState = inject(OnboardingStateService);
  private readonly router = inject(Router);

  async canActivate(): Promise<boolean | UrlTree> {
    const hasSeen = await this.onboardingState.hasSeenOnboarding();
    if (!hasSeen) {
      return this.router.createUrlTree(['/onboarding']);
    }
    return true;
  }
}
