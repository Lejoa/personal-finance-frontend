import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class NormalizeDatesService {

  constructor() { }

  /**
   * Method to parse date string in local timezone
   * @param dateString 
   * @returns 
   */
  public parseLocalDate(dateString: string): Date {
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    date.setHours(0, 0, 0, 0);
    
    return date;
  }

  /**
   * Method to normalize date to midnight
   * @param date 
   * @returns Date
   */
  public normalizeDate(date: Date): Date {
    const normalized = new Date(date);
    normalized.setHours(0, 0, 0, 0);
    return normalized;
  }
}
