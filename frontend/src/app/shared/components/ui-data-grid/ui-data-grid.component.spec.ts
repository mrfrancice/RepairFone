import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { UiDataGridComponent } from './ui-data-grid.component';
import { UiDataGridColumnComponent } from './ui-data-grid-column.component';

interface TestRow {
  id: string;
  name: string;
  amount: number;
}

@Component({
  standalone: true,
  imports: [UiDataGridComponent, UiDataGridColumnComponent],
  template: `
    <ui-data-grid [data]="data" [pageSize]="2">
      <ui-data-grid-column key="name" header="Nom" field="name" [sortable]="true" />
      <ui-data-grid-column key="amount" header="Montant" field="amount" [sortable]="true" />
    </ui-data-grid>
  `,
})
class TestHostComponent {
  data: TestRow[] = [
    { id: '1', name: 'Charlie', amount: 300 },
    { id: '2', name: 'Alice', amount: 100 },
    { id: '3', name: 'Bob', amount: 200 },
  ];
}

/**
 * Squelette de tests UiDataGridComponent.
 *
 * Couvre les comportements critiques (pagination, tri, contenu).
 * À étoffer avec :
 *   - Mode serverSide + outputs (pageChange, sortChange)
 *   - Lignes cliquables (rowClick)
 *   - Templates custom
 *   - Empty state et loading state
 */
describe('UiDataGridComponent', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let host: TestHostComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders the grid with data', () => {
    const rows = fixture.nativeElement.querySelectorAll('tbody tr');
    // pageSize = 2 → seulement 2 lignes affichées
    expect(rows.length).toBe(2);
  });

  it('displays column headers', () => {
    const headers = fixture.nativeElement.querySelectorAll('thead th');
    expect(headers.length).toBe(2);
    expect(headers[0].textContent).toContain('Nom');
    expect(headers[1].textContent).toContain('Montant');
  });

  it('sorts ascending by name on first header click', () => {
    const nameHeader = fixture.nativeElement.querySelector('thead th.sortable');
    nameHeader.click();
    fixture.detectChanges();

    const firstCell = fixture.nativeElement.querySelector('tbody tr:first-child td');
    expect(firstCell.textContent.trim()).toBe('Alice');
  });

  it('shows empty message when data is empty', () => {
    host.data = [];
    fixture.detectChanges();

    const stateCell = fixture.nativeElement.querySelector('.state-cell.empty');
    expect(stateCell).toBeTruthy();
  });
});
