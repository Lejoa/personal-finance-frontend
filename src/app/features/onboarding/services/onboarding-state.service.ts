import { Injectable } from '@angular/core';
import { Preferences } from '@capacitor/preferences';

@Injectable({ providedIn: 'root' })
export class OnboardingStateService {
  private readonly KEY = 'onboarding_completed';

  async hasSeenOnboarding(): Promise<boolean> {
    const { value } = await Preferences.get({ key: this.KEY });
    return value === 'true';
  }

  async completeOnboarding(): Promise<void> {
    await Preferences.set({ key: this.KEY, value: 'true' });
  }
}
