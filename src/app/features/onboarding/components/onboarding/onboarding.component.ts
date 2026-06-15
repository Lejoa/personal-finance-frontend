import {
  Component,
  AfterViewInit,
  ElementRef,
  viewChild,
  inject,
  DestroyRef,
  signal,
  computed
} from '@angular/core';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { fromEvent } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { ONBOARDING_SLIDES } from '../../data/onboarding-slides';
import { OnboardingStateService } from '../../services/onboarding-state.service';

@Component({
  selector: 'app-onboarding',
  standalone: true,
  imports: [],
  templateUrl: './onboarding.component.html',
  styleUrl: './onboarding.component.scss'
})
export class OnboardingComponent implements AfterViewInit {
  private readonly router = inject(Router);
  private readonly onboardingState = inject(OnboardingStateService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly slides = ONBOARDING_SLIDES;
  protected readonly trackRef = viewChild<ElementRef<HTMLElement>>('track');

  protected currentIndex = signal(0);
  protected isSheetOpen = signal(false);
  protected isInfoActive = signal(false);
  protected isHintGone = signal(false);
  protected isChatOpen = signal(false);
  protected isChatHintGone = signal(false);

  protected readonly isFirst = computed(() => this.currentIndex() === 0);
  protected readonly isLast = computed(() => this.currentIndex() === this.slides.length - 1);

  ngAfterViewInit(): void {
    const track = this.trackRef()?.nativeElement;
    if (!track) return;

    fromEvent(track, 'scroll')
      .pipe(debounceTime(50), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        const idx = Math.round(track.scrollLeft / track.clientWidth);
        this.currentIndex.set(idx);
      });
  }

  protected goTo(index: number): void {
    const clamped = Math.max(0, Math.min(this.slides.length - 1, index));
    this.currentIndex.set(clamped);
    const track = this.trackRef()?.nativeElement;
    track?.scrollTo({ left: clamped * track.clientWidth, behavior: 'smooth' });
  }

  protected next(): void {
    if (!this.isLast()) {
      this.goTo(this.currentIndex() + 1);
    } else {
      void this.finish();
    }
  }

  protected back(): void {
    this.goTo(this.currentIndex() - 1);
  }

  protected skip(): void {
    this.goTo(this.slides.length - 1);
  }

  protected async finish(): Promise<void> {
    await this.onboardingState.completeOnboarding();
    await this.router.navigate(['']);
  }

  protected openSheet(): void {
    this.isSheetOpen.set(true);
    this.isInfoActive.set(true);
    this.isHintGone.set(true);
  }

  protected closeSheet(): void {
    this.isSheetOpen.set(false);
    this.isInfoActive.set(false);
  }

  protected openChat(): void {
    this.isChatOpen.set(true);
    this.isChatHintGone.set(true);
  }
}
