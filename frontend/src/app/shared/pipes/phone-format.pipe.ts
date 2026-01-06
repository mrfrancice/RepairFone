import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'phoneFormat',
  standalone: true
})
export class PhoneFormatPipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    if (!value) {
      return '';
    }

    // Remove all non-digit characters
    const cleaned = value.replace(/\D/g, '');

    // Format for Ivory Coast numbers (e.g., +225 07 XX XX XX XX)
    if (cleaned.length === 10) {
      return cleaned.replace(/(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4 $5');
    }

    if (cleaned.length === 12 && cleaned.startsWith('225')) {
      return '+225 ' + cleaned.slice(3).replace(/(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4 $5');
    }

    // Return as-is if format doesn't match
    return value;
  }
}
