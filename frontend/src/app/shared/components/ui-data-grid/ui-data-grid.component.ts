import {
  AfterContentInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ContentChildren,
  EventEmitter,
  Input,
  OnDestroy,
  Output,
  QueryList,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { UiDataGridColumnComponent } from './ui-data-grid-column.component';

export type SortDirection = 'asc' | 'desc';

export interface DataGridSortEvent {
  field: string;
  direction: SortDirection;
}

export interface DataGridPageEvent {
  page: number;
  pageSize: number;
}

/**
 * Composant tableau réutilisable avec pagination et tri.
 *
 * Mode CLIENT (défaut) : pagine et trie en mémoire à partir de [data].
 * Mode SERVEUR : passez [serverSide]="true" + [total] (nombre total de lignes).
 *   La grille rend telle quelle [data] (1 page de données fournie par le parent)
 *   et émet (pageChange) / (sortChange) pour que le parent re-fetch.
 *
 * Exemple :
 *   <ui-data-grid
 *     [data]="users()"
 *     [pageSize]="10"
 *     [pageSizeOptions]="[10, 25, 50]"
 *     [rowClickable]="true"
 *     emptyMessage="Aucun utilisateur"
 *     (rowClick)="openDrawer($event)"
 *   >
 *     <ui-data-grid-column key="name" header="Nom" field="firstName" [sortable]="true">
 *       <ng-template let-row>
 *         <strong>{{ row.firstName }} {{ row.lastName }}</strong>
 *       </ng-template>
 *     </ui-data-grid-column>
 *
 *     <ui-data-grid-column key="phone" header="Tél." field="phone" />
 *
 *     <ui-data-grid-column key="actions" header="Actions" align="right">
 *       <ng-template let-row>
 *         <button (click)="approve(row); $event.stopPropagation()">✓</button>
 *       </ng-template>
 *     </ui-data-grid-column>
 *   </ui-data-grid>
 */
@Component({
  selector: 'ui-data-grid',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="data-grid-shell" [class.dense]="dense" [class.striped]="striped">
      <div class="data-grid-scroll">
        <table class="data-grid-table">
          <thead>
            <tr>
              @for (col of visibleColumns(); track col.key) {
                <th
                  [class.sortable]="col.sortable"
                  [class.sorted]="isSorted(col)"
                  [class.align-center]="col.align === 'center'"
                  [class.align-right]="col.align === 'right'"
                  [style.width]="col.width || null"
                  [attr.aria-sort]="getAriaSort(col)"
                  (click)="onHeaderClick(col)"
                  (keydown.enter)="onHeaderClick(col)"
                  (keydown.space)="onHeaderClick(col); $event.preventDefault()"
                  [attr.tabindex]="col.sortable ? 0 : null"
                  [attr.role]="col.sortable ? 'button' : null"
                >
                  <span class="th-content">
                    <span>{{ col.header }}</span>
                    @if (col.sortable) {
                      <svg
                        class="sort-icon"
                        [class.active]="isSorted(col)"
                        [class.desc]="isSorted(col) && sortDir() === 'desc'"
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        aria-hidden="true"
                      >
                        <path d="M6 9L12 15L18 9" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
                      </svg>
                    }
                  </span>
                </th>
              }
            </tr>
          </thead>

          <tbody>
            @if (loading) {
              <tr class="state-row">
                <td [attr.colspan]="visibleColumns().length">
                  <div class="state-cell">
                    <div class="spinner"></div>
                    <span>Chargement…</span>
                  </div>
                </td>
              </tr>
            } @else if (paginatedData().length === 0) {
              <tr class="state-row">
                <td [attr.colspan]="visibleColumns().length">
                  <div class="state-cell empty">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" stroke-width="1.5"/>
                      <path d="M3 10H21" stroke="currentColor" stroke-width="1.5"/>
                      <path d="M9 14H15" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                    </svg>
                    <span>{{ emptyMessage }}</span>
                  </div>
                </td>
              </tr>
            } @else {
              @for (row of paginatedData(); track trackBy(row, $index); let i = $index) {
                <tr
                  [class.clickable]="rowClickable"
                  (click)="rowClickable && rowClick.emit(row)"
                >
                  @for (col of visibleColumns(); track col.key) {
                    <td
                      [class]="col.cellClass || ''"
                      [class.align-center]="col.align === 'center'"
                      [class.align-right]="col.align === 'right'"
                      [attr.data-label]="col.header"
                    >
                      @if (col.template) {
                        <ng-container
                          *ngTemplateOutlet="col.template; context: { $implicit: row, row: row, index: i }"
                        ></ng-container>
                      } @else {
                        {{ getValue(row, col.field || col.key) }}
                      }
                    </td>
                  }
                </tr>
              }
            }
          </tbody>
        </table>
      </div>

      @if (showPagination && totalItems() > 0 && !loading) {
        <div class="data-grid-footer">
          <div class="page-size-group">
            <label [attr.for]="selectId">Lignes par page :</label>
            <select [id]="selectId" [value]="pageSize()" (change)="onPageSizeChange($event)">
              @for (size of pageSizeOptions; track size) {
                <option [value]="size">{{ size }}</option>
              }
            </select>
          </div>

          <div class="page-info">
            {{ rangeStart() }}–{{ rangeEnd() }} sur {{ totalItems() }}
          </div>

          <div class="page-controls">
            <button
              type="button"
              class="page-btn"
              [disabled]="currentPage() === 1"
              (click)="goToPage(1)"
              aria-label="Première page"
              title="Première page"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M11 17L6 12L11 7M18 17L13 12L18 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
            <button
              type="button"
              class="page-btn"
              [disabled]="currentPage() === 1"
              (click)="goToPage(currentPage() - 1)"
              aria-label="Page précédente"
              title="Page précédente"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
            <span class="page-current">
              <strong>{{ currentPage() }}</strong> / {{ totalPages() }}
            </span>
            <button
              type="button"
              class="page-btn"
              [disabled]="currentPage() === totalPages()"
              (click)="goToPage(currentPage() + 1)"
              aria-label="Page suivante"
              title="Page suivante"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M9 6L15 12L9 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
            <button
              type="button"
              class="page-btn"
              [disabled]="currentPage() === totalPages()"
              (click)="goToPage(totalPages())"
              aria-label="Dernière page"
              title="Dernière page"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M13 17L18 12L13 7M6 17L11 12L6 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    :host { display: block; }

    .data-grid-shell {
      background: white;
      border-radius: 16px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
      overflow: hidden;
    }

    .data-grid-scroll {
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
    }

    .data-grid-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.875rem;
    }

    /* Header */
    thead th {
      position: sticky;
      top: 0;
      z-index: 1;
      background: #FAFAFA;
      color: #6b7280;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      padding: 0.875rem 1rem;
      text-align: left;
      border-bottom: 1px solid #EEEEEE;
      white-space: nowrap;
      user-select: none;
    }

    thead th.align-center { text-align: center; }
    thead th.align-right  { text-align: right; }

    thead th.sortable {
      cursor: pointer;
      transition: background 0.15s ease, color 0.15s ease;
    }

    thead th.sortable:hover {
      background: #F5F5F5;
      color: #1f2937;
    }

    thead th.sorted {
      color: var(--color-primary-500, #FF9800);
      background: #FFF8F0;
    }

    thead th:focus-visible {
      outline: 2px solid var(--color-primary-500, #FF9800);
      outline-offset: -2px;
    }

    .th-content {
      display: inline-flex;
      align-items: center;
      gap: 0.375rem;
    }

    thead th.align-right .th-content { justify-content: flex-end; }
    thead th.align-center .th-content { justify-content: center; }

    .sort-icon {
      opacity: 0.4;
      transition: transform 0.2s ease, opacity 0.15s ease;
    }

    .sort-icon.active { opacity: 1; }
    .sort-icon.desc { transform: rotate(180deg); }

    /* Body */
    tbody tr {
      transition: background 0.15s ease;
    }

    tbody tr:not(.state-row) + tr:not(.state-row) td {
      border-top: 1px solid #F5F5F5;
    }

    tbody tr.clickable {
      cursor: pointer;
    }

    tbody tr.clickable:hover {
      background: #FFF8F0;
    }

    tbody td {
      padding: 0.875rem 1rem;
      color: #1f2937;
      vertical-align: middle;
    }

    tbody td.align-center { text-align: center; }
    tbody td.align-right  { text-align: right; }

    /* Striped rows */
    .data-grid-shell.striped tbody tr:not(.state-row):nth-child(even) {
      background: #FAFAFA;
    }

    .data-grid-shell.striped tbody tr.clickable:hover {
      background: #FFF8F0;
    }

    /* Dense variant */
    .data-grid-shell.dense thead th {
      padding: 0.625rem 0.75rem;
      font-size: 0.6875rem;
    }

    .data-grid-shell.dense tbody td {
      padding: 0.625rem 0.75rem;
      font-size: 0.8125rem;
    }

    /* States */
    .state-row td {
      padding: 3rem 1rem;
      text-align: center;
      color: #9ca3af;
    }

    .state-cell {
      display: inline-flex;
      flex-direction: column;
      align-items: center;
      gap: 0.75rem;
      font-size: 0.875rem;
    }

    .state-cell.empty svg {
      color: #D1D5DB;
    }

    .spinner {
      width: 32px;
      height: 32px;
      border: 3px solid #FFE5D9;
      border-top-color: var(--color-primary-500, #FF9800);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    /* Footer / pagination */
    .data-grid-footer {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      padding: 0.75rem 1rem;
      background: white;
      border-top: 1px solid #F5F5F5;
      font-size: 0.8125rem;
      color: #6b7280;
    }

    .page-size-group {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
    }

    .page-size-group label {
      white-space: nowrap;
    }

    .page-size-group select {
      padding: 0.375rem 0.625rem;
      padding-right: 1.75rem;
      border: 1px solid #EEEEEE;
      border-radius: 8px;
      background: white;
      font-size: 0.8125rem;
      font-family: inherit;
      color: #1f2937;
      cursor: pointer;
      appearance: none;
      background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M6 9L12 15L18 9'/></svg>");
      background-repeat: no-repeat;
      background-position: right 0.5rem center;
    }

    .page-size-group select:focus-visible {
      outline: 2px solid var(--color-primary-500, #FF9800);
      outline-offset: 1px;
      border-color: var(--color-primary-500, #FF9800);
    }

    .page-info {
      font-variant-numeric: tabular-nums;
    }

    .page-controls {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
    }

    .page-btn {
      min-width: 32px;
      height: 32px;
      padding: 0 0.5rem;
      border: 1px solid #EEEEEE;
      border-radius: 8px;
      background: white;
      color: #6b7280;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      transition: all 0.15s ease;
    }

    .page-btn:hover:not(:disabled) {
      border-color: var(--color-primary-500, #FF9800);
      color: var(--color-primary-500, #FF9800);
      background: #FFF8F0;
    }

    .page-btn:focus-visible {
      outline: 2px solid var(--color-primary-500, #FF9800);
      outline-offset: 1px;
    }

    .page-btn:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }

    .page-current {
      padding: 0 0.625rem;
      font-variant-numeric: tabular-nums;
      color: #1f2937;
    }

    .page-current strong {
      color: var(--color-primary-500, #FF9800);
    }

    /* Responsive : sur mobile, transforme le tableau en cards stackées */
    @media (max-width: 640px) {
      .data-grid-table thead {
        display: none;
      }

      .data-grid-table,
      .data-grid-table tbody,
      .data-grid-table tr,
      .data-grid-table td {
        display: block;
        width: 100%;
      }

      .data-grid-table tbody tr:not(.state-row) {
        padding: 0.75rem;
        margin-bottom: 0.5rem;
        border: 1px solid #F5F5F5;
        border-radius: 12px;
      }

      .data-grid-table tbody tr:not(.state-row) + tr:not(.state-row) td {
        border-top: none;
      }

      .data-grid-table tbody td {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 1rem;
        padding: 0.5rem 0;
        text-align: left !important;
      }

      .data-grid-table tbody td::before {
        content: attr(data-label);
        font-size: 0.6875rem;
        font-weight: 600;
        color: #9ca3af;
        text-transform: uppercase;
        letter-spacing: 0.3px;
        flex-shrink: 0;
      }

      .data-grid-footer {
        flex-direction: column;
        align-items: stretch;
        text-align: center;
      }

      .page-size-group,
      .page-controls {
        justify-content: center;
      }
    }
  `],
})
export class UiDataGridComponent<T = any> implements AfterContentInit, OnDestroy {
  private readonly cdr = inject(ChangeDetectorRef);
  private static instanceCount = 0;

  /** Données à afficher. En mode serveur, c'est la page courante uniquement. */
  @Input() data: T[] = [];

  /** Active la pagination/tri côté serveur. Le parent gère le slicing. */
  @Input() serverSide = false;

  /** Mode serveur : nombre total de lignes (pour calculer le nombre de pages). */
  @Input() total?: number;

  /** Indicateur de chargement (affiche un spinner à la place du contenu). */
  @Input() loading = false;

  /** Message affiché quand aucune donnée. */
  @Input() emptyMessage = 'Aucune donnée';

  /** Lignes cliquables (curseur pointer + event rowClick). */
  @Input() rowClickable = false;

  /** Active les rangées alternées (effet zébré). */
  @Input() striped = false;

  /** Variante compacte (padding/font réduits). */
  @Input() dense = false;

  /** Affiche la barre de pagination. */
  @Input() showPagination = true;

  /** Choix du sélecteur "Lignes par page". */
  @Input() pageSizeOptions: number[] = [10, 25, 50, 100];

  /** Clé de la ligne pour trackBy (par défaut "id"). Supporte dot-notation. */
  @Input() trackByKey: string = 'id';

  /** Page initiale (mode client) ou page courante (mode serveur). */
  @Input()
  set page(value: number) {
    if (value && value > 0) this.currentPage.set(value);
  }
  get page(): number {
    return this.currentPage();
  }

  /** Taille de page initiale (10 par défaut). En mode serveur, le parent contrôle aussi. */
  @Input()
  set pageSize(value: number) {
    if (value && value > 0) this._pageSize.set(value);
  }
  get pageSize(): () => number {
    return this._pageSize;
  }

  /** Émis quand la pagination change (utile en mode serveur). */
  @Output() pageChange = new EventEmitter<DataGridPageEvent>();

  /** Émis quand le tri change (utile en mode serveur). */
  @Output() sortChange = new EventEmitter<DataGridSortEvent>();

  /** Émis quand l'utilisateur clique sur une ligne (si [rowClickable]="true"). */
  @Output() rowClick = new EventEmitter<T>();

  @ContentChildren(UiDataGridColumnComponent)
  private readonly columnsQuery!: QueryList<UiDataGridColumnComponent>;

  // Internal state
  readonly currentPage = signal(1);
  private readonly _pageSize = signal(10);
  readonly sortField = signal<string | null>(null);
  readonly sortDir = signal<SortDirection>('asc');
  readonly visibleColumns = signal<UiDataGridColumnComponent[]>([]);

  readonly selectId = `ui-data-grid-page-size-${++UiDataGridComponent.instanceCount}`;

  // Computed
  readonly totalItems = computed(() =>
    this.serverSide ? (this.total ?? 0) : this.data.length
  );

  readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.totalItems() / this._pageSize()))
  );

  readonly sortedData = computed(() => {
    if (this.serverSide) return this.data;
    const field = this.sortField();
    if (!field) return this.data;
    const dir = this.sortDir() === 'asc' ? 1 : -1;
    const copy = [...this.data];
    copy.sort((a, b) => {
      const av = this.getValue(a, field);
      const bv = this.getValue(b, field);
      if (av == null && bv == null) return 0;
      if (av == null) return -1 * dir;
      if (bv == null) return 1 * dir;
      if (typeof av === 'string' && typeof bv === 'string') {
        return av.localeCompare(bv) * dir;
      }
      if (av < bv) return -1 * dir;
      if (av > bv) return 1 * dir;
      return 0;
    });
    return copy;
  });

  readonly paginatedData = computed(() => {
    if (this.serverSide) return this.data;
    const start = (this.currentPage() - 1) * this._pageSize();
    return this.sortedData().slice(start, start + this._pageSize());
  });

  readonly rangeStart = computed(() => {
    const total = this.totalItems();
    if (total === 0) return 0;
    return (this.currentPage() - 1) * this._pageSize() + 1;
  });

  readonly rangeEnd = computed(() =>
    Math.min(this.currentPage() * this._pageSize(), this.totalItems())
  );

  private columnsSub?: Subscription;

  ngAfterContentInit(): void {
    this.refreshColumns();
    this.columnsSub = this.columnsQuery.changes.subscribe(() => {
      this.refreshColumns();
      this.cdr.markForCheck();
    });
  }

  ngOnDestroy(): void {
    this.columnsSub?.unsubscribe();
  }

  private refreshColumns(): void {
    this.visibleColumns.set(this.columnsQuery.filter((c) => !c.hidden));
  }

  // Sort
  isSorted(col: UiDataGridColumnComponent): boolean {
    return this.sortField() === (col.field || col.key);
  }

  getAriaSort(col: UiDataGridColumnComponent): string | null {
    if (!col.sortable) return null;
    if (!this.isSorted(col)) return 'none';
    return this.sortDir() === 'asc' ? 'ascending' : 'descending';
  }

  onHeaderClick(col: UiDataGridColumnComponent): void {
    if (!col.sortable) return;
    const field = col.field || col.key;
    if (this.sortField() === field) {
      this.sortDir.update((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      this.sortField.set(field);
      this.sortDir.set('asc');
    }
    this.currentPage.set(1);
    if (this.serverSide) {
      this.sortChange.emit({ field, direction: this.sortDir() });
    }
  }

  // Pagination
  goToPage(page: number): void {
    const target = Math.max(1, Math.min(page, this.totalPages()));
    if (target === this.currentPage()) return;
    this.currentPage.set(target);
    if (this.serverSide) {
      this.pageChange.emit({ page: target, pageSize: this._pageSize() });
    }
  }

  onPageSizeChange(event: Event): void {
    const size = Number((event.target as HTMLSelectElement).value);
    if (!size || size <= 0) return;
    this._pageSize.set(size);
    this.currentPage.set(1);
    if (this.serverSide) {
      this.pageChange.emit({ page: 1, pageSize: size });
    }
  }

  // Helpers
  getValue(row: any, path: string): any {
    if (!row || !path) return null;
    return path.split('.').reduce<any>((obj, key) => (obj == null ? null : obj[key]), row);
  }

  trackBy = (row: any, index: number): any => {
    const v = this.getValue(row, this.trackByKey);
    return v ?? index;
  };
}
