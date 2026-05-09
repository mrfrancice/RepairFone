import { Pipe, PipeTransform } from '@angular/core';
import { getInitials } from '../utils/format.utils';

@Pipe({
  name: 'initials',
  standalone: true,
})
export class InitialsPipe implements PipeTransform {
  transform(
    firstName: string | null | undefined,
    lastName?: string | null
  ): string {
    return getInitials(firstName || undefined, lastName || undefined);
  }
}
