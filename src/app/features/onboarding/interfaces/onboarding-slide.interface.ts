export interface OnboardingSlide {
  id: number;
  icon: 'wallet' | 'arrows' | 'donut' | 'bulb' | 'chat';
  tone: 'red' | 'green';
  title: string;
  description: string;
  isDemo?: boolean;
  isChat?: boolean;
}
