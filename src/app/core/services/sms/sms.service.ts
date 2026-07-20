import { Injectable, inject } from '@angular/core';
import { registerPlugin } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';
import { Subject } from 'rxjs';

import { PlatformService } from '../platform/platform.service';
import { SmsParserService } from './sms-parser.service';
import { SmsDeduplicationService } from './sms-deduplication.service';
import { TransactionType } from '../../../shared/models/transaction.model';

/**
 * SMS shape as returned by the native SmsPlugin.java plugin.
 */
interface NativeSms {
  id: number;
  address: string;
  body: string;
  date: number;
}

interface SmsPluginInterface {
  getSmsInbox(options: {
    fromAddress?: string;
    minDate?: number;
    maxCount?: number;
  }): Promise<{ smsList: NativeSms[] }>;
  requestPermissions(): Promise<{ readSms: 'granted' | 'denied' | 'prompt' }>;
}

/**
 * Transaction parsed from an SMS, not yet persisted to the database.
 * The user reviews it in the bottom sheet and decides whether to approve it.
 */
export interface PendingSmsTransaction {
  name: string;
  amount: number;
  date: Date;
  transactionType: TransactionType;
  note: string;        // full original SMS — stored in `note` when the user approves
  smsAddress: string;  // used to mark deduplication on confirmation
  smsDate: number;     // used to mark deduplication on confirmation
}

/**
 * SmsService — Orchestrator for banking SMS synchronisation.
 *
 * User-controlled flow:
 * 1. The user presses the "Sync SMS" button.
 * 2. parseBankSms() reads, filters, deduplicates and parses SMS messages → returns PendingSmsTransaction[]
 *    without creating any transaction in the database.
 * 3. MainComponent displays the bottom sheet with the in-memory data.
 * 4. The user approves → SmsSyncSheetComponent calls createTransaction() only for checked items.
 * 5. markAsProcessed() is called from the sheet on confirmation, not here.
 */
@Injectable({ providedIn: 'root' })
export class SmsService {

  private readonly platform  = inject(PlatformService);
  private readonly parser    = inject(SmsParserService);
  private readonly dedup     = inject(SmsDeduplicationService);

  private readonly smsPlugin = registerPlugin<SmsPluginInterface>('Sms');

  private readonly SYNC_FROM_DATE_KEY      = 'sms_sync_from_date';
  private readonly DEFAULT_SYNC_WINDOW_DAYS = 20;

  /**
   * Emits the parsed transaction array when parsing completes with results.
   * MainComponent subscribes to this to open the review bottom sheet.
   * Transactions have NOT yet been persisted to the database.
   */
  readonly syncResult$ = new Subject<PendingSmsTransaction[]>();

  /**
   * Reads the native SMS inbox, filters by known banks, deduplicates and parses.
   * Does NOT create transactions in the database — returns parsed data for user review.
   *
   * @returns Array of PendingSmsTransaction ready to display in the sheet.
   *          Empty if permissions are missing, not running natively, or no new SMS found.
   */
  async parseBankSms(days?: number): Promise<PendingSmsTransaction[]> {
    if (!this.platform.isNative) return [];

    const hasPermission = await this.requestPermission();
    if (!hasPermission) return [];

    const minDate = days
      ? Date.now() - days * 24 * 60 * 60 * 1000
      : await this.getSyncFromTimestamp();

    let allSms: NativeSms[] = [];
    try {
      const { smsList } = await this.smsPlugin.getSmsInbox({ minDate, maxCount: 500 });
      allSms = smsList;
    } catch {
      return [];
    }

    const bankSms = allSms.filter(sms =>
      this.parser.KNOWN_BANK_SENDERS.some(bank =>
        sms.body.toLowerCase().includes(bank.toLowerCase())
      )
    );

    const pending: PendingSmsTransaction[] = [];

    for (const sms of bankSms) {
      const alreadyProcessed = await this.dedup.isProcessed(sms.address, sms.body, sms.date);
      if (alreadyProcessed) continue;

      const parsed = this.parser.parse(sms.body, sms.date);
      if (!parsed) continue;

      pending.push({
        name: parsed.merchant,
        amount: parsed.amount,
        date: parsed.date,
        transactionType: parsed.type,
        note: sms.body,
        smsAddress: sms.address,
        smsDate: sms.date,
      });
    }

    return pending;
  }

  /**
   * Marks an SMS as processed in the deduplication system.
   * Must be called from SmsSyncSheetComponent after the user approves,
   * only for transactions that were actually created in the database.
   */
  async markSmsAsProcessed(smsAddress: string, smsBody: string, smsDate: number): Promise<void> {
    await this.dedup.markAsProcessed(smsAddress, smsBody, smsDate);
  }

