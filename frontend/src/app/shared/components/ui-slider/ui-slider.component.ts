import {
  Component,
  Input,
  Output,
  EventEmitter,
  forwardRef,
  signal,
  computed,
  ElementRef,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'ui-slider',
  standalone: true,
  imports: [CommonModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => UiSliderComponent),
      multi: true,
    },
  ],
  template: `
    <div class="slider-container" [class.disabled]="disabled">
      @if (label) {
        <div class="slider-header">
          <label class="slider-label">{{ label }}</label>
          @if (showValue) {
            <span class="slider-value">{{ displayValue() }}</span>
          }
        </div>
      }

      <div class="slider-track-container">
        @if (showMinMax) {
          <span class="slider-bound min">{{ formatValue(min) }}</span>
        }

        <div
          class="slider-track"
          #trackRef
          (click)="onTrackClick($event)"
          (mousedown)="onMouseDown($event)"
          (touchstart)="onTouchStart($event)"
        >
          <div
            class="slider-fill"
            [style.width.%]="fillPercentage()"
          ></div>
          <div
            class="slider-thumb"
            [style.left.%]="fillPercentage()"
            [class.dragging]="isDragging()"
          >
            @if (showTooltip && isDragging()) {
              <div class="slider-tooltip">{{ displayValue() }}</div>
            }
          </div>

          @if (marks.length > 0) {
            <div class="slider-marks">
              @for (mark of marks; track mark.value) {
                <div
                  class="slider-mark"
                  [style.left.%]="getMarkPosition(mark.value)"
                  [class.active]="value >= mark.value"
                >
                  @if (mark.label) {
                    <span class="mark-label">{{ mark.label }}</span>
                  }
                </div>
              }
            </div>
          }
        </div>

        @if (showMinMax) {
          <span class="slider-bound max">{{ formatValue(max) }}</span>
        }
      </div>

      @if (hint) {
        <span class="slider-hint">{{ hint }}</span>
      }
    </div>
  `,
  styles: [`
    .slider-container {
      width: 100%;
    }

    .slider-container.disabled {
      opacity: 0.5;
      pointer-events: none;
    }

    .slider-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 0.75rem;
    }

    .slider-label {
      font-size: 0.875rem;
      font-weight: 500;
      color: #374151;
    }

    .slider-value {
      font-size: 0.9375rem;
      font-weight: 600;
      color: #2563eb;
    }

    .slider-track-container {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .slider-bound {
      font-size: 0.75rem;
      color: #6b7280;
      min-width: 2rem;
    }

    .slider-bound.min {
      text-align: right;
    }

    .slider-bound.max {
      text-align: left;
    }

    .slider-track {
      position: relative;
      height: 6px;
      background: #e5e7eb;
      border-radius: 3px;
      flex: 1;
      cursor: pointer;
    }

    .slider-fill {
      position: absolute;
      left: 0;
      top: 0;
      height: 100%;
      background: #2563eb;
      border-radius: 3px;
      transition: width 0.1s ease;
    }

    .slider-thumb {
      position: absolute;
      top: 50%;
      width: 20px;
      height: 20px;
      background: white;
      border: 2px solid #2563eb;
      border-radius: 50%;
      transform: translate(-50%, -50%);
      cursor: grab;
      transition: box-shadow 0.2s ease, transform 0.1s ease;
      z-index: 2;
    }

    .slider-thumb:hover {
      box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.2);
    }

    .slider-thumb.dragging {
      cursor: grabbing;
      box-shadow: 0 0 0 6px rgba(37, 99, 235, 0.2);
      transform: translate(-50%, -50%) scale(1.1);
    }

    .slider-tooltip {
      position: absolute;
      bottom: calc(100% + 8px);
      left: 50%;
      transform: translateX(-50%);
      background: #1f2937;
      color: white;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: 500;
      white-space: nowrap;
    }

    .slider-tooltip::after {
      content: '';
      position: absolute;
      top: 100%;
      left: 50%;
      transform: translateX(-50%);
      border: 4px solid transparent;
      border-top-color: #1f2937;
    }

    .slider-marks {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 100%;
    }

    .slider-mark {
      position: absolute;
      top: 50%;
      width: 4px;
      height: 4px;
      background: #d1d5db;
      border-radius: 50%;
      transform: translate(-50%, -50%);
    }

    .slider-mark.active {
      background: white;
    }

    .mark-label {
      position: absolute;
      top: calc(100% + 12px);
      left: 50%;
      transform: translateX(-50%);
      font-size: 0.6875rem;
      color: #6b7280;
      white-space: nowrap;
    }

    .slider-hint {
      display: block;
      margin-top: 0.5rem;
      font-size: 0.75rem;
      color: #6b7280;
    }
  `],
})
export class UiSliderComponent implements ControlValueAccessor {
  @ViewChild('trackRef') trackRef!: ElementRef<HTMLDivElement>;

