import {
  Component,
  Input,
  Output,
  EventEmitter,
  forwardRef,
  signal,
  computed,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

export interface RadioOption {
  value: string | number;
  label: string;
  description?: string;
  icon?: string;
  disabled?: boolean;
}

export type RadioLayout = 'vertical' | 'horizontal' | 'cards' | 'cards-horizontal';
export type RadioSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'ui-radio-group',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => UiRadioGroupComponent),
      multi: true,
    },
  ],
  template: `
    <div class="radio-group-container" [class.disabled]="disabled" [class.error]="error">
      @if (label) {
        <label class="group-label">
          {{ label }}
          @if (required) {
            <span class="required">*</span>
          }
        </label>
      }

      <div
        class="radio-options"
        [class.vertical]="layout === 'vertical'"
        [class.horizontal]="layout === 'horizontal'"
        [class.cards]="layout === 'cards'"
        [class.cards-horizontal]="layout === 'cards-horizontal'"
        [class.size-sm]="size === 'sm'"
        [class.size-md]="size === 'md'"
        [class.size-lg]="size === 'lg'"
        role="radiogroup"
        [attr.aria-label]="label"
      >
        @for (option of options; track option.value) {
          <label
            class="radio-option"
            [class.selected]="isSelected(option)"
            [class.disabled]="option.disabled || disabled"
            (click)="selectOption(option)"
            (keydown.enter)="selectOption(option)"
            (keydown.space)="selectOption(option); $event.preventDefault()"
            tabindex="0"
            role="radio"
            [attr.aria-checked]="isSelected(option)"
          >
            @if (layout === 'cards' || layout === 'cards-horizontal') {
              <!-- Card layout -->
              <div class="card-content">
                @if (option.icon) {
                  <span class="option-icon">{{ option.icon }}</span>
                }
                <div class="option-text">
                  <span class="option-label">{{ option.label }}</span>
                  @if (option.description) {
                    <span class="option-description">{{ option.description }}</span>
                  }
                </div>
                <span class="radio-indicator" [class.checked]="isSelected(option)">
                  @if (isSelected(option)) {
                    <span class="radio-dot"></span>
                  }
                </span>
              </div>
            } @else {
              <!-- Standard layout -->
              <span class="radio-indicator" [class.checked]="isSelected(option)">
                @if (isSelected(option)) {
                  <span class="radio-dot"></span>
                }
              </span>
              @if (option.icon) {
                <span class="option-icon">{{ option.icon }}</span>
              }
              <div class="option-text">
                <span class="option-label">{{ option.label }}</span>
                @if (option.description) {
                  <span class="option-description">{{ option.description }}</span>
                }
              </div>
            }
          </label>
        }
      </div>

      @if (error) {
        <span class="error-message">{{ error }}</span>
      }
      @if (hint && !error) {
        <span class="hint-message">{{ hint }}</span>
      }
    </div>
  `,
  styles: [`
    .radio-group-container {
      width: 100%;
    }

    .group-label {
      display: block;
      font-size: 0.875rem;
      font-weight: 500;
      color: #374151;
      margin-bottom: 0.75rem;
    }

    .required {
      color: var(--color-terracotta, #C62828);
      margin-left: 0.25rem;
    }

    .radio-options {
      display: flex;
      gap: 0.75rem;
    }

    .radio-options.vertical {
      flex-direction: column;
    }

    .radio-options.horizontal {
      flex-direction: row;
      flex-wrap: wrap;
    }

    .radio-options.cards {
      flex-direction: column;
    }

    .radio-options.cards-horizontal {
      flex-direction: row;
      flex-wrap: wrap;
    }

    .radio-options.cards-horizontal .radio-option,
    .radio-options.cards .radio-option {
      flex: 1;
      min-width: 140px;
    }

    /* Radio Option Base */
    .radio-option {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      cursor: pointer;
      transition: all 0.2s ease;
      user-select: none;
      min-height: 48px;
    }

    .radio-option:focus {
      outline: none;
    }

    .radio-option:focus-visible {
      outline: 2px solid var(--color-primary, #FF9800);
      outline-offset: 2px;
    }

    .radio-option.disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    /* Standard Layout - 44px minimum touch target */
    .radio-options.vertical .radio-option,
    .radio-options.horizontal .radio-option {
      padding: 0.625rem 0.5rem;
      min-height: 48px;
      border-radius: var(--border-radius-sm, 4px);
    }

    .radio-options.vertical .radio-option:focus .radio-indicator,
    .radio-options.horizontal .radio-option:focus .radio-indicator {
      box-shadow: 0 0 0 3px rgba(255, 152, 0, 0.20);
    }

    /* Card Layout */
    .radio-options.cards .radio-option,
    .radio-options.cards-horizontal .radio-option {
      padding: 1rem;
      border: 2px solid #EEEEEE;
      border-radius: 12px;
      background: white;
    }

    .radio-options.cards .radio-option:hover:not(.disabled),
    .radio-options.cards-horizontal .radio-option:hover:not(.disabled) {
      border-color: var(--color-primary-500, #FF9800);
      background: var(--color-primary-50, #FFF3E0);
    }

    .radio-options.cards .radio-option.selected,
    .radio-options.cards-horizontal .radio-option.selected {
      border-color: var(--color-primary-500, #FF9800);
      background: var(--color-primary-50, #FFF3E0);
    }

    .radio-options.cards .radio-option:focus,
    .radio-options.cards-horizontal .radio-option:focus {
      box-shadow: 0 0 0 3px rgba(255, 152, 0, 0.20);
    }

    .card-content {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      width: 100%;
    }

    /* Radio Indicator */
    .radio-indicator {
      width: 20px;
      height: 20px;
      border: 2px solid #D1D5DB;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      transition: all 0.2s ease;
    }

    .radio-indicator.checked {
      border-color: var(--color-primary-500, #FF9800);
      background: var(--color-primary-500, #FF9800);
    }

    .radio-dot {
      width: 8px;
      height: 8px;
      background: white;
      border-radius: 50%;
    }

    /* Size variants */
    .size-sm .radio-indicator {
      width: 16px;
      height: 16px;
    }

    .size-sm .radio-dot {
      width: 6px;
      height: 6px;
    }

    .size-lg .radio-indicator {
      width: 24px;
      height: 24px;
    }

    .size-lg .radio-dot {
      width: 10px;
      height: 10px;
    }

    /* Option Icon */
    .option-icon {
      font-size: 1.5rem;
      flex-shrink: 0;
    }

    .size-sm .option-icon {
      font-size: 1.25rem;
    }

    .size-lg .option-icon {
      font-size: 1.75rem;
    }

    /* Option Text */
    .option-text {
      display: flex;
      flex-direction: column;
      flex: 1;
    }

    .option-label {
      font-size: 0.9375rem;
      font-weight: 500;
      color: #1f2937;
    }

    .size-sm .option-label {
      font-size: 0.875rem;
    }

    .size-lg .option-label {
      font-size: 1rem;
    }

    .option-description {
      font-size: 0.75rem;
      color: #6b7280;
      margin-top: 0.125rem;
    }

    .size-lg .option-description {
      font-size: 0.8125rem;
    }

    /* Card layout - radio at end */
    .radio-options.cards .card-content .radio-indicator,
    .radio-options.cards-horizontal .card-content .radio-indicator {
      order: 3;
      margin-left: auto;
    }

    .radio-options.cards .card-content .option-icon,
    .radio-options.cards-horizontal .card-content .option-icon {
      order: 1;
    }

    .radio-options.cards .card-content .option-text,
    .radio-options.cards-horizontal .card-content .option-text {
      order: 2;
    }

    /* Error/Hint Messages */
    .error-message {
      display: block;
      margin-top: 0.5rem;
      font-size: 0.75rem;
      color: var(--color-terracotta, #C62828);
    }

    .hint-message {
      display: block;
      margin-top: 0.5rem;
      font-size: 0.75rem;
      color: #6b7280;
    }

    /* Disabled state */
    .radio-group-container.disabled {
      opacity: 0.6;
      pointer-events: none;
    }

    /* Error state */
    .radio-group-container.error .radio-indicator {
      border-color: var(--color-terracotta, #C62828);
    }

    .radio-group-container.error .radio-options.cards .radio-option,
    .radio-group-container.error .radio-options.cards-horizontal .radio-option {
      border-color: #FFCDD2;
    }
  `],
})
export class UiRadioGroupComponent implements ControlValueAccessor {
  @Input() options: RadioOption[] = [];
  @Input() label?: string;
  @Input() layout: RadioLayout = 'vertical';
  @Input() size: RadioSize = 'md';
  @Input() disabled = false;
  @Input() required = false;
  @Input() error?: string;
  @Input() hint?: string;

  @Output() selectionChange = new EventEmitter<RadioOption>();

  private _value: string | number | null = null;
  private onChange: (value: string | number | null) => void = () => {};
  private onTouched: () => void = () => {};

  selectOption(option: RadioOption): void {
    if (this.disabled || option.disabled) return;

    this._value = option.value;
    this.onChange(this._value);
    this.onTouched();
    this.selectionChange.emit(option);
  }

  isSelected(option: RadioOption): boolean {
    return this._value === option.value;
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
