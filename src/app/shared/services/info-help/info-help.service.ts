import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { InfoConcept } from '../../interfaces/info-concept.interface';

@Injectable({ providedIn: 'root' })
export class InfoHelpService {
  private readonly _activeConcept$ = new BehaviorSubject<InfoConcept | null>(null);
  readonly activeConcept$ = this._activeConcept$.asObservable();

  open(concept: InfoConcept): void {
    this._activeConcept$.next(concept);
  }

  close(): void {
    this._activeConcept$.next(null);
  }
}
