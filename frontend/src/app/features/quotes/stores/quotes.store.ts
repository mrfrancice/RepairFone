import { Injectable, signal, computed } from '@angular/core';
import { Quote, QuoteStatus } from '../services/quotes.service';

@Injectable({ providedIn: 'root' })
export class QuotesStore {
  // State
  private readonly _quotes = signal<Quote[]>([]);
  private readonly _selectedQuote = signal<Quote | null>(null);
  private readonly _totalQuotes = signal(0);
  private readonly _currentPage = signal(1);
  private readonly _filterStatus = signal<QuoteStatus | null>(null);

  // Public selectors
  readonly quotes = this._quotes.asReadonly();
  readonly selectedQuote = this._selectedQuote.asReadonly();
  readonly totalQuotes = this._totalQuotes.asReadonly();
  readonly currentPage = this._currentPage.asReadonly();
  readonly filterStatus = this._filterStatus.asReadonly();

  // Computed
  readonly hasQuotes = computed(() => this._quotes().length > 0);

  readonly pendingQuotes = computed(() =>
    this._quotes().filter(q => q.status === 'pending')
  );

  readonly acceptedQuotes = computed(() =>
    this._quotes().filter(q => q.status === 'accepted')
  );

  readonly pendingCount = computed(() =>
    this._quotes().filter(q => q.status === 'pending').length
  );

  readonly filteredQuotes = computed(() => {
    const status = this._filterStatus();
    if (!status) return this._quotes();
    return this._quotes().filter(q => q.status === status);
  });

  // Actions
  setQuotes(quotes: Quote[], total: number): void {
    this._quotes.set(quotes);
    this._totalQuotes.set(total);
  }

  appendQuotes(quotes: Quote[]): void {
    this._quotes.update(current => [...current, ...quotes]);
  }

  setSelectedQuote(quote: Quote | null): void {
    this._selectedQuote.set(quote);
  }

  updateQuote(id: string, updates: Partial<Quote>): void {
    this._quotes.update(quotes =>
      quotes.map(q => q.id === id ? { ...q, ...updates } : q)
    );

    // Update selected quote if it matches
    const selected = this._selectedQuote();
    if (selected?.id === id) {
      this._selectedQuote.set({ ...selected, ...updates });
    }
  }

  removeQuote(id: string): void {
    this._quotes.update(quotes => quotes.filter(q => q.id !== id));

    if (this._selectedQuote()?.id === id) {
      this._selectedQuote.set(null);
    }
  }

  setPage(page: number): void {
    this._currentPage.set(page);
  }

  setFilterStatus(status: QuoteStatus | null): void {
    this._filterStatus.set(status);
  }

  reset(): void {
    this._quotes.set([]);
    this._selectedQuote.set(null);
    this._totalQuotes.set(0);
    this._currentPage.set(1);
    this._filterStatus.set(null);
  }
}