  /**
   * Mock SMS dataset with fixed epoch timestamps.
   * Dates in the SMS body and sms.date are consistent with each other so that the
   * SHA-256 hash computed by SmsDeduplicationService is stable across calls.
   *
   * Distribution by selector (reference date: 2026-07-20):
   *   Last 1 day  (≤24 h):  SMS 1 (2026-07-19)
   *   Last 3 days (≤72 h):  SMS 1-2 (2026-07-19, 2026-07-18)
   *   Last 7 days (≤168 h): SMS 1-5 (2026-07-19 to 2026-07-14)
   *
   * To remove mocks when moving to real-device testing:
   * 1. Delete this private `getMockSms()` method.
   * 2. Delete `triggerMockSync()` and `triggerMockFetch()`.
   * 3. In `SmsSyncSheetComponent.fetch()` remove the `triggerMockFetch` branch.
   */
  // --- MOCK DATA (remove before real-device testing) ---
  private getMockSms() {
    return [
      {
        address: '85540',
        body: 'Bancolombia: Recibiste una transferencia por $431,991 de MARIA SOTO en tu cuenta **9514, el 19/07/2026 a las 18:51. Si tienes dudas, hablemos: 018000931987. Siempre a tu lado.',
        date: Date.UTC(2026, 6, 19, 18, 51),   // 2026-07-19 18:51 UTC — month is 0-indexed (6 = julio)
      },
      {
        address: '85540',
        body: 'Bancolombia: Compraste COP40.900,00 en APPLE.COM/BILL, el 13:36 a las 18/07/2026. Esta compra esta asociada a T.Cred *8564. Si tienes dudas, encuentranos aqui: 01800931987. Siempre contigo.',
        date: Date.UTC(2026, 6, 18, 13, 36),   // 2026-07-18 13:36 UTC
      },
      {
        address: '85540',
        body: 'Bancolombia: Transferiste $2,500.00 por QR desde tu cuenta 9514 a la cuenta 0163, el 2026/07/16 15:03. ¿Dudas? Llamanos al 018000931987. Estamos cerca.',
        date: Date.UTC(2026, 6, 16, 15, 3),    // 2026-07-16 15:03 UTC
      },
      {
        address: '85540',
        body: 'Bancolombia: Pagaste $200,000.00 a CINE COLOMBIA S.A. desde tu producto *9514 el 15/07/2026 10:11:14. ¿Dudas? Llamanos al 6045109095. Estamos cerca',
        date: Date.UTC(2026, 6, 15, 10, 11, 14), // 2026-07-15 10:11:14 UTC
      },
      {
        address: '85540',
        body: 'Bancolombia: Transferiste $100,000.00 desde tu cuenta 9514 a la cuenta *3001230523 el 14/07/2026 a las 14:27. ¿Dudas? Llamanos al 018000931987. Estamos cerca.',
        date: Date.UTC(2026, 6, 14, 14, 27),   // 2026-07-14 14:27 UTC
      },
    ];
  }

  /** @deprecated Web development only — use parseBankSms() in production */
  async triggerMockSync(): Promise<void> {
    const pending = await this.triggerMockFetch(7);
    if (pending.length > 0) {
      this.syncResult$.next(pending);
    }
  }

  /**
   * Mock version of parseBankSms() for web development.
   * Filters mock SMS messages by the selected day range using the date parsed from
   * the SMS body (not sms.date, which is a fixed past timestamp).
   * Integrates SmsDeduplicationService the same way as parseBankSms() so that
   * deduplication works correctly in the web/mock flow.
   * @deprecated Replace with parseBankSms(days) for real-device testing
   */
  async triggerMockFetch(days: number): Promise<PendingSmsTransaction[]> {
    const minDate = Date.now() - days * 24 * 60 * 60 * 1000;
    const pending: PendingSmsTransaction[] = [];

    for (const sms of this.getMockSms()) {
      const alreadyProcessed = await this.dedup.isProcessed(sms.address, sms.body, sms.date);
      if (alreadyProcessed) continue;

      const parsed = this.parser.parse(sms.body, sms.date);
      if (!parsed) continue;

      // Filter by the date parsed from the SMS body (not the fixed sms.date timestamp)
      if (parsed.date.getTime() < minDate) continue;

      pending.push({
        name: parsed.merchant,
        amount: parsed.amount,
        date: parsed.date,
        transactionType: parsed.type,
        note: sms.body,
        smsAddress: sms.address,
        smsDate: sms.date,
      });
    }
    return pending;
  }
  // --- END MOCK DATA ---

  async requestPermission(): Promise<boolean> {
    try {
      const { readSms } = await this.smsPlugin.requestPermissions();
      return readSms === 'granted';
    } catch {
      return false;
    }
  }

  async getSyncFromTimestamp(): Promise<number> {
    try {
      const { value } = await Preferences.get({ key: this.SYNC_FROM_DATE_KEY });
      if (value) return parseInt(value, 10);
    } catch { /* use default */ }
    return Date.now() - (this.DEFAULT_SYNC_WINDOW_DAYS * 24 * 60 * 60 * 1000);
  }

  async setSyncFromDate(date: Date): Promise<void> {
    await Preferences.set({
      key: this.SYNC_FROM_DATE_KEY,
      value: date.getTime().toString()
    });
  }

  async getSyncFromDate(): Promise<Date | null> {
    try {
      const { value } = await Preferences.get({ key: this.SYNC_FROM_DATE_KEY });
      if (value) return new Date(parseInt(value, 10));
    } catch { /* silent */ }
    return null;
  }
}