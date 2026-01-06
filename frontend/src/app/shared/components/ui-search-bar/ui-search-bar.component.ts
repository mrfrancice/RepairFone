import {
  Component,
  Input,
  Output,
  EventEmitter,
  signal,
  OnInit,
  forwardRef,
  ChangeDetectionStrategy,
  inject,
  DestroyRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

export interface SearchSuggestion {
  id: string;
  text: string;
  icon?: string;
  category?: string;
}

@Component({
  selector: 'ui-search-bar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => UiSearchBarComponent),
      multi: true,
    },
  ],
  template: `
    <div
      class="search-container"
      [class.focused]="isFocused()"
      [class.has-value]="searchValue"
      [class.disabled]="disabled"
      [class.size-sm]="size === 'sm'"
      [class.size-lg]="size === 'lg'"
    >
      <div class="search-input-wrapper">
        <!-- Search Icon -->
        <span class="search-icon">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M17.5 17.5L13.875 13.875M15.833 9.167A6.667 6.667 0 112.5 9.167a6.667 6.667 0 0113.333 0z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </span>

        <!-- Input -->
        <input
          type="text"
          class="search-input"
          [placeholder]="placeholder"
          [(ngModel)]="searchValue"
          [disabled]="disabled"
          (input)="onInput()"
          (focus)="onFocus()"
          (blur)="onBlur()"
          (keydown.enter)="onSubmit()"
          (keydown.escape)="onClear()"
          autocomplete="off"
          #searchInput
        />

        <!-- Loading Spinner -->
        @if (loading) {
          <span class="search-loading">
            <svg class="spinner" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" fill="none" stroke-dasharray="32" stroke-linecap="round"/>
            </svg>
          </span>
        }

        <!-- Clear Button -->
        @if (searchValue && !loading && clearable) {
          <button
            type="button"
            class="clear-btn"
            (click)="onClear()"
            aria-label="Effacer"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M12 4L4 12M4 4L12 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
          </button>
        }

        <!-- Action Button -->
        @if (showActionButton) {
          <button
            type="button"
            class="action-btn"
            (click)="onActionClick()"
            [disabled]="disabled"
          >
            @if (actionIcon) {
              <span>{{ actionIcon }}</span>
            } @else {
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M17.5 17.5L13.875 13.875" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
            }
          </button>
        }
      </div>

      <!-- Recent Searches / Suggestions Dropdown -->
      @if (showDropdown() && (suggestions.length > 0 || recentSearches.length > 0)) {
        <div class="search-dropdown">
          @if (recentSearches.length > 0 && !searchValue) {
            <div class="dropdown-section">
              <div class="section-header">
                <span class="section-title">Recherches récentes</span>
                <button class="clear-history" (click)="clearRecentSearches()">Effacer</button>
              </div>
              @for (item of recentSearches; track item) {
                <div class="suggestion-item" (click)="selectSuggestion(item, true)">
                  <span class="suggestion-icon">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M8 3v5l3 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                      <circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="1.5"/>
                    </svg>
                  </span>
                  <span class="suggestion-text">{{ item }}</span>
                </div>
              }
            </div>
          }

          @if (suggestions.length > 0) {
            <div class="dropdown-section">
              @if (suggestionsTitle) {
                <div class="section-header">
                  <span class="section-title">{{ suggestionsTitle }}</span>
                </div>
              }
              @for (suggestion of suggestions; track suggestion.id) {
                <div class="suggestion-item" (click)="selectSuggestion(suggestion.text)">
                  @if (suggestion.icon) {
                    <span class="suggestion-icon">{{ suggestion.icon }}</span>
                  }
                  <div class="suggestion-content">
                    <span class="suggestion-text">{{ suggestion.text }}</span>
                    @if (suggestion.category) {
                      <span class="suggestion-category">{{ suggestion.category }}</span>
                    }
                  </div>
                </div>
              }
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .search-container {
      position: relative;
      width: 100%;
    }

    .search-input-wrapper {
      display: flex;
      align-items: center;
      background: white;
      border: 1px solid #d1d5db;
      border-radius: 12px;
      padding: 0 1rem;
      gap: 0.75rem;
      transition: all 0.2s ease;
    }

    .search-container.focused .search-input-wrapper {
      border-color: #2563eb;
      box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
    }

    .search-container.disabled .search-input-wrapper {
      background: #f3f4f6;
      opacity: 0.7;
    }

    /* Size variants */
    .search-input-wrapper {
      min-height: 48px;
    }

    .size-sm .search-input-wrapper {
      min-height: 40px;
      padding: 0 0.75rem;
      border-radius: 8px;
    }

    .size-lg .search-input-wrapper {
      min-height: 56px;
      padding: 0 1.25rem;
      border-radius: 16px;
    }

    /* Search Icon */
    .search-icon {
      color: #9ca3af;
      display: flex;
      flex-shrink: 0;
    }

    .search-container.focused .search-icon,
    .search-container.has-value .search-icon {
      color: #2563eb;
    }

    /* Input */
    .search-input {
      flex: 1;
      border: none;
      background: transparent;
      font-size: 1rem;
      color: #1f2937;
      outline: none;
      min-width: 0;
    }

    .size-sm .search-input {
      font-size: 0.875rem;
    }

    .size-lg .search-input {
      font-size: 1.125rem;
    }

    .search-input::placeholder {
      color: #9ca3af;
    }

    .search-input:disabled {
      cursor: not-allowed;
    }

    /* Loading */
    .search-loading {
      color: #2563eb;
      display: flex;
    }

    .spinner {
      width: 20px;
      height: 20px;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }

    /* Clear Button */
    .clear-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 24px;
      height: 24px;
      border: none;
      background: #f3f4f6;
      border-radius: 50%;
      color: #6b7280;
      cursor: pointer;
      transition: all 0.2s;
      flex-shrink: 0;
    }

    .clear-btn:hover {
      background: #e5e7eb;
      color: #374151;
    }

    /* Action Button */
    .action-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 36px;
      height: 36px;
      border: none;
      background: #2563eb;
      border-radius: 8px;
      color: white;
      cursor: pointer;
      transition: all 0.2s;
      flex-shrink: 0;
      margin: -0.25rem -0.5rem -0.25rem 0;
    }

    .action-btn:hover:not(:disabled) {
      background: #1d4ed8;
    }

    .action-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    /* Dropdown */
    .search-dropdown {
      position: absolute;
      top: calc(100% + 4px);
      left: 0;
      right: 0;
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      z-index: 50;
      max-height: 320px;
      overflow-y: auto;
    }

    .dropdown-section {
      padding: 0.5rem 0;
    }

    .dropdown-section + .dropdown-section {
      border-top: 1px solid #e5e7eb;
    }

    .section-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.5rem 1rem;
    }

    .section-title {
      font-size: 0.75rem;
      font-weight: 600;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .clear-history {
      font-size: 0.75rem;
      color: #2563eb;
      background: none;
      border: none;
      cursor: pointer;
    }

    .clear-history:hover {
      text-decoration: underline;
    }

    .suggestion-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem 1rem;
      cursor: pointer;
      transition: background 0.15s;
    }

    .suggestion-item:hover {
      background: #f3f4f6;
    }

    .suggestion-icon {
      color: #6b7280;
      font-size: 1rem;
      display: flex;
      flex-shrink: 0;
    }

    .suggestion-content {
      display: flex;
      flex-direction: column;
      flex: 1;
      min-width: 0;
    }

    .suggestion-text {
      color: #1f2937;
      font-size: 0.9375rem;
    }

    .suggestion-category {
      color: #9ca3af;
      font-size: 0.75rem;
      margin-top: 0.125rem;
    }
  `],
})
export class UiSearchBarComponent implements OnInit, ControlValueAccessor {
  @Input() placeholder = 'Rechercher...';
  @Input() size: 'sm' | 'md' | 'lg' = 'md';
  @Input() disabled = false;
  @Input() loading = false;
  @Input() clearable = true;
  @Input() showActionButton = false;
  @Input() actionIcon?: string;
  @Input() debounceTime = 300;
  @Input() suggestions: SearchSuggestion[] = [];
  @Input() suggestionsTitle?: string;
  @Input() recentSearches: string[] = [];
  @Input() showRecentOnFocus = true;

