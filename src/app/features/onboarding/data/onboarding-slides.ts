import { OnboardingSlide } from '../interfaces/onboarding-slide.interface';

export const ONBOARDING_SLIDES: OnboardingSlide[] = [
  {
    id: 1,
    icon: 'wallet',
    tone: 'red',
    title: 'Tu dinero, bajo control',
    description: 'Aprende a manejar tus finanzas mientras usas la app, sin tecnicismos ni complicaciones.'
  },
  {
    id: 2,
    icon: 'arrows',
    tone: 'green',
    title: 'Todo parte de dos cosas',
    description: 'Tu dinero se mueve entre ingresos (lo que entra) y gastos (lo que sale). Con eso armas tu presupuesto.'
  },
  {
    id: 3,
    icon: 'donut',
    tone: 'red',
    title: 'Descubre en qué se va tu dinero',
    description: 'Agrupamos tus gastos en categorías y analizamos tus movimientos para mostrarte tus hábitos.'
  },
  {
    id: 4,
    icon: 'bulb',
    tone: 'red',
    title: '¿No conoces un concepto? Tócalo',
    description: 'Verás un ícono ⓘ junto a los términos. Tócalo y te lo explicamos al instante, sin salir de donde estás.',
    isDemo: true
  },
  {
    id: 5,
    icon: 'chat',
    tone: 'red',
    title: 'Empieza a registrar',
    description: 'Toca el botón + y cuéntale a la app lo que gastaste. Sin formularios, solo escribe como si le hablaras a un amigo.',
    isChat: true
  }
];
