import { Injectable, inject } from '@angular/core';
import { registerPlugin } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';
import { Subject } from 'rxjs';

import { PlatformService } from '../platform/platform.service';
import { SmsParserService } from './sms-parser.service';
import { SmsDeduplicationService } from './sms-deduplication.service';
import { TransactionType } from '../../../shared/models/transaction.model';

/**
 * Interfaz del SMS tal como lo retorna el plugin nativo SmsPlugin.java.
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
 * Transacción parseada desde un SMS, aún no guardada en BD.
 * El usuario la revisa en el sheet y decide si aprobarla.
 */
export interface PendingSmsTransaction {
  name: string;
  amount: number;
  date: Date;
  transactionType: TransactionType;
  note: string;        // SMS original completo — se guarda en `note` al aprobar
  smsAddress: string;  // para marcar dedup al confirmar
  smsDate: number;     // para marcar dedup al confirmar
}

/**
 * SmsService — Orquestador de la sincronización de SMS bancarios.
 *
 * Nuevo flujo (controlado por usuario):
 * 1. El usuario presiona el botón "Sincronizar SMS"
 * 2. parseBankSms() lee, filtra, deduplica y parsea los SMS → devuelve PendingSmsTransaction[]
 *    sin crear ninguna transacción en BD
 * 3. MainComponent muestra el sheet con los datos en memoria
 * 4. El usuario aprueba → SmsSyncSheetComponent llama createTransaction() solo para las chequeadas
 * 5. markAsProcessed() se llama desde el sheet al confirmar, no aquí
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
   * Emite el array de transacciones parseadas cuando el parseo completa con resultados.
   * MainComponent se suscribe para abrir el bottom sheet de revisión.
   * Las transacciones AÚN NO han sido guardadas en BD.
   */
  readonly syncResult$ = new Subject<PendingSmsTransaction[]>();

  /**
   * Lee el buzón de SMS nativo, filtra por bancos conocidos, deduplica y parsea.
   * NO crea transacciones en BD — devuelve los datos parseados para que el usuario los revise.
   *
   * @returns Array de PendingSmsTransaction listas para mostrar en el sheet.
   *          Vacío si no hay permisos, no es nativo, o no hubo SMS nuevos.
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
   * Marca un SMS como procesado en el sistema de deduplicación.
   * Debe llamarse desde SmsSyncSheetComponent después de que el usuario apruebe,
   * solo para las transacciones efectivamente creadas en BD.
   */
  async markSmsAsProcessed(smsAddress: string, smsBody: string, smsDate: number): Promise<void> {
    await this.dedup.markAsProcessed(smsAddress, smsBody, smsDate);
  }

  /**
   * Dataset de SMS mock con offsets relativos a `now` en horas.
   * Las fechas se recalculan en cada llamada para que siempre sean recientes.
   *
   * Distribución por selector:
   *   Hace 1 día  (≤24 h): SMS 1 (12 h)
   *   Hace 3 días (≤72 h): SMS 1 + 2 (12 h, 48 h)
   *   Hace 7 días (≤168h): SMS 1–5 (12 h, 48 h, 108 h, 132 h, 156 h)
   *
   * Para eliminar los mocks cuando vayas a pruebas reales:
   * 1. Borra este método privado `getMockSms()`
   * 2. Elimina `triggerMockSync()` y `triggerMockFetch()`
   * 3. En `SmsSyncSheetComponent.fetch()` borra la rama `triggerMockFetch`
   */
  // --- MOCK DATA (remover para pruebas con dispositivo real) ---
  private getMockSms() {
    const h = (hours: number) => Date.now() - hours * 60 * 60 * 1000;
    return [
      {
        address: '85540',
        body: 'Bancolombia: Recibiste una transferencia por $431,991 de MARIA SOTO en tu cuenta **9514, el 25/01/2026 a las 18:51. Si tienes dudas, hablemos: 018000931987. Siempre a tu lado.',
        date: h(12),   // ~hace 12 h → visible en "Hace 1 día"
      },
      {
        address: '85540',
        body: 'Bancolombia: Compraste COP40.900,00 en APPLE.COM/BILL, el 13:36 a las 14/03/2026. Esta compra esta asociada a T.Cred *8564. Si tienes dudas, encuentranos aqui: 01800931987. Siempre contigo.',
        date: h(48),   // ~hace 2 días → visible desde "Hace 3 días"
      },
      {
        address: '85540',
        body: 'Bancolombia: Transferiste $2,500.00 por QR desde tu cuenta 9514 a la cuenta 0163, el 2026/03/11 15:03. ¿Dudas? Llamanos al 018000931987. Estamos cerca.',
        date: h(108),  // ~hace 4.5 días → visible desde "Hace 7 días"
      },
      {
        address: '85540',
        body: 'Bancolombia: Pagaste $200,000.00 a CINE COLOMBIA S.A. desde tu producto *9514 el 04/03/2026 10:11:14. ¿Dudas? Llamanos al 6045109095. Estamos cerca',
        date: h(132),  // ~hace 5.5 días → visible desde "Hace 7 días"
      },
      {
        address: '85540',
        body: 'Bancolombia: Transferiste $100,000.00 desde tu cuenta 9514 a la cuenta *3001230523 el 07/03/2026 a las 14:27. ¿Dudas? Llamanos al 018000931987. Estamos cerca.',
        date: h(156),  // ~hace 6.5 días → visible desde "Hace 7 días"
      },
    ];
  }

  /** @deprecated Solo para desarrollo web — usar parseBankSms() en producción */
  async triggerMockSync(): Promise<void> {
    const pending = await this.triggerMockFetch(7);
    if (pending.length > 0) {
      this.syncResult$.next(pending);
    }
  }

  /**
   * Versión mock de parseBankSms() para desarrollo en web.
   * Filtra los mock SMS por el rango de días seleccionado.
   * @deprecated Reemplazar por parseBankSms(days) en pruebas reales
   */
  async triggerMockFetch(days: number): Promise<PendingSmsTransaction[]> {
    const minDate = Date.now() - days * 24 * 60 * 60 * 1000;
    const pending: PendingSmsTransaction[] = [];

    for (const sms of this.getMockSms().filter(s => s.date >= minDate)) {
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
  // --- FIN MOCK DATA ---

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
    } catch { /* usa el default */ }
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
    } catch { /* silencioso */ }
    return null;
  }
}