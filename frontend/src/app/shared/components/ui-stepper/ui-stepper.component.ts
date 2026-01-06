import {
  Component,
  Input,
  Output,
  EventEmitter,
  signal,
  computed,
  ContentChildren,
  QueryList,
  AfterContentInit,
  TemplateRef,
  Directive,
} from '@angular/core';
import { CommonModule } from '@angular/common';

export interface StepConfig {
  label: string;
  icon?: string;
  description?: string;
  optional?: boolean;
  completed?: boolean;
  error?: boolean;
}

@Directive({
  selector: '[uiStepContent]',
  standalone: true,
})
export class UiStepContentDirective {
  constructor(public templateRef: TemplateRef<unknown>) {}
}

@Component({
  selector: 'ui-stepper',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="stepper-container" [class.vertical]="orientation === 'vertical'">
      <!-- Step Headers -->
      <div class="stepper-header" [class.vertical]="orientation === 'vertical'">
        @for (step of steps; track $index; let i = $index; let last = $last) {
          <div
            class="step-item"
            [class.active]="i === _currentStep()"
            [class.completed]="isStepCompleted(i)"
            [class.error]="step.error"
            [class.clickable]="allowNavigation && isStepAccessible(i)"
            (click)="goToStep(i)"
          >
            <div class="step-indicator">
              @if (isStepCompleted(i) && !step.error) {
                <svg class="step-check" viewBox="0 0 20 20" fill="none">
                  <path d="M16.667 5L7.5 14.167L3.333 10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              } @else if (step.error) {
                <svg class="step-error-icon" viewBox="0 0 20 20" fill="none">
                  <path d="M10 6V10M10 14H10.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
              } @else if (step.icon) {
                <span class="step-icon">{{ step.icon }}</span>
              } @else {
                <span class="step-number">{{ i + 1 }}</span>
              }
            </div>

            <div class="step-content">
              <span class="step-label">
                {{ step.label }}
                @if (step.optional) {
                  <span class="step-optional">(Optionnel)</span>
                }
              </span>
              @if (step.description && orientation === 'vertical') {
                <span class="step-description">{{ step.description }}</span>
              }
            </div>

            @if (!last && orientation === 'horizontal') {
              <div class="step-connector" [class.completed]="isStepCompleted(i)"></div>
            }
          </div>

          @if (!last && orientation === 'vertical') {
            <div class="step-connector-vertical" [class.completed]="isStepCompleted(i)"></div>
          }
        }
      </div>

      <!-- Step Content -->
      <div class="stepper-content">
        <ng-content></ng-content>
      </div>

      <!-- Navigation Buttons -->
      @if (showNavigation) {
        <div class="stepper-navigation">
          <button
            type="button"
            class="btn btn-outline"
            [disabled]="_currentStep() === 0"
            (click)="previous()"
          >
            {{ prevLabel }}
          </button>

          <div class="nav-spacer"></div>

          @if (_currentStep() < steps.length - 1) {
            <button
              type="button"
              class="btn btn-primary"
              [disabled]="!canProceed()"
              (click)="next()"
            >
              {{ nextLabel }}
            </button>
          } @else {
            <button
              type="button"
              class="btn btn-primary"
              [disabled]="!canProceed()"
              (click)="complete()"
            >
              {{ completeLabel }}
            </button>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .stepper-container {
      width: 100%;
    }

    /* Stepper Header */
    .stepper-header {
      display: flex;
      align-items: flex-start;
      margin-bottom: 1.5rem;
    }

    .stepper-header.vertical {
      flex-direction: column;
    }

    /* Step Item */
    .step-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      flex: 1;
      position: relative;
    }

    .stepper-header.vertical .step-item {
      flex: none;
    }

    .step-item.clickable {
      cursor: pointer;
    }

    .step-item.clickable:hover .step-indicator {
      transform: scale(1.05);
    }

    /* Step Indicator */
    .step-indicator {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: #e5e7eb;
      color: #6b7280;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 0.875rem;
      flex-shrink: 0;
      transition: all 0.3s ease;
      z-index: 1;
    }

    .step-item.active .step-indicator {
      background: #2563eb;
      color: white;
      box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.2);
    }

    .step-item.completed .step-indicator {
      background: #16a34a;
      color: white;
    }

    .step-item.error .step-indicator {
      background: #dc2626;
      color: white;
    }

    .step-check,
    .step-error-icon {
      width: 18px;
      height: 18px;
    }

    .step-icon {
      font-size: 1.125rem;
    }

    .step-number {
      font-size: 0.9375rem;
    }

    /* Step Content */
    .step-content {
      display: flex;
      flex-direction: column;
      min-width: 0;
    }

    .step-label {
      font-size: 0.875rem;
      font-weight: 600;
      color: #374151;
      white-space: nowrap;
    }

    .step-item.active .step-label {
      color: #2563eb;
    }

    .step-item.completed .step-label {
      color: #16a34a;
    }

    .step-item.error .step-label {
      color: #dc2626;
    }

    .step-optional {
      font-weight: 400;
      color: #9ca3af;
      margin-left: 0.25rem;
    }

    .step-description {
      font-size: 0.75rem;
      color: #6b7280;
      margin-top: 0.125rem;
    }

    /* Horizontal Connector */
    .step-connector {
      position: absolute;
      top: 18px;
      left: calc(36px + 0.75rem);
      right: 0;
      height: 2px;
      background: #e5e7eb;
      transition: background 0.3s ease;
    }

    .step-connector.completed {
      background: #16a34a;
    }

    /* Vertical Connector */
    .step-connector-vertical {
      width: 2px;
      height: 24px;
      background: #e5e7eb;
      margin-left: 17px;
      transition: background 0.3s ease;
    }

    .step-connector-vertical.completed {
      background: #16a34a;
    }

    /* Stepper Content */
    .stepper-content {
      padding: 0.5rem 0;
    }

    /* Navigation */
    .stepper-navigation {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-top: 1.5rem;
      padding-top: 1rem;
      border-top: 1px solid #e5e7eb;
    }

    .nav-spacer {
      flex: 1;
    }

    .btn {
      padding: 0.75rem 1.5rem;
      border-radius: 8px;
      font-weight: 600;
      font-size: 0.9375rem;
      cursor: pointer;
      transition: all 0.2s ease;
      border: none;
    }

    .btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .btn-primary {
      background: #2563eb;
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      background: #1d4ed8;
    }

    .btn-outline {
      background: white;
      color: #374151;
      border: 1px solid #d1d5db;
    }

    .btn-outline:hover:not(:disabled) {
      background: #f3f4f6;
      border-color: #9ca3af;
    }

    /* Responsive */
    @media (max-width: 640px) {
      .stepper-header:not(.vertical) {
        overflow-x: auto;
        padding-bottom: 0.5rem;
      }

      .step-item {
        min-width: max-content;
      }

      .step-content {
        display: none;
      }

      .step-connector {
        display: none;
      }

      .step-item::after {
        content: '';
        position: absolute;
        top: 50%;
        left: 100%;
        width: 24px;
        height: 2px;
        background: #e5e7eb;
        transform: translateY(-50%);
      }

      .step-item:last-child::after {
        display: none;
      }

      .step-item.completed::after {
        background: #16a34a;
      }
    }
  `],
})
export class UiStepperComponent implements AfterContentInit {
  @Input() steps: StepConfig[] = [];
  @Input() orientation: 'horizontal' | 'vertical' = 'horizontal';
  @Input() showNavigation = true;
  @Input() allowNavigation = false;
  @Input() linear = true;
  @Input() prevLabel = 'Précédent';
  @Input() nextLabel = 'Suivant';
  @Input() completeLabel = 'Terminer';

  // Input to set current step from parent
  @Input() set currentStep(value: number) {
    this._currentStep.set(value);
  }

  // Input to set completed steps from parent
  @Input() set completedSteps(value: number[]) {
    this._completedSteps = new Set(value);
  }

  @Output() stepChange = new EventEmitter<number>();
  @Output() onComplete = new EventEmitter<void>();
  @Output() onNext = new EventEmitter<number>();
  @Output() onPrevious = new EventEmitter<number>();

  @ContentChildren(UiStepContentDirective) stepContents!: QueryList<UiStepContentDirective>;

  readonly _currentStep = signal(0);
  private _completedSteps = new Set<number>();
  private stepValidators: Map<number, () => boolean> = new Map();

  // Getter for template
  currentStepValue = () => this._currentStep();

  ngAfterContentInit(): void {
    // Content children are available here
  }

  isStepCompleted(index: number): boolean {
    // Check external completedSteps first
    if (this._completedSteps.has(index)) {
      return true;
    }
    if (this.steps[index]?.completed !== undefined) {
      return this.steps[index].completed!;
    }
    return index < this._currentStep();
  }

  isStepAccessible(index: number): boolean {
    if (!this.linear) return true;
    if (index <= this._currentStep()) return true;

    // Check if all previous steps are completed
    for (let i = 0; i < index; i++) {
      if (!this.isStepCompleted(i)) return false;
    }
    return true;
  }

  canProceed(): boolean {
    const validator = this.stepValidators.get(this._currentStep());
    if (validator) {
      return validator();
    }
    return true;
  }

  registerStepValidator(stepIndex: number, validator: () => boolean): void {
    this.stepValidators.set(stepIndex, validator);
  }

  goToStep(index: number): void {
    if (!this.allowNavigation) return;
    if (!this.isStepAccessible(index)) return;

    this._currentStep.set(index);
    this.stepChange.emit(index);
  }

  next(): void {
    if (this._currentStep() >= this.steps.length - 1) return;
    if (!this.canProceed()) return;

    const nextIndex = this._currentStep() + 1;
    this._currentStep.set(nextIndex);
    this.stepChange.emit(nextIndex);
    this.onNext.emit(nextIndex);
  }

  previous(): void {
    if (this._currentStep() <= 0) return;

    const prevIndex = this._currentStep() - 1;
    this._currentStep.set(prevIndex);
    this.stepChange.emit(prevIndex);
    this.onPrevious.emit(prevIndex);
  }

  complete(): void {
    if (!this.canProceed()) return;
    this.onComplete.emit();
  }

  reset(): void {
    this._currentStep.set(0);
    this.stepChange.emit(0);
  }

  setStep(index: number): void {
    if (index >= 0 && index < this.steps.length) {
      this._currentStep.set(index);
      this.stepChange.emit(index);
    }
  }

  markStepCompleted(index: number, completed = true): void {
    if (this.steps[index]) {
      this.steps[index].completed = completed;
    }
  }

  markStepError(index: number, hasError = true): void {
    if (this.steps[index]) {
      this.steps[index].error = hasError;
    }
  }
}
