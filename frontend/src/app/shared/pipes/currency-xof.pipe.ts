import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'currencyXof',
  standalone: true
})
export class CurrencyXofPipe implements PipeTransform {
  transform(value: number | string | null | undefined, showSymbol = true): string {
    if (value === null || value === undefined || value === '') {
      return '';
    }

    const numValue = typeof value === 'string' ? parseFloat(value) : value;

    if (isNaN(numValue)) {
      return '';
    }

    const formatted = numValue.toLocaleString('fr-FR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });

    return showSymbol ? `${formatted} FCFA` : formatted;
  }
}
