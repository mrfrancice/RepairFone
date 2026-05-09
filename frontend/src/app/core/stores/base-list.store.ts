import { signal, computed, Signal, WritableSignal } from '@angular/core';

/**
 * Generic base store for list management with filtering and pagination
 * Usage:
 * ```typescript
 * @Injectable({ providedIn: 'root' })
 * export class MyItemsStore extends BaseListStore<MyItem, MyItemStatus> {
 *   constructor() {
 *     super();
 *   }
 * }
 * ```
 */
export abstract class BaseListStore<T extends { id: string }, TStatus extends string = string> {
  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------

  /** All items in the store */
  readonly items: WritableSignal<T[]> = signal<T[]>([]);

  /** Total count from API (for pagination) */
  readonly total: WritableSignal<number> = signal(0);

  /** Current filter status */
  readonly filterStatus: WritableSignal<TStatus | null> = signal<TStatus | null>(null);

  /** Loading state */
  readonly isLoading: WritableSignal<boolean> = signal(false);

  /** Loading more state (for infinite scroll) */
  readonly isLoadingMore: WritableSignal<boolean> = signal(false);

  /** Error message */
  readonly error: WritableSignal<string | null> = signal(null);

  /** Current page for pagination */
  readonly currentPage: WritableSignal<number> = signal(1);

  /** Items per page */
  readonly pageSize: WritableSignal<number> = signal(10);

  // ---------------------------------------------------------------------------
  // Computed
  // ---------------------------------------------------------------------------

  /** Filtered items based on status filter */
  readonly filteredItems: Signal<T[]> = computed(() => {
    const status = this.filterStatus();
    if (!status) {
      return this.items();
    }
    return this.items().filter((item) => this.getItemStatus(item) === status);
  });

  /** Count of filtered items */
  readonly filteredCount: Signal<number> = computed(() => this.filteredItems().length);

  /** Check if there are more items to load */
  readonly hasMore: Signal<boolean> = computed(() => {
    return this.items().length < this.total();
  });

  /** Check if list is empty */
  readonly isEmpty: Signal<boolean> = computed(() => {
    return !this.isLoading() && this.items().length === 0;
  });

  // ---------------------------------------------------------------------------
  // Abstract Methods (must be implemented)
  // ---------------------------------------------------------------------------

  /**
   * Get the status of an item for filtering
   * Must be implemented by subclass
   */
  protected abstract getItemStatus(item: T): TStatus;

  // ---------------------------------------------------------------------------
  // Actions
  // ---------------------------------------------------------------------------

  /**
   * Set items (replaces existing items)
   */
  setItems(items: T[], total?: number): void {
    this.items.set(items);
    if (total !== undefined) {
      this.total.set(total);
    }
    this.currentPage.set(1);
    this.error.set(null);
  }

  /**
   * Append items (for infinite scroll / load more)
   */
  appendItems(items: T[]): void {
    this.items.update((current) => [...current, ...items]);
  }

  /**
   * Add a single item at the beginning
   */
  addItem(item: T): void {
    this.items.update((current) => [item, ...current]);
    this.total.update((t) => t + 1);
  }

  /**
   * Update an existing item
   */
  updateItem(id: string, updates: Partial<T>): void {
    this.items.update((current) =>
      current.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
  }

  /**
   * Remove an item by id
   */
  removeItem(id: string): void {
    this.items.update((current) => current.filter((item) => item.id !== id));
    this.total.update((t) => Math.max(0, t - 1));
  }

  /**
   * Find an item by id
   */
  findItem(id: string): T | undefined {
    return this.items().find((item) => item.id === id);
  }

  /**
   * Set filter status
   */
  setFilter(status: TStatus | null): void {
    this.filterStatus.set(status);
  }

  /**
   * Clear filter
   */
  clearFilter(): void {
    this.filterStatus.set(null);
  }

  /**
   * Set loading state
   */
  setLoading(loading: boolean): void {
    this.isLoading.set(loading);
  }

  /**
   * Set loading more state
   */
  setLoadingMore(loading: boolean): void {
    this.isLoadingMore.set(loading);
  }

  /**
   * Set error
   */
  setError(error: string | null): void {
    this.error.set(error);
  }

  /**
   * Increment page
   */
  nextPage(): void {
    this.currentPage.update((p) => p + 1);
  }

  /**
   * Reset pagination
   */
  resetPagination(): void {
    this.currentPage.set(1);
  }

  /**
   * Reset store to initial state
   */
  reset(): void {
    this.items.set([]);
    this.total.set(0);
    this.filterStatus.set(null);
    this.isLoading.set(false);
    this.isLoadingMore.set(false);
    this.error.set(null);
    this.currentPage.set(1);
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  /**
   * Get stats by status
   */
  getStatsByStatus(): Record<string, number> {
    const stats: Record<string, number> = {};
    this.items().forEach((item) => {
      const status = this.getItemStatus(item);
      stats[status] = (stats[status] || 0) + 1;
    });
    return stats;
  }
}
