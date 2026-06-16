export type InfoAccent = 'red' | 'green';

export interface InfoConcept {
  id: string;
  title: string;
  accent: InfoAccent;
  definition: string;
  example?: string;          // may contain safe HTML for highlighted amounts
  exampleProgress?: number;  // 0–100 for progress bar width
  exampleStat?: string;      // label shown below the progress bar
  tip?: string;
}
