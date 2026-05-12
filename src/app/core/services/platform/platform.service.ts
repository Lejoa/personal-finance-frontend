import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';

/**
 * Centralised service for runtime platform detection.
 *
 * Capacitor.isNativePlatform() checks at runtime whether the native bridge
 * (JS ↔ Java/Kotlin) is active. This is more reliable than environment.isNative,
 * which is a compile-time constant: if an Android build were accidentally loaded
 * in a regular browser, environment.isNative would be true but the bridge would
 * not exist, causing errors on any native API call.
 *
 * Capacitor.getPlatform() returns: 'android' | 'ios' | 'web'
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
