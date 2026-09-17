import { Injectable } from '@nestjs/common';

@Injectable()
export class PlanExpiryService {
  /**
   * Adds an exact number of days to a UTC date.
   */
  addDays(start: Date, days: number): Date {
    const result = new Date(start);
    result.setUTCDate(result.getUTCDate() + days);
    return result;
  }

  /**
   * Adds 1 calendar year to a UTC date, with leap year day clamping
   * (e.g. Feb 29 -> Feb 28 on non-leap target year).
   */
  addCalendarYear(start: Date): Date {
    const result = new Date(start);
    const targetYear = result.getUTCFullYear() + 1;
    const month = result.getUTCMonth();
    const day = result.getUTCDate();

    // Clamp to last day of month when original day doesn't exist in target year (Feb 29 -> Feb 28)
    const lastDay = new Date(Date.UTC(targetYear, month + 1, 0)).getUTCDate();
    result.setUTCFullYear(targetYear, month, Math.min(day, lastDay));
    return result;
  }

  standardExpiry(start: Date = new Date()): Date {
    return this.addDays(start, 90);
  }

  proExpiry(start: Date = new Date()): Date {
    return this.addDays(start, 180);
  }

  proPlusExpiry(start: Date = new Date()): Date {
    return this.addCalendarYear(start);
  }

  resolveExpiryForTier(tierName: string, start: Date = new Date()): Date {
    const normalized = tierName?.toUpperCase() || 'STANDARD';
    if (
      normalized === 'PRO_PLUS' ||
      normalized === 'PRO+' ||
      normalized === 'ANNUAL' ||
      normalized === '1_YEAR'
    ) {
      return this.proPlusExpiry(start);
    }
    if (
      normalized === 'PRO' ||
      normalized === '180_DAYS' ||
      normalized === 'QUARTERLY'
    ) {
      return this.proExpiry(start);
    }
    return this.standardExpiry(start);
  }
}
