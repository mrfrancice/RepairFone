import { Component, Input, Output, EventEmitter, forwardRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';

@Component({
  selector: 'ui-input',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
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
        <label class="input-label" [attr.for]="inputId">
          {{ label }}
          @if (required) {
            <span class="required" aria-hidden="true">*</span>
          }
        </label>
      }

      <div class="input-container">
        @if (icon) {
          <span class="input-icon" aria-hidden="true">{{ icon }}</span>
        }

        @if (type === 'textarea') {
          <textarea
            [id]="inputId"
            [placeholder]="placeholder"
            [disabled]="disabled"
            [rows]="rows"
            [(ngModel)]="value"
            (ngModelChange)="onValueChange($event)"
            (blur)="onTouched()"
            class="input-field"
            [attr.aria-invalid]="error ? 'true' : null"
            [attr.aria-describedby]="error ? inputId + '-error' : (hint ? inputId + '-hint' : null)"
            [attr.aria-required]="required"
          ></textarea>
        } @else {
          <input
            [id]="inputId"
            [type]="inputType"
            [placeholder]="placeholder"
            [disabled]="disabled"
            [maxlength]="maxlength"
            [(ngModel)]="value"
            (ngModelChange)="onValueChange($event)"
            (blur)="onTouched()"
            class="input-field"
            [attr.aria-invalid]="error ? 'true' : null"
            [attr.aria-describedby]="error ? inputId + '-error' : (hint ? inputId + '-hint' : null)"
            [attr.aria-required]="required"
            [attr.autocomplete]="autocomplete"
          />
        }

        @if (type === 'password') {
          <button
            type="button"
            class="toggle-password"
            (click)="togglePassword()"
            [attr.aria-label]="showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'"
            [attr.aria-pressed]="showPassword"
          >
            <span aria-hidden="true">{{ showPassword ? '👁️' : '👁️‍🗨️' }}</span>
          </button>
        }

        @if (clearable && value) {
          <button
            type="button"
            class="clear-btn"
            (click)="clear()"
            aria-label="Effacer le champ"
          >
            <span aria-hidden="true">&#10005;</span>
          </button>
        }
      </div>

      @if (error) {
        <div class="error-container" [id]="inputId + '-error'" role="alert" aria-live="assertive">
          <span class="error-icon" aria-hidden="true">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 1C4.13 1 1 4.13 1 8s3.13 7 7 7 7-3.13 7-7-3.13-7-7-7zm0 10.5a.75.75 0 110-1.5.75.75 0 010 1.5zM8.75 7.5a.75.75 0 01-1.5 0v-3a.75.75 0 011.5 0v3z" fill="currentColor"/>
            </svg>
          </span>
          <span class="error-text">{{ error }}</span>
          @if (errorAction) {
            <button
              type="button"
              class="error-action"
              (click)="onErrorAction()"
              [attr.aria-label]="errorActionLabel || 'Corriger'"
            >
              {{ errorActionLabel || 'Corriger' }}
            </button>
          }
        </div>
      }

      @if (hint && !error) {
        <div class="hint-container" [id]="inputId + '-hint'">
          <span class="hint-icon" aria-hidden="true">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 0.5C3.41 0.5 0.5 3.41 0.5 7s2.91 6.5 6.5 6.5 6.5-2.91 6.5-6.5S10.59 0.5 7 0.5zm0 10a.75.75 0 110-1.5.75.75 0 010 1.5zm.75-3a.75.75 0 01-1.5 0V4.75a.75.75 0 011.5 0V7.5z" fill="currentColor"/>
            </svg>
          </span>
          <span class="hint-text">{{ hint }}</span>
        </div>
      }

      @if (successMessage && !error) {
        <div class="success-container" role="status" aria-live="polite">
          <span class="success-icon" aria-hidden="true">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 1C4.13 1 1 4.13 1 8s3.13 7 7 7 7-3.13 7-7-3.13-7-7-7zm3.22 5.28l-3.5 3.5a.75.75 0 01-1.06 0l-1.5-1.5a.75.75 0 111.06-1.06l.97.97 2.97-2.97a.75.75 0 011.06 1.06z" fill="currentColor"/>
            </svg>
          </span>
          <span class="success-text">{{ successMessage }}</span>
        </div>
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
      color: var(--color-neutral-700, #616161);
    }

    .required {
      color: var(--color-error, #F44336);
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
      color: var(--color-neutral-500, #6B7280);
      pointer-events: none;
    }

    .input-field {
      width: 100%;
      padding: 0.75rem 1rem;
      min-height: 44px;
      border: 1px solid var(--color-neutral-300, #E0E0E0);
      border-radius: var(--border-radius-md, 8px);
      font-size: 1rem;
      font-family: inherit;
      background: var(--color-surface, white);
      transition: border-color var(--transition-fast, 150ms), box-shadow var(--transition-fast, 150ms);
    }

    .input-container:has(.input-icon) .input-field {
      padding-left: 2.75rem;
    }

    .input-field:focus {
      outline: none;
      border-color: var(--color-primary-500, #FF9800);
      box-shadow: 0 0 0 3px rgba(255, 152, 0, 0.15);
    }

    .input-field:disabled {
      background: var(--color-neutral-100, #F5F5F5);
      cursor: not-allowed;
      color: var(--color-neutral-500, #6B7280);
    }

    .input-field::placeholder {
      color: var(--color-neutral-400, #BDBDBD);
    }

    textarea.input-field {
      resize: vertical;
      min-height: 80px;
    }

    .has-error .input-field {
      border-color: var(--color-error, #F44336);
    }

    .has-error .input-field:focus {
      box-shadow: 0 0 0 3px rgba(244, 67, 54, 0.15);
    }

    .toggle-password,
    .clear-btn {
      position: absolute;
      right: 0.5rem;
      background: none;
      border: none;
      cursor: pointer;
      padding: 0.5rem;
      font-size: 1rem;
      color: var(--color-neutral-500, #6B7280);
      min-width: 44px;
      min-height: 44px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: var(--border-radius-sm, 4px);
      transition: color var(--transition-fast, 150ms), background var(--transition-fast, 150ms);
    }

    .toggle-password:hover,
    .clear-btn:hover {
      color: var(--color-neutral-700, #616161);
      background: var(--color-neutral-100, #F5F5F5);
    }

    .toggle-password:focus,
    .clear-btn:focus {
      outline: 2px solid var(--color-primary-500, #FF9800);
      outline-offset: 2px;
    }

    .toggle-password:focus:not(:focus-visible),
    .clear-btn:focus:not(:focus-visible) {
      outline: none;
    }

    /* Enhanced error message styles */
    .error-container {
      display: flex;
      align-items: flex-start;
      gap: 0.375rem;
      padding: 0.5rem 0.75rem;
      background: var(--color-error-light, #FEF2F2);
      border-radius: var(--border-radius-md, 8px);
      border-left: 3px solid var(--color-error, #F44336);
      margin-top: 0.375rem;
      animation: slideIn 0.2s ease-out;
    }

    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateY(-4px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .error-icon {
      flex-shrink: 0;
      color: var(--color-error, #F44336);
      margin-top: 0.125rem;
    }

    .error-text {
      flex: 1;
      font-size: 0.8125rem;
      color: var(--color-error-dark, #C62828);
      font-weight: 500;
      line-height: 1.4;
    }

    .error-action {
      flex-shrink: 0;
      background: none;
      border: none;
      padding: 0.25rem 0.5rem;
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--color-primary, #FF9800);
      cursor: pointer;
      border-radius: 4px;
      transition: background 0.15s;
      min-height: 28px;
    }

    .error-action:hover {
      background: rgba(255, 152, 0, 0.1);
    }

    .error-action:focus-visible {
      outline: 2px solid var(--color-primary, #FF9800);
      outline-offset: 1px;
    }

    /* Hint message styles */
    .hint-container {
      display: flex;
      align-items: flex-start;
      gap: 0.25rem;
      margin-top: 0.25rem;
    }

    .hint-icon {
      flex-shrink: 0;
      color: var(--color-neutral-500, #6B7280);
      margin-top: 0.125rem;
    }

    .hint-text {
      font-size: 0.75rem;
      color: var(--color-neutral-600, #757575);
      line-height: 1.4;
    }

    /* Success message styles */
    .success-container {
      display: flex;
      align-items: flex-start;
      gap: 0.375rem;
      padding: 0.5rem 0.75rem;
      background: var(--color-success-light, #F0FDF4);
      border-radius: var(--border-radius-md, 8px);
      border-left: 3px solid var(--color-success, #4CAF50);
      margin-top: 0.375rem;
      animation: slideIn 0.2s ease-out;
    }

    .success-icon {
      flex-shrink: 0;
      color: var(--color-success, #4CAF50);
      margin-top: 0.125rem;
    }

    .success-text {
      flex: 1;
      font-size: 0.8125rem;
      color: var(--color-success-dark, #2E7D32);
      font-weight: 500;
      line-height: 1.4;
    }
  `]
})
export class UiInputComponent implements ControlValueAccessor {
  private static nextId = 0;

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
  @Input() autocomplete?: string;
  @Input() successMessage?: string;
  @Input() errorAction = false;
  @Input() errorActionLabel?: string;

  @Output() errorActionClick = new EventEmitter<void>();

  readonly inputId = `ui-input-${UiInputComponent.nextId++}`;

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

  onErrorAction(): void {
    this.errorActionClick.emit();
  }
}
