import {
  Component,
  Input,
  Output,
  EventEmitter,
  forwardRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

export type CheckboxSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'ui-checkbox',
  standalone: true,
  imports: [CommonModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => UiCheckboxComponent),
      multi: true,
    },
  ],
  template: `
    <label
      class="checkbox-container"
      [class.disabled]="disabled"
      [class.error]="error"
      [class.size-sm]="size === 'sm'"
      [class.size-md]="size === 'md'"
      [class.size-lg]="size === 'lg'"
      [class.card-style]="cardStyle"
      [class.checked]="checked"
    >
      <div class="checkbox-wrapper">
        <input
          type="checkbox"
          class="checkbox-input"
          [checked]="checked"
          [disabled]="disabled"
          (change)="onCheckChange($event)"
          (blur)="onBlur()"
        />
        <span class="checkbox-box" [class.checked]="checked" [class.indeterminate]="indeterminate">
          @if (checked) {
            <svg class="check-icon" viewBox="0 0 14 14" fill="none">
              <path d="M11.5 4L5.5 10L2.5 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          } @else if (indeterminate) {
            <svg class="indeterminate-icon" viewBox="0 0 14 14" fill="none">
              <path d="M3 7H11" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
          }
        </span>
      </div>

      <div class="checkbox-content">
        @if (label) {
          <span class="checkbox-label">
            {{ label }}
            @if (required) {
              <span class="required">*</span>
            }
          </span>
        }
        @if (description) {
          <span class="checkbox-description">{{ description }}</span>
        }
        <ng-content></ng-content>
      </div>
    </label>

    @if (error) {
      <span class="error-message">{{ error }}</span>
    }
    @if (hint && !error) {
      <span class="hint-message">{{ hint }}</span>
    }
  `,
  styles: [`
    :host {
      display: block;
    }

    .checkbox-container {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      cursor: pointer;
      user-select: none;
      transition: all 0.2s ease;
    }

    .checkbox-container.disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    /* Card Style */
    .checkbox-container.card-style {
      padding: 1rem;
      border: 2px solid #e5e7eb;
      border-radius: 12px;
      background: white;
    }

    .checkbox-container.card-style:hover:not(.disabled) {
      border-color: #2563eb;
      background: #f8fafc;
    }

    .checkbox-container.card-style.checked {
      border-color: #2563eb;
      background: #eff6ff;
    }

    /* Checkbox Wrapper */
    .checkbox-wrapper {
      position: relative;
      flex-shrink: 0;
    }

    .checkbox-input {
      position: absolute;
      opacity: 0;
      width: 0;
      height: 0;
    }

    /* Checkbox Box */
    .checkbox-box {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 20px;
      height: 20px;
      border: 2px solid #d1d5db;
      border-radius: 6px;
      background: white;
      transition: all 0.2s ease;
      color: white;
    }

    .checkbox-container:hover:not(.disabled) .checkbox-box {
      border-color: #2563eb;
    }

    .checkbox-input:focus + .checkbox-box {
      box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.2);
    }

    .checkbox-box.checked {
      background: #2563eb;
      border-color: #2563eb;
    }

    .checkbox-box.indeterminate {
      background: #2563eb;
      border-color: #2563eb;
    }

    .check-icon,
    .indeterminate-icon {
      width: 12px;
      height: 12px;
    }

    /* Size Variants */
    .size-sm .checkbox-box {
      width: 16px;
      height: 16px;
      border-radius: 4px;
    }

    .size-sm .check-icon,
    .size-sm .indeterminate-icon {
      width: 10px;
      height: 10px;
    }

    .size-lg .checkbox-box {
      width: 24px;
      height: 24px;
      border-radius: 8px;
    }

    .size-lg .check-icon,
    .size-lg .indeterminate-icon {
      width: 14px;
      height: 14px;
    }

    /* Content */
    .checkbox-content {
      display: flex;
      flex-direction: column;
      flex: 1;
      padding-top: 1px;
    }

    .checkbox-label {
      font-size: 0.9375rem;
      font-weight: 500;
      color: #1f2937;
      line-height: 1.4;
    }

    .size-sm .checkbox-label {
      font-size: 0.875rem;
    }

    .size-lg .checkbox-label {
      font-size: 1rem;
    }

    .required {
      color: #dc2626;
      margin-left: 0.25rem;
    }

    .checkbox-description {
      font-size: 0.8125rem;
      color: #6b7280;
      margin-top: 0.25rem;
      line-height: 1.4;
    }

    .size-sm .checkbox-description {
      font-size: 0.75rem;
    }

    /* Error State */
    .checkbox-container.error .checkbox-box {
      border-color: #dc2626;
    }

    .checkbox-container.error.card-style {
      border-color: #fecaca;
    }

    /* Messages */
    .error-message {
      display: block;
      margin-top: 0.5rem;
      font-size: 0.75rem;
      color: #dc2626;
    }

    .hint-message {
      display: block;
      margin-top: 0.5rem;
      font-size: 0.75rem;
      color: #6b7280;
    }
  `],
})
export class UiCheckboxComponent implements ControlValueAccessor {
  @Input() label?: string;
  @Input() description?: string;
  @Input() size: CheckboxSize = 'md';
  @Input() disabled = false;
  @Input() required = false;
  @Input() indeterminate = false;
  @Input() cardStyle = false;
  @Input() error?: string;
  @Input() hint?: string;

  @Output() checkedChange = new EventEmitter<boolean>();

  checked = false;
  private onChange: (value: boolean) => void = () => {};
  private onTouched: () => void = () => {};

  onCheckChange(event: Event): void {
    if (this.disabled) return;

    const target = event.target as HTMLInputElement;
    this.checked = target.checked;
    this.indeterminate = false;
    this.onChange(this.checked);
    this.checkedChange.emit(this.checked);
  }

  onBlur(): void {
    this.onTouched();
  }

  // ControlValueAccessor
  writeValue(value: boolean): void {
    this.checked = !!value;
  }

  registerOnChange(fn: (value: boolean) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }
}
