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
   * Mock SMS dataset with timestamps computed relative to "now" (UTC) instead of
   * fixed dates, so the dataset never goes stale no matter when a demo happens.
   * The date embedded in each SMS body is formatted from the same Date used for
   * `date`, keeping both consistent — SmsDeduplicationService hashes over both,
   * and SmsParserService extracts the transaction date from the body text.
   *
   * Distribution by selector (relative to today):
   *   Last 1 day  (≤24 h):  SMS 1 (1 day ago)
   *   Last 3 days (≤72 h):  SMS 1-2 (1, 2 days ago)
   *   Last 7 days (≤168 h): SMS 1-5 (1, 2, 4, 5, 6 days ago)
   *
   * To remove mocks when moving to real-device testing:
   * 1. Delete this private `getMockSms()` method.
   * 2. Delete `triggerMockSync()` and `triggerMockFetch()`.
   * 3. In `SmsSyncSheetComponent.fetch()` remove the `triggerMockFetch` branch.
   */
  // --- MOCK DATA (remove before real-device testing) ---
  private getMockSms() {
    const daysAgo = (days: number, h: number, m: number, s = 0): Date => {
      const d = new Date();
      d.setUTCDate(d.getUTCDate() - days);
      d.setUTCHours(h, m, s, 0);
      return d;
    };
    const pad = (n: number): string => n.toString().padStart(2, '0');
    const ddmmyyyy = (d: Date): string => `${pad(d.getUTCDate())}/${pad(d.getUTCMonth() + 1)}/${d.getUTCFullYear()}`;
    const yyyymmdd = (d: Date): string => `${d.getUTCFullYear()}/${pad(d.getUTCMonth() + 1)}/${pad(d.getUTCDate())}`;
    const hhmm = (d: Date): string => `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;
    const hhmmss = (d: Date): string => `${hhmm(d)}:${pad(d.getUTCSeconds())}`;

    const d1 = daysAgo(1, 18, 51);
    const d2 = daysAgo(2, 13, 36);
    const d3 = daysAgo(4, 15, 3);
    const d4 = daysAgo(5, 10, 11, 14);
    const d5 = daysAgo(6, 14, 27);

    return [
      {
        address: '85540',
        body: `Bancolombia: Recibiste una transferencia por $431,991 de MARIA SOTO en tu cuenta **9514, el ${ddmmyyyy(d1)} a las ${hhmm(d1)}. Si tienes dudas, hablemos: 018000931987. Siempre a tu lado.`,
        date: d1.getTime(),
      },
      {
        address: '85540',
        body: `Bancolombia: Compraste COP40.900,00 en APPLE.COM/BILL, el ${hhmm(d2)} a las ${ddmmyyyy(d2)}. Esta compra esta asociada a T.Cred *8564. Si tienes dudas, encuentranos aqui: 01800931987. Siempre contigo.`,
        date: d2.getTime(),
      },
      {
        address: '85540',
        body: `Bancolombia: Transferiste $2,500.00 por QR desde tu cuenta 9514 a la cuenta 0163, el ${yyyymmdd(d3)} ${hhmm(d3)}. ¿Dudas? Llamanos al 018000931987. Estamos cerca.`,
        date: d3.getTime(),
      },
      {
        address: '85540',
        body: `Bancolombia: Pagaste $200,000.00 a CINE COLOMBIA S.A. desde tu producto *9514 el ${ddmmyyyy(d4)} ${hhmmss(d4)}. ¿Dudas? Llamanos al 6045109095. Estamos cerca`,
        date: d4.getTime(),
      },
      {
        address: '85540',
        body: `Bancolombia: Transferiste $100,000.00 desde tu cuenta 9514 a la cuenta *3001230523 el ${ddmmyyyy(d5)} a las ${hhmm(d5)}. ¿Dudas? Llamanos al 018000931987. Estamos cerca.`,
        date: d5.getTime(),
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