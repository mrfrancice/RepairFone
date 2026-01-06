import { Component, Input, Output, EventEmitter, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';

@Component({
  selector: 'ui-input',
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => UiInputComponent),
      multi: true
    }
  ],
  template: `
    <div class="input-wrapper" [class.has-error]="error" [class.disabled]="disabled">
      @if (label) {
        <label class="input-label">
          {{ label }}
          @if (required) {
            <span class="required">*</span>
          }
        </label>
      }

      <div class="input-container">
        @if (icon) {
          <span class="input-icon">{{ icon }}</span>
        }

        @if (type === 'textarea') {
          <textarea
            [placeholder]="placeholder"
            [disabled]="disabled"
            [rows]="rows"
            [(ngModel)]="value"
            (ngModelChange)="onValueChange($event)"
            (blur)="onTouched()"
            class="input-field"
          ></textarea>
        } @else {
          <input
            [type]="inputType"
            [placeholder]="placeholder"
            [disabled]="disabled"
            [maxlength]="maxlength"
            [(ngModel)]="value"
            (ngModelChange)="onValueChange($event)"
            (blur)="onTouched()"
            class="input-field"
          />
        }

        @if (type === 'password') {
          <button type="button" class="toggle-password" (click)="togglePassword()">
            {{ showPassword ? '👁️' : '👁️‍🗨️' }}
          </button>
        }

        @if (clearable && value) {
          <button type="button" class="clear-btn" (click)="clear()">✕</button>
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
    .input-wrapper {
      display: flex;
      flex-direction: column;
      gap: 0.375rem;
    }

    .input-label {
      font-size: 0.875rem;
      font-weight: 500;
      color: #374151;
    }

    .required {
      color: #dc2626;
      margin-left: 0.125rem;
    }

    .input-container {
      position: relative;
      display: flex;
      align-items: center;
    }

    .input-icon {
      position: absolute;
      left: 0.875rem;
      font-size: 1.125rem;
      color: #6b7280;
      pointer-events: none;
    }

    .input-field {
      width: 100%;
      padding: 0.75rem 1rem;
      border: 1px solid #d1d5db;
      border-radius: 8px;
      font-size: 1rem;
      font-family: inherit;
      background: white;
      transition: border-color 0.2s, box-shadow 0.2s;
    }

    .input-container:has(.input-icon) .input-field {
      padding-left: 2.75rem;
    }

    .input-field:focus {
      outline: none;
      border-color: #2563eb;
      box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
    }

    .input-field:disabled {
      background: #f3f4f6;
      cursor: not-allowed;
    }

    .input-field::placeholder {
      color: #9ca3af;
    }

    textarea.input-field {
      resize: vertical;
      min-height: 80px;
    }

    .has-error .input-field {
      border-color: #dc2626;
    }

    .has-error .input-field:focus {
      box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
    }

    .toggle-password,
    .clear-btn {
      position: absolute;
      right: 0.75rem;
      background: none;
      border: none;
      cursor: pointer;
      padding: 0.25rem;
      font-size: 1rem;
      color: #6b7280;
    }

    .toggle-password:hover,
    .clear-btn:hover {
      color: #374151;
    }

    .error-message {
      font-size: 0.75rem;
      color: #dc2626;
    }

    .hint-message {
      font-size: 0.75rem;
      color: #6b7280;
    }
  `]
})
export class UiInputComponent implements ControlValueAccessor {
  @Input() label?: string;
  @Input() placeholder = '';
  @Input() type: 'text' | 'email' | 'password' | 'tel' | 'number' | 'textarea' = 'text';
  @Input() error?: string;
  @Input() hint?: string;
  @Input() icon?: string;
  @Input() disabled = false;
  @Input() required = false;
  @Input() clearable = false;
  @Input() maxlength: number | null = null;
  @Input() rows = 3;

  value: any = '';
  showPassword = false;
  onChange: (value: any) => void = () => {};
  onTouched: () => void = () => {};

  get inputType(): string {
    if (this.type === 'password') {
      return this.showPassword ? 'text' : 'password';
    }
    return this.type;
  }

  writeValue(value: any): void {
    this.value = value || '';
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  onValueChange(value: any): void {
    this.value = value;
    this.onChange(value);
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  clear(): void {
    this.value = '';
    this.onChange('');
  }
}
