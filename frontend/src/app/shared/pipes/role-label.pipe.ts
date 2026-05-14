import { Pipe, PipeTransform } from '@angular/core';

/**
 * Convertit un role utilisateur ('client' | 'repairer' | 'admin') en label
 * FR pour l'affichage. Pure pipe : Angular cache automatiquement le resultat
 * pour les meme entrees, ce qui evite la re-evaluation a chaque change
 * detection cycle (vs methode de composant).
 */
@Pipe({ name: 'roleLabel', standalone: true })
export class RoleLabelPipe implements PipeTransform {
  private static readonly LABELS: Record<string, string> = {
    client: 'Client',
    repairer: 'Reparateur',
    admin: 'Admin',
  };

  transform(role: string | null | undefined): string {
    if (!role) return '';
    return RoleLabelPipe.LABELS[role] ?? role;
  }
}
