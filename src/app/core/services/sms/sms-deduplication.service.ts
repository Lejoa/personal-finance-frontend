import { Injectable } from '@angular/core';
import { Preferences } from '@capacitor/preferences';

/**
 * SmsDeduplicationService — Prevents duplicate registration of SMS-sourced transactions.
 *
 * Strategy:
 * Each SMS is identified by a SHA-256 hash computed over (address + body + date_ms).
 * Processed hashes are stored in @capacitor/preferences under the key
 * 'sms_processed_hashes' as a JSON array.
 *
 * Why SHA-256 instead of SHA-1?
 * SubtleCrypto (Web Crypto API) is available in the WebView because we use
 * androidScheme: 'https', which requires a secure context. SHA-256 is the minimum
 * algorithm recommended by the W3C for new implementations.
 *
 * Why @capacitor/preferences instead of localStorage?
 * @capacitor/preferences persists to Android SharedPreferences — it survives
 * browser cache clears. localStorage can be wiped by the OS under memory pressure.
 *
 * 500-hash cap with FIFO rotation:
 * Each hash is ~64 chars. 500 hashes ≈ 32 KB — a reasonable limit that covers
 * several months of history without growing indefinitely.
 */
@Injectable({ providedIn: 'root' })
export class SmsDeduplicationService {

  private readonly STORAGE_KEY = 'sms_processed_hashes';
  private readonly MAX_HASHES = 500;

  /**
   * Returns true if the given SMS has already been processed.
   * @param address SMS sender (short code or bank name)
   * @param body    SMS body text
   * @param date    Unix timestamp in ms of the SMS
   */
  async isProcessed(address: string, body: string, date: number): Promise<boolean> {
    const hash = await this.computeHash(address, body, date);
    const hashes = await this.loadHashes();
    return hashes.includes(hash);
  }

  /**
   * Marks an SMS as processed by persisting its hash.
   * Applies FIFO rotation when the MAX_HASHES cap is exceeded.
   */
  async markAsProcessed(address: string, body: string, date: number): Promise<void> {
    const hash = await this.computeHash(address, body, date);
    const hashes = await this.loadHashes();

    if (hashes.includes(hash)) return; // already recorded — skip to avoid store duplication

    hashes.push(hash);

    // FIFO rotation: if the cap is exceeded, drop the oldest entries (front of the array)
    const trimmed = hashes.length > this.MAX_HASHES
      ? hashes.slice(hashes.length - this.MAX_HASHES)
      : hashes;

    await Preferences.set({
      key: this.STORAGE_KEY,
      value: JSON.stringify(trimmed)
    });
  }

  /**
   * Loads the hash array from Preferences.
   * Returns an empty array if the key does not exist or the value cannot be parsed.
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
   * Computes the SHA-256 hash of (address + body + date) using the Web Crypto API.
   *
   * Web Crypto API (window.crypto.subtle) is available in:
   * - Modern browsers running in an HTTPS context
   * - Android WebView with androidScheme: 'https' — our case
   *
   * Returns a 64-character hex string.
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
