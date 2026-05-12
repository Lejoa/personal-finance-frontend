import { Injectable } from '@angular/core';

/**
 * Result of parsing a banking SMS.
 * If the SMS cannot be parsed, the service returns null.
 */
export interface ParsedSmsTransaction {
  type: 'ingreso' | 'gasto';
  amount: number;
  merchant: string;   // merchant name or description
  date: Date;
  rawText: string;    // original text kept for reference and deduplication
}

/**
 * SmsParserService — Extracts transaction data from the text of a banking SMS.
 *
 * Single responsibility: text parsing. Knows nothing about storage or HTTP.
 *
 * Parsing strategy:
 * Named-capture-group regexes are used for each transaction field.
 * Patterns cover the most common Colombian banking SMS formats.
 * If no pattern matches, parse() returns null — the caller decides whether
 * to ignore or log the unrecognised SMS.
 *
 * Extensibility: to add a new bank, add an entry to BANK_PATTERNS.
 */
@Injectable({ providedIn: 'root' })
export class SmsParserService {

  /**
   * Known banking senders.
   * Used to filter the inbox before parsing — avoids processing irrelevant SMS messages.
   * Partial match, case-insensitive (the Java plugin uses LIKE %value%).
   *
   * Keywords that must appear in the SMS body to identify it as a banking message.
   * Partial case-insensitive match on the message body is used because the address
   * field is a short code (e.g. 85540), not the bank name.
   */
  readonly KNOWN_BANK_SENDERS = [
    'Bancolombia',
    'Davivienda',
    'Nequi',
    'Banco Bogota',
    'Colpatria',
    'Occidente',
    'BBVA',
    'Scotiabank',
    'Falabella',
    'Serfinanza',
    'Bancopueblo',
  ];

  /**
   * Banking SMS patterns tuned to Bancolombia's real message format.
   *
   * Supported amount formats:
   * - $2,500.00    → thousands separator: comma, decimal: period
   * - COP40.900,00 → thousands separator: period, decimal: comma
   * - $200,000.00
   *
   * Each entry: [pattern, transaction type]
   */
  private readonly PATTERNS: [RegExp, 'ingreso' | 'gasto'][] = [
    // "Compraste COP40.900,00 en COMERCIO" o "Compraste $X en COMERCIO"
    [/Compraste\s+(?:COP)?\s*\$?([\d.,]+)\s+en\s+(.+?)(?:,\s*el|\s+el\s+\d|\s+Esta\s+compra|$)/i, 'gasto'],

    // "Pagaste $200,000.00 a ENTIDAD desde tu producto"
    [/Pagaste\s+(?:COP)?\s*\$?([\d.,]+)\s+a\s+(.+?)(?:\s+desde|\s+el\s+\d|,|$)/i, 'gasto'],

    // "Transferiste $X por QR desde tu cuenta X a la cuenta Y"
    [/Transferiste\s+(?:COP)?\s*\$?([\d.,]+)\s+(?:por\s+\w+\s+)?desde\s+tu\s+cuenta\s+\S+\s+a\s+la\s+cuenta\s+(\S+)/i, 'gasto'],

    // "Transferiste $X desde tu cuenta X a la cuenta Y"
    [/Transferiste\s+(?:COP)?\s*\$?([\d.,]+)\s+desde\s+tu\s+cuenta\s+\S+\s+a\s+la\s+cuenta\s+(\S+)/i, 'gasto'],

    // "Retiraste $X en CAJERO"
    [/Retiraste\s+(?:COP)?\s*\$?([\d.,]+)\s+en\s+(.+?)(?:\s+el\s+\d|,|$)/i, 'gasto'],

    // "Recibiste $X de ORIGEN"
    [/Recibiste\s+(?:COP)?\s*\$?([\d.,]+)\s+(?:de|por)\s+(.+?)(?:\s+el\s+\d|,|$)/i, 'ingreso'],

    // "Abono de $X"
    [/Abono\s+(?:de\s+)?(?:COP)?\s*\$?([\d.,]+)\s+(?:de|por|en)\s+(.+?)(?:\s+el\s+\d|,|$)/i, 'ingreso'],
  ];