  @Output() search = new EventEmitter<string>();
  @Output() searchChange = new EventEmitter<string>();
  @Output() actionClick = new EventEmitter<void>();
  @Output() suggestionSelect = new EventEmitter<string>();
  @Output() clearRecent = new EventEmitter<void>();

  readonly isFocused = signal(false);
  readonly showDropdown = signal(false);

  private readonly destroyRef = inject(DestroyRef);

  searchValue = '';
  private searchSubject = new Subject<string>();
  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  ngOnInit(): void {
    this.searchSubject
      .pipe(
        debounceTime(this.debounceTime),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((value) => {
        this.search.emit(value);
      });
  }

  onInput(): void {
    this.onChange(this.searchValue);
    this.searchChange.emit(this.searchValue);
    this.searchSubject.next(this.searchValue);
  }

  onFocus(): void {
    this.isFocused.set(true);
    if (this.showRecentOnFocus || this.suggestions.length > 0) {
      this.showDropdown.set(true);
    }
  }

  onBlur(): void {
    this.isFocused.set(false);
    this.onTouched();
    // Delay to allow click on suggestions
    setTimeout(() => {
      this.showDropdown.set(false);
    }, 200);
  }

  onSubmit(): void {
    this.search.emit(this.searchValue);
    this.showDropdown.set(false);
  }

  onClear(): void {
    this.searchValue = '';
    this.onChange('');
    this.searchChange.emit('');
    this.search.emit('');
  }

  onActionClick(): void {
    this.actionClick.emit();
  }

  selectSuggestion(value: string, isRecent = false): void {
    this.searchValue = value;
    this.onChange(value);
    this.searchChange.emit(value);
    this.suggestionSelect.emit(value);
    this.showDropdown.set(false);
  }

  clearRecentSearches(): void {
    this.clearRecent.emit();
  }

  // ControlValueAccessor
  writeValue(value: string): void {
    this.searchValue = value || '';
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }
}
