import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';

/**
 * Servicio centralizado para detectar la plataforma en runtime.
 *
 * Capacitor.isNativePlatform() verifica en tiempo de ejecución si el bridge
 * nativo (JS ↔ Java/Kotlin) está activo. Es más confiable que environment.isNative
 * porque ese valor es fijo en compile-time: si por error se carga un build de
 * Android en un browser web, environment.isNative diría true pero el bridge no
 * existiría, causando errores al llamar cualquier API nativa.
 *
 * Capacitor.getPlatform() retorna: 'android' | 'ios' | 'web'
 */
@Injectable({
  providedIn: 'root'
})
export class PlatformService {
  readonly isNative: boolean = Capacitor.isNativePlatform();
  readonly isAndroid: boolean = Capacitor.getPlatform() === 'android';
  readonly isWeb: boolean = !Capacitor.isNativePlatform();
  readonly platform: 'android' | 'ios' | 'web' = Capacitor.getPlatform() as 'android' | 'ios' | 'web';
}