  /**
   * Supported date patterns (in priority order):
   * 1. "el 2026/03/11 15:03"        → YYYY/MM/DD HH:MM
   * 2. "el 14/03/2026"              → DD/MM/YYYY (no time)
   * 3. "el 07/03/2026 a las 14:27"  → DD/MM/YYYY a las HH:MM
   * 4. "el 04/03/2026 10:11:14"     → DD/MM/YYYY HH:MM:SS (no "a las")
   */
  private readonly DATE_PATTERNS: ((body: string) => Date | null)[] = [
    // YYYY/MM/DD HH:MM  — ej: "2026/03/11 15:03"
    (body) => {
      const m = body.match(/\b(\d{4})\/(\d{2})\/(\d{2})\s+(\d{2}):(\d{2})/);
      if (!m) return null;
      return new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]);
    },
    // DD/MM/YYYY a las HH:MM — ej: "el 07/03/2026 a las 14:27"
    (body) => {
      const m = body.match(/\b(\d{2})\/(\d{2})\/(\d{4})\s+a\s+las\s+(\d{2}):(\d{2})/i);
      if (!m) return null;
      return new Date(+m[3], +m[2] - 1, +m[1], +m[4], +m[5]);
    },
    // DD/MM/YYYY HH:MM:SS — ej: "04/03/2026 10:11:14"
    (body) => {
      const m = body.match(/\b(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2}):\d{2}/);
      if (!m) return null;
      return new Date(+m[3], +m[2] - 1, +m[1], +m[4], +m[5]);
    },
    // el HH:MM a las DD/MM/YYYY — ej: "el 13:36 a las 14/03/2026"
    (body) => {
      const m = body.match(/el\s+(\d{2}):(\d{2})\s+a\s+las\s+(\d{2})\/(\d{2})\/(\d{4})/i);
      if (!m) return null;
      return new Date(+m[5], +m[4] - 1, +m[3], +m[1], +m[2]);
    },
    // DD/MM/YYYY sin hora — ej: "el 14/03/2026"
    (body) => {
      const m = body.match(/\b(\d{2})\/(\d{2})\/(\d{4})\b/);
      if (!m) return null;
      return new Date(+m[3], +m[2] - 1, +m[1]);
    },
  ];

  /**
   * Attempts to parse the text of a banking SMS.
   *
   * @param body          Full SMS body text
   * @param smsTimestamp  Unix timestamp (ms) of the SMS — used as fallback when no date is found in the text
   * @returns ParsedSmsTransaction if the SMS is recognised, null if no pattern matches
   */
  parse(body: string, smsTimestamp: number): ParsedSmsTransaction | null {
    for (const [pattern, type] of this.PATTERNS) {
      const match = body.match(pattern);
      if (!match) continue;

      const amount = this.parseAmount(match[1]);
      const merchant = this.cleanMerchant(match[2] ?? '');

      if (amount <= 0 || !merchant) continue;

      const date = this.parseDate(body, smsTimestamp);

      return { type, amount, merchant, date, rawText: body };
    }

    return null;
  }

  /**
   * Parses the amount by stripping thousands separators and normalising the decimal separator.
   * Colombian format: $1.200.000,50 → 1200000.50
   */
  private parseAmount(raw: string): number {
    // Detect the format by looking at the last separator:
    // - "2,500.00"  → comma=thousands, period=decimal  → strip commas
    // - "40.900,00" → period=thousands, comma=decimal  → strip periods, comma→period
    // - "200,000.00"→ comma=thousands, period=decimal  → strip commas
    let normalized: string;
    const lastComma  = raw.lastIndexOf(',');
    const lastPeriod = raw.lastIndexOf('.');

    if (lastPeriod > lastComma) {
      // period is the decimal separator → comma is thousands
      normalized = raw.replace(/,/g, '');
    } else {
      // comma is the decimal separator → period is thousands
      normalized = raw.replace(/\./g, '').replace(',', '.');
    }

    const value = parseFloat(normalized);
    return isNaN(value) ? 0 : value;
  }

  /**
   * Cleans the merchant name by removing residual text.
   */
  private cleanMerchant(raw: string): string {
    return raw
      .trim()
      .replace(/\s+/g, ' ')  // collapse multiple spaces
      .substring(0, 100);    // truncate to stay well under the backend name field limit (255 chars)
  }

  /**
   * Extracts the date from the SMS text. Falls back to the SMS timestamp if no pattern matches.
   * Expected text format: "el 02/02/2026 a las 17:40"
   */
  private parseDate(body: string, fallbackTimestamp: number): Date {
    for (const extractor of this.DATE_PATTERNS) {
      const date = extractor(body);
      if (date && !isNaN(date.getTime())) return date;
    }
    return new Date(fallbackTimestamp);
  }
}
