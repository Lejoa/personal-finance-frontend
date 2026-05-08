import { TestBed } from '@angular/core/testing';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { MarkdownPipe } from './markdown.pipe';

describe('MarkdownPipe', () => {
  let pipe: MarkdownPipe;

  const html = (value: string): string => {
    const result = pipe.transform(value);
    // SafeHtml wraps the string — extract it via the internal property
    return (result as any).changingThisBreaksApplicationSecurity ?? String(result);
  };

  beforeEach(() => {
    TestBed.configureTestingModule({});
    const sanitizer = TestBed.inject(DomSanitizer);
    pipe = new MarkdownPipe(sanitizer);
  });

  it('should create', () => {
    expect(pipe).toBeTruthy();
  });

  it('should return empty string for falsy input', () => {
    expect(pipe.transform('')).toBe('');
  });

  it('should wrap a plain line in a paragraph', () => {
    expect(html('Texto normal')).toContain('<p class="analysis-paragraph">');
    expect(html('Texto normal')).toContain('Texto normal');
  });

  it('should convert **heading** line to h4', () => {
    expect(html('**Mi Título**')).toContain('<h4 class="analysis-heading">Mi Título</h4>');
  });

  it('should convert "- item" to list item inside ul', () => {
    const result = html('- Primer ítem');
    expect(result).toContain('<ul class="analysis-list">');
    expect(result).toContain('<li>Primer ítem</li>');
    expect(result).toContain('</ul>');
  });

  it('should group consecutive list items in a single ul', () => {
    const result = html('- Item A\n- Item B');
    const ulCount = (result.match(/<ul/g) ?? []).length;
    expect(ulCount).toBe(1);
    expect(result).toContain('<li>Item A</li>');
    expect(result).toContain('<li>Item B</li>');
  });

  it('should close ul before a heading', () => {
    const result = html('- ítem\n**Nuevo título**');
    expect(result).toContain('</ul>');
    expect(result).toContain('<h4');
  });

  it('should close ul on blank line', () => {
    const result = html('- ítem\n\nPárrafo');
    expect(result).toContain('</ul>');
    expect(result).toContain('<p class="analysis-paragraph">');
  });

  it('should close ul at end of input', () => {
    expect(html('- último ítem')).toContain('</ul>');
  });

  it('should apply inline bold inside list items', () => {
    expect(html('- texto **negrita** fin')).toContain('<strong>negrita</strong>');
  });

  it('should apply inline bold inside paragraphs', () => {
    expect(html('Esto es **importante** aquí')).toContain('<strong>importante</strong>');
  });

  it('should escape HTML special chars', () => {
    const result = html('a > b & c < d "quote"');
    expect(result).toContain('&gt;');
    expect(result).toContain('&amp;');
    expect(result).toContain('&lt;');
    expect(result).toContain('&quot;');
  });

  it('should handle multi-section markdown', () => {
    const result = html('**Sección**\n- ítem 1\n- ítem 2\n\nPárrafo final');
    expect(result).toContain('<h4');
    expect(result).toContain('<li>');
    expect(result).toContain('<p');
  });
});
