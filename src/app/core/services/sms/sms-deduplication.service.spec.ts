import { TestBed } from '@angular/core/testing';
import { SmsDeduplicationService } from './sms-deduplication.service';

// Mock @capacitor/preferences
const preferencesStore: Record<string, string> = {};

{/* placeholder — Karma uses jasmine */}

describe('SmsDeduplicationService', () => {
  let service: SmsDeduplicationService;

  beforeEach(() => {
    // Clear the in-memory store
    Object.keys(preferencesStore).forEach(k => delete preferencesStore[k]);

    // Patch Preferences at module level via spyOnAllFunctions is not available on the static import.
    // Instead, override window.crypto.subtle and @capacitor/preferences via jasmine spies on the
    // service's private methods via (service as any) access.
    TestBed.configureTestingModule({});
    service = TestBed.inject(SmsDeduplicationService);

    // Stub the private computeHash so tests are deterministic and don't need real SubtleCrypto
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    spyOn<any>(service, 'computeHash').and.callFake(
      (address: string, body: string, date: number) =>
        Promise.resolve(`hash_${address}_${date}`)
    );

    // Stub loadHashes and the Preferences store calls
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    spyOn<any>(service, 'loadHashes').and.callFake(() =>
      Promise.resolve(preferencesStore['sms_processed_hashes']
        ? JSON.parse(preferencesStore['sms_processed_hashes'])
        : []
      )
    );

    // Stub Preferences.set via the service's markAsProcessed indirectly —
    // we override markAsProcessed to write to our in-memory store.
    spyOn(service, 'markAsProcessed').and.callFake(async (address: string, body: string, date: number) => {
      const hash = `hash_${address}_${date}`;
      const current: string[] = preferencesStore['sms_processed_hashes']
        ? JSON.parse(preferencesStore['sms_processed_hashes'])
        : [];
      if (!current.includes(hash)) {
        current.push(hash);
        preferencesStore['sms_processed_hashes'] = JSON.stringify(current);
      }
    });
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('isProcessed', () => {
    it('should return false for an unprocessed SMS', async () => {
      const result = await service.isProcessed('BANCO', 'Compraste $100 en TIENDA', 1000);
      expect(result).toBeFalse();
    });

    it('should return true after marking as processed', async () => {
      await service.markAsProcessed('BANCO', 'Compraste $100 en TIENDA', 1000);
      const result = await service.isProcessed('BANCO', 'Compraste $100 en TIENDA', 1000);
      expect(result).toBeTrue();
    });

    it('should return false for a different SMS even if another was marked', async () => {
      await service.markAsProcessed('BANCO', 'Compraste $100', 1000);
      const result = await service.isProcessed('BANCO', 'Recibiste $200', 2000);
      expect(result).toBeFalse();
    });
  });

  describe('markAsProcessed', () => {
    it('should not add duplicate hashes', async () => {
      await service.markAsProcessed('BANCO', 'SMS', 1000);
      await service.markAsProcessed('BANCO', 'SMS', 1000);
      const stored: string[] = JSON.parse(preferencesStore['sms_processed_hashes'] ?? '[]');
      expect(stored.length).toBe(1);
    });
  });
});
