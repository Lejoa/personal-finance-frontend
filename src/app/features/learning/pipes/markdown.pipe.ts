import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Pipe({
  name: 'markdown',
  standalone: true,
})
export class MarkdownPipe implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) {}

  transform(value: string): SafeHtml {
    if (!value) return '';
    const html = this.convertToHtml(value);
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }

  private convertToHtml(text: string): string {
    const lines = text.split('\n');
    const result: string[] = [];
    let inList = false;

    for (const raw of lines) {
      const line = raw.trimEnd();

      // Encabezado: **Texto** en línea sola
      const headingMatch = line.match(/^\*\*(.+?)\*\*\s*$/);
      if (headingMatch) {
        if (inList) { result.push('</ul>'); inList = false; }
        result.push(`<h4 class="analysis-heading">${this.escapeHtml(headingMatch[1])}</h4>`);
        continue;
      }

      // Ítem de lista: - texto
      if (line.startsWith('- ')) {
        if (!inList) { result.push('<ul class="analysis-list">'); inList = true; }
        const content = this.inlineFormat(line.slice(2));
        result.push(`<li>${content}</li>`);
        continue;
      }

      // Línea vacía
      if (line.trim() === '') {
        if (inList) { result.push('</ul>'); inList = false; }
        continue;
      }

      // Párrafo normal
      if (inList) { result.push('</ul>'); inList = false; }
      result.push(`<p class="analysis-paragraph">${this.inlineFormat(line)}</p>`);
    }

    if (inList) result.push('</ul>');
    return result.join('');
  }

  /** Convierte **texto** → <strong> dentro de una línea */
  private inlineFormat(text: string): string {
    return this.escapeHtml(text).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  }

  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}