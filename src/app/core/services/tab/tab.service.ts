import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TabService {

  private activeTabSubject = new BehaviorSubject<string>('Home');
  readonly activeTab$ = this.activeTabSubject.asObservable();

  private avaliableTabs = ['Home', 'Tracking', 'Create', 'Budgets', 'Learning'];

  setActiveTab(tab: string): void {
    this.activeTabSubject.next(tab);
  }
  
  getActiveTab(): string {
    return this.activeTabSubject.value;
  }
}
