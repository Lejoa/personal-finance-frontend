import { Injectable } from '@angular/core';
import { Preferences } from '@capacitor/preferences';

/**
 * SmsDeduplicationService — Previene el registro duplicado de transacciones de SMS.
 *
 * Estrategia:
 * Cada SMS se identifica por un hash SHA-256 calculado sobre (address + body + date_ms).
 * Los hashes procesados se almacenan en @capacitor/preferences bajo la clave
 * 'sms_processed_hashes' como un array JSON.
 *
 * ¿Por qué SHA-256 y no SHA-1?
 * SubtleCrypto (Web Crypto API) está disponible en el WebView porque usamos
 * androidScheme: 'https' — requiere un contexto seguro. SHA-256 es el algoritmo
 * mínimo recomendado por la W3C para nuevas implementaciones.
 *
 * ¿Por qué @capacitor/preferences y no localStorage?
 * @capacitor/preferences persiste en SharedPreferences de Android — sobrevive
 * a limpiezas de caché del navegador. localStorage puede ser borrado por el
 * sistema cuando hay presión de memoria.
 *
 * Límite de 500 hashes con rotación FIFO:
 * Cada hash ocupa ~64 chars. 500 hashes ≈ 32KB — un límite razonable que
 * cubre el historial de varios meses sin crecer indefinidamente.
 */
@Injectable({ providedIn: 'root' })
export class SmsDeduplicationService {

  private readonly STORAGE_KEY = 'sms_processed_hashes';
  private readonly MAX_HASHES = 500;

  /**
   * Verifica si un SMS ya fue procesado.
   * @param address Remitente del SMS (número o nombre del banco)
   * @param body    Texto del SMS
   * @param date    Timestamp Unix en ms del SMS
   */
  async isProcessed(address: string, body: string, date: number): Promise<boolean> {
    const hash = await this.computeHash(address, body, date);
    const hashes = await this.loadHashes();
    return hashes.includes(hash);
  }

  /**
   * Marca un SMS como procesado guardando su hash.
   * Aplica rotación FIFO si se supera MAX_HASHES.
   */
  async markAsProcessed(address: string, body: string, date: number): Promise<void> {
    const hash = await this.computeHash(address, body, date);
    const hashes = await this.loadHashes();

    if (hashes.includes(hash)) return; // ya estaba, no duplicar en el store

    hashes.push(hash);

    // Rotación FIFO: si supera el límite, eliminar los más antiguos (al inicio del array)
    const trimmed = hashes.length > this.MAX_HASHES
      ? hashes.slice(hashes.length - this.MAX_HASHES)
      : hashes;

    await Preferences.set({
      key: this.STORAGE_KEY,
      value: JSON.stringify(trimmed)
    });
  }

  /**
   * Carga el array de hashes desde Preferences.
   * Retorna array vacío si no existe o hay error de parseo.
   */
  private async loadHashes(): Promise<string[]> {
    try {
      const { value } = await Preferences.get({ key: this.STORAGE_KEY });
      if (!value) return [];
      return JSON.parse(value) as string[];
    } catch {
      return [];
    }
  }

  /**
   * Calcula SHA-256 de (address + body + date) usando Web Crypto API.
   *
   * Web Crypto API (window.crypto.subtle) está disponible en:
   * - Browsers modernos en contexto HTTPS
   * - Android WebView con androidScheme: 'https' — nuestro caso
   *
   * El resultado es un hex string de 64 caracteres.
   */
  private async computeHash(address: string, body: string, date: number): Promise<string> {
    const input = `${address}|${body}|${date}`;
    const encoder = new TextEncoder();
    const data = encoder.encode(input);
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
}
