import {
  Component,
  Input,
  Output,
  EventEmitter,
  signal,
  computed,
  forwardRef,
  ElementRef,
  HostListener,
  inject,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

export interface SelectOption {
  value: string | number;
  label: string;
  icon?: string;
  image?: string;
  description?: string;
  disabled?: boolean;
  group?: string;
}

export interface SelectGroup {
  label: string;
  options: SelectOption[];
}

@Component({
  selector: 'ui-select',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => UiSelectComponent),
      multi: true,
    },
  ],
  template: `
    <div class="select-container" [class.disabled]="disabled" [class.error]="error">
      @if (label) {
        <label class="select-label">
          {{ label }}
          @if (required) {
            <span class="required">*</span>
          }
        </label>
      }

      <div
        class="select-trigger"
        [class.open]="isOpen()"
        [class.has-value]="hasValue()"
        (click)="toggle()"
        role="combobox"
        [attr.aria-expanded]="isOpen()"
        [attr.aria-haspopup]="'listbox'"
        tabindex="0"
        (keydown)="onKeyDown($event)"
      >
        <div class="select-value">
          @if (hasValue()) {
            @if (selectedOption()?.icon) {
              <span class="option-icon">{{ selectedOption()?.icon }}</span>
            }
            @if (selectedOption()?.image) {
              <img [src]="selectedOption()?.image" [alt]="selectedOption()?.label" class="option-image" />
            }
            <span class="value-text">{{ selectedOption()?.label }}</span>
          } @else {
            <span class="placeholder">{{ placeholder }}</span>
          }
        </div>
        <span class="select-arrow" [class.rotated]="isOpen()">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </span>
      </div>

      @if (isOpen()) {
        <div class="select-dropdown" role="listbox">
          @if (searchable) {
            <div class="search-container">
              <input
                type="text"
                class="search-input"
                [placeholder]="searchPlaceholder"
                [(ngModel)]="searchQuery"
                (input)="onSearch()"
                (click)="$event.stopPropagation()"
                #searchInput
              />
              @if (searchQuery) {
                <button class="clear-search" (click)="clearSearch($event)">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M10.5 3.5L3.5 10.5M3.5 3.5L10.5 10.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                  </svg>
                </button>
              }
            </div>
          }

          <div class="options-container">
            @if (filteredOptions().length === 0) {
              <div class="no-results">
                {{ noResultsText }}
              </div>
            } @else {
              @if (groupedOptions().length > 0) {
                @for (group of groupedOptions(); track group.label) {
                  <div class="option-group">
                    <div class="group-label">{{ group.label }}</div>
                    @for (option of group.options; track option.value) {
                      <div
                        class="select-option"
                        [class.selected]="isSelected(option)"
                        [class.disabled]="option.disabled"
                        (click)="selectOption(option, $event)"
                        role="option"
                        [attr.aria-selected]="isSelected(option)"
                      >
                        @if (option.icon) {
                          <span class="option-icon">{{ option.icon }}</span>
                        }
                        @if (option.image) {
                          <img [src]="option.image" [alt]="option.label" class="option-image" />
                        }
                        <div class="option-content">
                          <span class="option-label">{{ option.label }}</span>
                          @if (option.description) {
                            <span class="option-description">{{ option.description }}</span>
                          }
                        </div>
                        @if (isSelected(option)) {
                          <span class="check-icon">
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                              <path d="M11.5 4L5.5 10L2.5 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                          </span>
                        }
                      </div>
                    }
                  </div>
                }
              } @else {
                @for (option of filteredOptions(); track option.value) {
                  <div
                    class="select-option"
                    [class.selected]="isSelected(option)"
                    [class.disabled]="option.disabled"
                    (click)="selectOption(option, $event)"
                    role="option"
                    [attr.aria-selected]="isSelected(option)"
                  >
                    @if (option.icon) {
                      <span class="option-icon">{{ option.icon }}</span>
                    }
                    @if (option.image) {
                      <img [src]="option.image" [alt]="option.label" class="option-image" />
                    }
                    <div class="option-content">
                      <span class="option-label">{{ option.label }}</span>
                      @if (option.description) {
                        <span class="option-description">{{ option.description }}</span>
                      }
                    </div>
                    @if (isSelected(option)) {
                      <span class="check-icon">
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                          <path d="M11.5 4L5.5 10L2.5 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                      </span>
                    }
                  </div>
                }
              }
            }
          </div>
        </div>
      }

      @if (error) {
        <span class="error-message">{{ error }}</span>
      }
      @if (hint && !error) {
        <span class="hint-message">{{ hint }}</span>
      }
    </div>
  `,
  styles: [`
    .select-container {
      position: relative;
      width: 100%;
    }

    .select-label {
      display: block;
      font-size: 0.875rem;
      font-weight: 500;
      color: #374151;
      margin-bottom: 0.5rem;
    }

    .required {
      color: #dc2626;
      margin-left: 0.25rem;
    }

    .select-trigger {
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
      min-height: 44px;
      padding: 0.75rem 1rem;
      background: white;
      border: 1px solid #d1d5db;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .select-trigger:hover:not(.disabled) {
      border-color: #9ca3af;
    }

    .select-trigger:focus {
      outline: none;
      border-color: #2563eb;
      box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
    }

    .select-trigger.open {
      border-color: #2563eb;
      box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
    }

    .select-container.disabled .select-trigger {
      background: #f3f4f6;
      cursor: not-allowed;
      opacity: 0.7;
    }

    .select-container.error .select-trigger {
      border-color: #dc2626;
    }

    .select-container.error .select-trigger:focus {
      box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
    }

    .select-value {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      flex: 1;
      min-width: 0;
    }

    .value-text {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      color: #1f2937;
    }

    .placeholder {
      color: #9ca3af;
    }

    .select-arrow {
      display: flex;
      align-items: center;
      color: #6b7280;
      transition: transform 0.2s ease;
      flex-shrink: 0;
    }

    .select-arrow.rotated {
      transform: rotate(180deg);
    }

    .select-dropdown {
      position: absolute;
      top: calc(100% + 4px);
      left: 0;
      right: 0;
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      z-index: 50;
      max-height: 280px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    .search-container {
      position: relative;
      padding: 0.75rem;
      border-bottom: 1px solid #e5e7eb;
    }

    .search-input {
      width: 100%;
      padding: 0.5rem 2.5rem 0.5rem 0.75rem;
      min-height: 44px;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      font-size: 0.875rem;
      outline: none;
      transition: border-color 0.2s;
    }

    .search-input:focus {
      border-color: #2563eb;
    }

    .search-input::placeholder {
      color: #9ca3af;
    }

    .clear-search {
      position: absolute;
      right: 0.5rem;
      top: 50%;
      transform: translateY(-50%);
      background: none;
      border: none;
      padding: 0.5rem;
      cursor: pointer;
      color: #6b7280;
      display: flex;
      align-items: center;
      justify-content: center;
      min-width: 44px;
      min-height: 44px;
      border-radius: var(--border-radius-sm, 4px);
      transition: background 0.15s ease;
    }

    .clear-search:hover {
      color: #374151;
      background: var(--color-neutral-100, #f3f4f6);
    }

    .clear-search:focus-visible {
      outline: 2px solid var(--color-primary, #FF9800);
      outline-offset: 2px;
    }

    .options-container {
      overflow-y: auto;
      flex: 1;
    }

    .no-results {
      padding: 1rem;
      text-align: center;
      color: #6b7280;
      font-size: 0.875rem;
    }

    .option-group {
      padding-bottom: 0.5rem;
    }

    .group-label {
      padding: 0.5rem 1rem;
      font-size: 0.75rem;
      font-weight: 600;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      background: #f9fafb;
    }

    .select-option {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem 1rem;
      min-height: 44px;
      cursor: pointer;
      transition: background-color 0.15s;
    }

    .select-option:hover:not(.disabled) {
      background: #f3f4f6;
    }

    .select-option.selected {
      background: #eff6ff;
    }

    .select-option.disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .option-icon {
      font-size: 1.25rem;
      flex-shrink: 0;
    }

    .option-image {
      width: 24px;
      height: 24px;
      border-radius: 4px;
      object-fit: cover;
      flex-shrink: 0;
    }

    .option-content {
      display: flex;
      flex-direction: column;
      flex: 1;
      min-width: 0;
    }

    .option-label {
      color: #1f2937;
      font-size: 0.9375rem;
    }

    .option-description {
      color: #6b7280;
      font-size: 0.75rem;
      margin-top: 0.125rem;
    }

    .check-icon {
      color: #2563eb;
      flex-shrink: 0;
    }

    .error-message {
      display: block;
      margin-top: 0.375rem;
      font-size: 0.75rem;
      color: #dc2626;
    }

    .hint-message {
      display: block;
      margin-top: 0.375rem;
      font-size: 0.75rem;
      color: #6b7280;
    }
  `],
})
export class UiSelectComponent implements ControlValueAccessor {
  private readonly elementRef = inject(ElementRef);

