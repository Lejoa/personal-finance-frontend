import { Injectable } from '@angular/core';

/**
 * Resultado del parsing de un SMS bancario.
 * Si el SMS no puede ser parseado, el servicio retorna null.
 */
export interface ParsedSmsTransaction {
  type: 'ingreso' | 'gasto';
  amount: number;
  merchant: string;   // nombre del comercio o descripción
  date: Date;
  rawText: string;    // texto original para referencia y deduplicación
}

/**
 * SmsParserService — Extrae datos de transacción del texto de un SMS bancario.
 *
 * Responsabilidad única: parsing de texto. No sabe nada de storage ni de HTTP.
 *
 * Estrategia de parsing:
 * Se usan regex con grupos de captura nombrados para cada dato de la transacción.
 * Los patrones cubren los formatos más comunes de los SMS bancarios colombianos.
 * Si ningún patrón coincide, el método parse() retorna null — el llamador decide
 * si ignorar o registrar el SMS no reconocido.
 *
 * Extensibilidad: para agregar un banco nuevo, agregar una entrada en BANK_PATTERNS.
 */
@Injectable({ providedIn: 'root' })
export class SmsParserService {

  /**
   * Remitentes bancarios conocidos.
   * Se usan para filtrar el buzón antes de parsear — evita procesar SMS irrelevantes.
   * Coincidencia parcial, case-insensitive (el plugin Java usa LIKE %value%).
   */
  // Palabras clave que deben aparecer en el BODY del SMS para identificarlo como bancario.
  // Se usa coincidencia parcial case-insensitive sobre el cuerpo del mensaje,
  // porque el campo address es un número corto (ej: 85540) no el nombre del banco.
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
   * Patrones de SMS bancarios ajustados al formato real de Bancolombia.
   *
   * Formatos de monto soportados:
   * - $2,500.00   → separador de miles: coma, decimal: punto
   * - COP40.900,00 → separador de miles: punto, decimal: coma
   * - $200,000.00
   *
   * Cada entrada: [patrón, tipo de transacción]
   */
  private readonly PATTERNS: Array<[RegExp, 'ingreso' | 'gasto']> = [
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
   * Patrones de fecha soportados (en orden de prioridad):
   * 1. "el 2026/03/11 15:03"        → YYYY/MM/DD HH:MM
   * 2. "el 14/03/2026"              → DD/MM/YYYY (sin hora)
   * 3. "el 07/03/2026 a las 14:27"  → DD/MM/YYYY a las HH:MM
   * 4. "el 04/03/2026 10:11:14"     → DD/MM/YYYY HH:MM:SS (sin "a las")
   */
  private readonly DATE_PATTERNS: Array<(body: string) => Date | null> = [
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
   * Intenta parsear el texto de un SMS bancario.
   *
   * @param body  Texto completo del SMS
   * @param smsTimestamp  Timestamp Unix (ms) del SMS — usado como fallback si no hay fecha en el texto
   * @returns ParsedSmsTransaction si el SMS es reconocido, null si no aplica ningún patrón
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
   * Parsea el monto eliminando puntos de miles y reemplazando coma decimal.
   * Formato colombiano: $1.200.000,50 → 1200000.50
   */
  private parseAmount(raw: string): number {
    // Detectar el formato según el separador final:
    // - "2,500.00" → coma=miles, punto=decimal  → eliminar comas
    // - "40.900,00" → punto=miles, coma=decimal → eliminar puntos, coma→punto
    // - "200,000.00" → coma=miles, punto=decimal → eliminar comas
    let normalized: string;
    const lastComma  = raw.lastIndexOf(',');
    const lastPeriod = raw.lastIndexOf('.');

    if (lastPeriod > lastComma) {
      // el punto es el separador decimal → coma es miles
      normalized = raw.replace(/,/g, '');
    } else {
      // la coma es el separador decimal → punto es miles
      normalized = raw.replace(/\./g, '').replace(',', '.');
    }

    const value = parseFloat(normalized);
    return isNaN(value) ? 0 : value;
  }

  /**
   * Limpia el nombre del comercio eliminando texto residual.
   */
  private cleanMerchant(raw: string): string {
    return raw
      .trim()
      .replace(/\s+/g, ' ')  // colapsar espacios múltiples
      .substring(0, 100);    // truncar para no exceder el campo name del backend (255 chars)
  }

  /**
   * Extrae la fecha del texto del SMS. Si no encuentra el patrón, usa el timestamp del SMS.
   * Formato en el texto: "el 02/02/2026 a las 17:40"
   */
  private parseDate(body: string, fallbackTimestamp: number): Date {
    for (const extractor of this.DATE_PATTERNS) {
      const date = extractor(body);
      if (date && !isNaN(date.getTime())) return date;
    }
    return new Date(fallbackTimestamp);
  }
}
