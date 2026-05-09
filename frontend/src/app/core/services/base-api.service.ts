import { inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ApiService } from './api.service';

/**
 * Response type for paginated lists
 */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page?: number;
  limit?: number;
}

/**
 * Common query parameters for list endpoints
 */
export interface ListParams {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Abstract base class for API services with common functionality
 *
 * Usage:
 * ```typescript
 * @Injectable({ providedIn: 'root' })
 * export class MyEntityService extends BaseApiService<MyEntity> {
 *   protected readonly endpoint = '/my-entities';
 * }
 * ```
 */
export abstract class BaseApiService<T extends { id: string }> {
  protected readonly api = inject(ApiService);

  /** Loading state signal */
  readonly isLoading = signal(false);

  /** Error message signal */
  readonly error = signal<string | null>(null);

  /** The base endpoint for this service (e.g., '/requests') */
  protected abstract readonly endpoint: string;

  // ---------------------------------------------------------------------------
  // CRUD Operations
  // ---------------------------------------------------------------------------

  /**
   * Get all items with optional filtering and pagination
   */
  async getAll(params?: ListParams): Promise<PaginatedResponse<T>> {
    return this.withLoading(() =>
      firstValueFrom(this.api.get<PaginatedResponse<T>>(this.endpoint, params))
    );
  }

  /**
   * Get items for current user (commonly /endpoint/my)
   */
  async getMy(params?: ListParams): Promise<PaginatedResponse<T>> {
    return this.withLoading(() =>
      firstValueFrom(this.api.get<PaginatedResponse<T>>(`${this.endpoint}/my`, params))
    );
  }

  /**
   * Get a single item by ID
   */
  async getById(id: string): Promise<T> {
    return this.withLoading(() =>
      firstValueFrom(this.api.get<T>(`${this.endpoint}/${id}`))
    );
  }

  /**
   * Create a new item
   */
  async create<D>(dto: D): Promise<T> {
    return this.withLoading(() =>
      firstValueFrom(this.api.post<T>(this.endpoint, dto))
    );
  }

  /**
   * Update an existing item
   */
  async update<D>(id: string, dto: D): Promise<T> {
    return this.withLoading(() =>
      firstValueFrom(this.api.put<T>(`${this.endpoint}/${id}`, dto))
    );
  }

  /**
   * Partially update an item
   */
  async patch<D>(id: string, dto: D): Promise<T> {
    return this.withLoading(() =>
      firstValueFrom(this.api.patch<T>(`${this.endpoint}/${id}`, dto))
    );
  }

  /**
   * Delete an item
   */
  async delete(id: string): Promise<void> {
    return this.withLoading(() =>
      firstValueFrom(this.api.delete<void>(`${this.endpoint}/${id}`))
    );
  }

  // ---------------------------------------------------------------------------
  // Helper Methods
  // ---------------------------------------------------------------------------

  /**
   * Execute an async operation with loading state management
   */
  protected async withLoading<R>(operation: () => Promise<R>): Promise<R> {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      return await operation();
    } catch (err: any) {
      const errorMessage = err.error?.message || err.message || 'Une erreur est survenue';
      this.error.set(errorMessage);
      throw err;
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Execute an async operation without loading state (for background operations)
   */
  protected async withErrorHandling<R>(operation: () => Promise<R>): Promise<R> {
    this.error.set(null);

    try {
      return await operation();
    } catch (err: any) {
      const errorMessage = err.error?.message || err.message || 'Une erreur est survenue';
      this.error.set(errorMessage);
      throw err;
    }
  }

  /**
   * Clear error state
   */
  clearError(): void {
    this.error.set(null);
  }

  /**
   * Get item by ID or return null if not found
   */
  async getByIdOrNull(id: string): Promise<T | null> {
    try {
      return await this.getById(id);
    } catch {
      return null;
    }
  }

  /**
   * Custom POST action on an item (e.g., /endpoint/:id/action)
   */
  protected async postAction<R, D = object>(id: string, action: string, dto?: D): Promise<R> {
    return this.withLoading(() =>
      firstValueFrom(this.api.post<R>(`${this.endpoint}/${id}/${action}`, dto || {}))
    );
  }

  /**
   * Custom GET action on an item (e.g., /endpoint/:id/action)
   */
  protected async getAction<R>(id: string, action: string, params?: Record<string, any>): Promise<R> {
    return this.withLoading(() =>
      firstValueFrom(this.api.get<R>(`${this.endpoint}/${id}/${action}`, params))
    );
  }
}
