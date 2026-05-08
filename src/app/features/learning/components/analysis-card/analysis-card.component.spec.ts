import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { AnalysisCardComponent } from './analysis-card.component';
import { FinancialAnalysis } from '../../interfaces/learning-content.interfaces';
import { MarkdownPipe } from '../../pipes/markdown.pipe';

const mockAnalysis: FinancialAnalysis = {
  id: 1,
  period: '2024-05',
  checkpoint: 'end',
  content: 'Análisis de cierre de mayo.',
  isRead: false,
  generatedAt: '2024-05-31T10:00:00Z'
};

describe('AnalysisCardComponent', () => {
  let component: AnalysisCardComponent;
  let fixture: ComponentFixture<AnalysisCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AnalysisCardComponent],
      providers: [MarkdownPipe],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(AnalysisCardComponent);
    component = fixture.componentInstance;
    component.analysis = { ...mockAnalysis };
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('title getter', () => {
    it('should return "Cierre de mayo 2024" for checkpoint end', () => {
      expect(component.title).toBe('Cierre de mayo 2024');
    });

    it('should return "Mediados de mayo 2024" for checkpoint mid', () => {
      component.analysis = { ...mockAnalysis, checkpoint: 'mid' };
      expect(component.title).toBe('Mediados de mayo 2024');
    });
  });

  describe('formattedDate getter', () => {
    it('should return only the date part (YYYY-MM-DD)', () => {
      expect(component.formattedDate).toBe('2024-05-31');
    });
  });

  describe('toggleExpanded', () => {
    it('should set isExpanded to true on first call', () => {
      component.toggleExpanded();
      expect(component.isExpanded).toBeTrue();
    });

    it('should toggle isExpanded back to false on second call', () => {
      component.toggleExpanded();
      component.toggleExpanded();
      expect(component.isExpanded).toBeFalse();
    });

    it('should mark analysis as read and emit read event when expanding an unread analysis', () => {
      const emitted: number[] = [];
      component.read.subscribe(id => emitted.push(id));

      component.toggleExpanded();

      expect(component.analysis.isRead).toBeTrue();
      expect(emitted).toEqual([mockAnalysis.id]);
    });

    it('should not emit read event when collapsing', () => {
      const emitted: number[] = [];
      component.toggleExpanded(); // expand → emite
      component.read.subscribe(id => emitted.push(id));

      component.toggleExpanded(); // collapse → no emite

      expect(emitted.length).toBe(0);
    });

    it('should not emit read event when expanding an already-read analysis', () => {
      component.analysis = { ...mockAnalysis, isRead: true };
      const emitted: number[] = [];
      component.read.subscribe(id => emitted.push(id));

      component.toggleExpanded();

      expect(emitted.length).toBe(0);
    });
  });
});
