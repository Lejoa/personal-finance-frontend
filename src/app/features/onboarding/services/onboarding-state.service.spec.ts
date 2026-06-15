import { TestBed } from '@angular/core/testing';
import { Preferences } from '@capacitor/preferences';
import { OnboardingStateService } from './onboarding-state.service';

describe('OnboardingStateService', () => {
  let service: OnboardingStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(OnboardingStateService);
  });

  afterEach(async () => {
    // Wipe all Preferences state so tests don't bleed into each other
    await Preferences.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('hasSeenOnboarding', () => {
    it('should return false when the key has not been set', async () => {
      expect(await service.hasSeenOnboarding()).toBeFalse();
    });

    it('should return true when the stored value is "true"', async () => {
      await Preferences.set({ key: 'onboarding_completed', value: 'true' });
      expect(await service.hasSeenOnboarding()).toBeTrue();
    });

    it('should return false when the stored value is not "true"', async () => {
      await Preferences.set({ key: 'onboarding_completed', value: 'other' });
      expect(await service.hasSeenOnboarding()).toBeFalse();
    });

    it('should only read from key "onboarding_completed"', async () => {
      await Preferences.set({ key: 'different_key', value: 'true' });
      expect(await service.hasSeenOnboarding()).toBeFalse();
    });
  });

  describe('completeOnboarding', () => {
    it('should store "true" under key "onboarding_completed"', async () => {
      await service.completeOnboarding();
      const { value } = await Preferences.get({ key: 'onboarding_completed' });
      expect(value).toBe('true');
    });

    it('should resolve without error', async () => {
      await expectAsync(service.completeOnboarding()).toBeResolved();
    });

    it('should cause hasSeenOnboarding to return true', async () => {
      await service.completeOnboarding();
      expect(await service.hasSeenOnboarding()).toBeTrue();
    });
  });
});
