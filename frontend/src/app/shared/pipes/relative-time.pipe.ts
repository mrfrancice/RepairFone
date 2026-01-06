import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'relativeTime',
  standalone: true
})
export class RelativeTimePipe implements PipeTransform {
  transform(value: string | Date | null | undefined): string {
    if (!value) {
      return '';
    }

    const date = typeof value === 'string' ? new Date(value) : value;
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);
    const diffWeek = Math.floor(diffDay / 7);
    const diffMonth = Math.floor(diffDay / 30);

    if (diffSec < 60) {
      return 'À l\'instant';
    }

    if (diffMin < 60) {
      return `Il y a ${diffMin} min`;
    }

    if (diffHour < 24) {
      return `Il y a ${diffHour}h`;
    }

    if (diffDay === 1) {
      return 'Hier';
    }

    if (diffDay < 7) {
      return `Il y a ${diffDay} jours`;
    }

    if (diffWeek < 4) {
      return `Il y a ${diffWeek} sem.`;
    }

    if (diffMonth < 12) {
      return `Il y a ${diffMonth} mois`;
    }

    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  }
}