  @Input() min = 0;
  @Input() max = 100;
  @Input() step = 1;
  @Input() label?: string;
  @Input() hint?: string;
  @Input() disabled = false;
  @Input() showValue = true;
  @Input() showMinMax = false;
  @Input() showTooltip = true;
  @Input() unit = '';
  @Input() marks: { value: number; label?: string }[] = [];

  // Input for external value binding
  @Input()
  get value(): number {
    return this._value;
  }
  set value(val: number) {
    this._value = this.clamp(val);
  }

  @Output() valueChange = new EventEmitter<number>();

  readonly isDragging = signal(false);

  private _value = 0;
  private onChange: (value: number) => void = () => {};
  private onTouched: () => void = () => {};

  readonly fillPercentage = computed(() => {
    return ((this._value - this.min) / (this.max - this.min)) * 100;
  });

  readonly displayValue = computed(() => {
    return this.formatValue(this._value);
  });

  formatValue(val: number): string {
    return `${val}${this.unit}`;
  }

  getMarkPosition(value: number): number {
    return ((value - this.min) / (this.max - this.min)) * 100;
  }

  onTrackClick(event: MouseEvent): void {
    if (this.disabled) return;
    this.updateValueFromEvent(event);
  }

  onMouseDown(event: MouseEvent): void {
    if (this.disabled) return;
    event.preventDefault();
    this.isDragging.set(true);

    const onMouseMove = (e: MouseEvent) => {
      this.updateValueFromEvent(e);
    };

    const onMouseUp = () => {
      this.isDragging.set(false);
      this.onTouched();
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }

  onTouchStart(event: TouchEvent): void {
    if (this.disabled) return;
    event.preventDefault();
    this.isDragging.set(true);

    const onTouchMove = (e: TouchEvent) => {
      this.updateValueFromTouch(e);
    };

    const onTouchEnd = () => {
      this.isDragging.set(false);
      this.onTouched();
      document.removeEventListener('touchmove', onTouchMove);
      document.removeEventListener('touchend', onTouchEnd);
    };

    document.addEventListener('touchmove', onTouchMove);
    document.addEventListener('touchend', onTouchEnd);
  }

  private updateValueFromEvent(event: MouseEvent): void {
    const rect = this.trackRef.nativeElement.getBoundingClientRect();
    const percentage = (event.clientX - rect.left) / rect.width;
    this.setValueFromPercentage(percentage);
  }

  private updateValueFromTouch(event: TouchEvent): void {
    const rect = this.trackRef.nativeElement.getBoundingClientRect();
    const touch = event.touches[0];
    const percentage = (touch.clientX - rect.left) / rect.width;
    this.setValueFromPercentage(percentage);
  }

  private setValueFromPercentage(percentage: number): void {
    const range = this.max - this.min;
    let newValue = this.min + range * percentage;

    // Snap to step
    newValue = Math.round(newValue / this.step) * this.step;
    newValue = this.clamp(newValue);

    if (newValue !== this._value) {
      this._value = newValue;
      this.onChange(this._value);
      this.valueChange.emit(this._value);
    }
  }

  private clamp(value: number): number {
    return Math.min(Math.max(value, this.min), this.max);
  }

  // ControlValueAccessor
  writeValue(value: number): void {
    this._value = this.clamp(value ?? this.min);
  }

  registerOnChange(fn: (value: number) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }
}
