import { Component, ContentChild, Input, TemplateRef } from '@angular/core';

/**
 * Définition d'une colonne pour <ui-data-grid>.
 *
 * Exemple :
 *   <ui-data-grid-column key="name" header="Nom" [sortable]="true">
 *     <ng-template let-row>
 *       <strong>{{ row.businessName }}</strong>
 *     </ng-template>
 *   </ui-data-grid-column>
 *
 * Si aucun <ng-template> n'est fourni, la grille affiche `row[field || key]`
 * (avec dot-notation, ex: `field="user.phone"`).
 */
@Component({
  selector: 'ui-data-grid-column',
  standalone: true,
  template: '',
})
export class UiDataGridColumnComponent {
  /** Identifiant unique de la colonne (utilisé pour track et tri par défaut). */
  @Input({ required: true }) key!: string;

  /** Libellé affiché dans le header. */
  @Input({ required: true }) header!: string;

  /**
   * Chemin de la valeur dans la ligne (dot-notation : "user.phone").
   * Si omis, utilise `key`. Sert pour le tri client et le rendu sans template.
   */
  @Input() field?: string;

  /** Active le tri sur cette colonne (le grid doit aussi avoir [sortable]). */
  @Input() sortable = false;

  /** Largeur CSS (ex: "120px", "20%", "auto"). */
  @Input() width?: string;

  /** Alignement du contenu de la cellule. */
  @Input() align: 'left' | 'center' | 'right' = 'left';

  /** Masque la colonne (utile pour responsive conditionnel). */
  @Input() hidden = false;

  /** Classe CSS additionnelle appliquée aux <td> de cette colonne. */
  @Input() cellClass?: string;

  /** Template custom pour le rendu des cellules. Reçoit `let-row` et `let-index="index"`. */
  @ContentChild(TemplateRef) template?: TemplateRef<{ $implicit: any; row: any; index: number }>;
}
