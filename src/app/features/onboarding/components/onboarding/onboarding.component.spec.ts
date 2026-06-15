import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { WritableSignal } from '@angular/core';
import { OnboardingComponent } from './onboarding.component';
import { OnboardingStateService } from '../../services/onboarding-state.service';
import { OnboardingSlide } from '../../interfaces/onboarding-slide.interface';

/** Typed proxy to access protected members under test without casting to `any`. */
interface OnboardingInternal {
  readonly currentIndex: WritableSignal<number>;
  readonly isSheetOpen: WritableSignal<boolean>;
  readonly isInfoActive: WritableSignal<boolean>;
  readonly isHintGone: WritableSignal<boolean>;
  readonly isChatOpen: WritableSignal<boolean>;
  readonly isChatHintGone: WritableSignal<boolean>;
  readonly slides: OnboardingSlide[];
  goTo(index: number): void;
  skip(): void;
  back(): void;
  finish(): Promise<void>;
  openSheet(): void;
  closeSheet(): void;
  openChat(): void;
}

describe('OnboardingComponent', () => {
  let component: OnboardingComponent;
  let fixture: ComponentFixture<OnboardingComponent>;
  let c: OnboardingInternal;
  let onboardingStateSpy: jasmine.SpyObj<OnboardingStateService>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    onboardingStateSpy = jasmine.createSpyObj('OnboardingStateService', [
      'completeOnboarding',
      'hasSeenOnboarding'
    ]);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    onboardingStateSpy.completeOnboarding.and.returnValue(Promise.resolve());
    routerSpy.navigate.and.returnValue(Promise.resolve(true));

    await TestBed.configureTestingModule({
      imports: [OnboardingComponent],
      providers: [
        { provide: OnboardingStateService, useValue: onboardingStateSpy },
        { provide: Router, useValue: routerSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(OnboardingComponent);
    component = fixture.componentInstance;
    c = component as unknown as OnboardingInternal;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should start on the first slide (index 0)', () => {
    expect(c.currentIndex()).toBe(0);
  });

  describe('next button label', () => {
    it('should read "Siguiente" on slides 1–3', () => {
      const btn = fixture.nativeElement.querySelector('.controls__next') as HTMLButtonElement;
      expect(btn.textContent?.trim()).toBe('Siguiente');
    });

    it('should read "Empezar" on the last slide', () => {
      c.currentIndex.set(c.slides.length - 1);
      fixture.detectChanges();
      const btn = fixture.nativeElement.querySelector('.controls__next') as HTMLButtonElement;
      expect(btn.textContent?.trim()).toBe('Empezar');
    });
  });

  describe('back button visibility', () => {
    it('should be hidden on the first slide', () => {
      const btn = fixture.nativeElement.querySelector('.controls__back') as HTMLButtonElement;
      expect(btn.classList.contains('hidden')).toBeTrue();
    });

    it('should be visible on slide 2', () => {
      c.currentIndex.set(1);
      fixture.detectChanges();
      const btn = fixture.nativeElement.querySelector('.controls__back') as HTMLButtonElement;
      expect(btn.classList.contains('hidden')).toBeFalse();
    });
  });

  describe('skip button visibility', () => {
    it('should be visible on the first slide', () => {
      const btn = fixture.nativeElement.querySelector('.topbar__skip') as HTMLButtonElement;
      expect(btn.classList.contains('hidden')).toBeFalse();
    });

    it('should be hidden on the last slide', () => {
      c.currentIndex.set(c.slides.length - 1);
      fixture.detectChanges();
      const btn = fixture.nativeElement.querySelector('.topbar__skip') as HTMLButtonElement;
      expect(btn.classList.contains('hidden')).toBeTrue();
    });
  });

  describe('goTo', () => {
    it('should update currentIndex to the given slide', () => {
      c.goTo(2);
      expect(c.currentIndex()).toBe(2);
    });

    it('should clamp a negative index to 0', () => {
      c.goTo(-5);
      expect(c.currentIndex()).toBe(0);
    });

    it('should clamp an out-of-range index to the last slide', () => {
      c.goTo(100);
      expect(c.currentIndex()).toBe(c.slides.length - 1);
    });
  });

  describe('skip', () => {
    it('should jump to the last slide', () => {
      c.skip();
      expect(c.currentIndex()).toBe(c.slides.length - 1);
    });
  });

  describe('back', () => {
    it('should decrement currentIndex by one', () => {
      c.currentIndex.set(2);
      c.back();
      expect(c.currentIndex()).toBe(1);
    });
  });

  describe('finish (Empezar)', () => {
    it('should call completeOnboarding and navigate to root', async () => {
      c.currentIndex.set(c.slides.length - 1);
      await c.finish();
      expect(onboardingStateSpy.completeOnboarding).toHaveBeenCalledTimes(1);
      expect(routerSpy.navigate).toHaveBeenCalledWith(['']);
    });
  });

  describe('bottom sheet', () => {
    it('should open when openSheet is called', () => {
      c.openSheet();
      expect(c.isSheetOpen()).toBeTrue();
    });

    it('should close when closeSheet is called', () => {
      c.openSheet();
      c.closeSheet();
      expect(c.isSheetOpen()).toBeFalse();
    });

    it('should mark the info button as active when the sheet opens', () => {
      c.openSheet();
      expect(c.isInfoActive()).toBeTrue();
    });

    it('should deactivate the info button when the sheet closes', () => {
      c.openSheet();
      c.closeSheet();
      expect(c.isInfoActive()).toBeFalse();
    });

    it('should hide the tap hint once the sheet has been opened', () => {
      c.openSheet();
      expect(c.isHintGone()).toBeTrue();
    });

    it('should add sheet--open class to the sheet element', () => {
      c.openSheet();
      fixture.detectChanges();
      const sheet = fixture.nativeElement.querySelector('.sheet') as HTMLElement;
      expect(sheet.classList.contains('sheet--open')).toBeTrue();
    });

    it('should add sheet-scrim--open class to the scrim element', () => {
      c.openSheet();
      fixture.detectChanges();
      const scrim = fixture.nativeElement.querySelector('.sheet-scrim') as HTMLElement;
      expect(scrim.classList.contains('sheet-scrim--open')).toBeTrue();
    });
  });

  describe('chat demo', () => {
    it('should start with chat closed', () => {
      expect(c.isChatOpen()).toBeFalse();
    });

    it('should open chat when openChat is called', () => {
      c.openChat();
      expect(c.isChatOpen()).toBeTrue();
    });

    it('should hide the tap hint once the chat has been opened', () => {
      c.openChat();
      expect(c.isChatHintGone()).toBeTrue();
    });

    it('should add chat-fab--open class to the FAB after openChat', () => {
      c.openChat();
      fixture.detectChanges();
      const fab = fixture.nativeElement.querySelector('.chat-fab') as HTMLElement;
      expect(fab.classList.contains('chat-fab--open')).toBeTrue();
    });

    it('should show the chat messages after openChat', () => {
      c.openChat();
      fixture.detectChanges();
      const messages = fixture.nativeElement.querySelector('.chat-messages') as HTMLElement;
      expect(messages.classList.contains('chat-messages--visible')).toBeTrue();
    });
  });
});
