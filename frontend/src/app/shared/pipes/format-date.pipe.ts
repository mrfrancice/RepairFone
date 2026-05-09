import { Pipe, PipeTransform } from '@angular/core';
import { formatDate, formatDateTime, formatTime, getRelativeTime } from '../utils/date.utils';

export type DateFormat = 'date' | 'datetime' | 'time' | 'short' | 'long' | 'relative';

@Pipe({
  name: 'formatDate',
  standalone: true,
})
export class FormatDatePipe implements PipeTransform {
  transform(
    value: string | Date | null | undefined,
    format: DateFormat = 'short'
  ): string {
    if (!value) {
      return '';
    }

    const date = typeof value === 'string' ? new Date(value) : value;

    switch (format) {
      case 'datetime':
        return formatDateTime(date);

      case 'time':
        return formatTime(date);

      case 'long':
        return formatDate(date, {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        });

      case 'relative':
        return getRelativeTime(date);

      case 'date':
      case 'short':
      default:
        return formatDate(date, {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        });
    }
  }
}