  @Input() options: SelectOption[] = [];
  @Input() label?: string;
  @Input() placeholder = 'Sélectionnez...';
  @Input() searchable = false;
  @Input() searchPlaceholder = 'Rechercher...';
  @Input() noResultsText = 'Aucun résultat';
  @Input() disabled = false;
  @Input() required = false;
  @Input() error?: string;
  @Input() hint?: string;

  @Output() selectionChange = new EventEmitter<SelectOption | null>();

  readonly isOpen = signal(false);
  searchQuery = '';

  private _value: string | number | null = null;
  private onChange: (value: string | number | null) => void = () => {};
  private onTouched: () => void = () => {};

  readonly selectedOption = computed(() => {
    if (this._value === null || this._value === undefined) return null;
    return this.options.find((opt) => opt.value === this._value) || null;
  });

  readonly hasValue = computed(() => this._value !== null && this._value !== undefined);

  readonly filteredOptions = computed(() => {
    if (!this.searchQuery.trim()) return this.options;
    const query = this.searchQuery.toLowerCase();
    return this.options.filter(
      (opt) =>
        opt.label.toLowerCase().includes(query) ||
        opt.description?.toLowerCase().includes(query)
    );
  });

  readonly groupedOptions = computed(() => {
    const filtered = this.filteredOptions();
    const groups = new Map<string, SelectOption[]>();

    filtered.forEach((opt) => {
      if (opt.group) {
        if (!groups.has(opt.group)) {
          groups.set(opt.group, []);
        }
        groups.get(opt.group)!.push(opt);
      }
    });

    if (groups.size === 0) return [];

    return Array.from(groups.entries()).map(([label, options]) => ({
      label,
      options,
    }));
  });

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.close();
    }
  }

  toggle(): void {
    if (this.disabled) return;
    this.isOpen.update((v) => !v);
    if (!this.isOpen()) {
      this.onTouched();
    }
  }

  close(): void {
    this.isOpen.set(false);
    this.searchQuery = '';
    this.onTouched();
  }

  selectOption(option: SelectOption, event: MouseEvent): void {
    event.stopPropagation();
    if (option.disabled) return;

    this._value = option.value;
    this.onChange(this._value);
    this.selectionChange.emit(option);
    this.close();
  }

  isSelected(option: SelectOption): boolean {
    return this._value === option.value;
  }

  onSearch(): void {
    // Filtering is handled by computed signal
  }

  clearSearch(event: MouseEvent): void {
    event.stopPropagation();
    this.searchQuery = '';
  }

  onKeyDown(event: KeyboardEvent): void {
    switch (event.key) {
      case 'Enter':
      case ' ':
        event.preventDefault();
        this.toggle();
        break;
      case 'Escape':
        this.close();
        break;
      case 'ArrowDown':
        event.preventDefault();
        if (!this.isOpen()) {
          this.isOpen.set(true);
        }
        break;
    }
  }

  // ControlValueAccessor
  writeValue(value: string | number | null): void {
    this._value = value;
  }

  registerOnChange(fn: (value: string | number | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }
}
