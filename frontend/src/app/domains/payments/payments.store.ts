import { Injectable, signal, computed } from '@angular/core';
import type { Payment, PaymentMethod, PaymentStatus, PaymentType, PaymentSummary } from './types';

export interface PaymentFlowState {
  requestId: string | null;
  quoteId: string | null;
  quoteAmount: number;
  paymentType: PaymentType;
  selectedMethod: PaymentMethod | null;
  phoneNumber: string;
  summary: PaymentSummary | null;
  currentPayment: Payment | null;
  step: 'summary' | 'method' | 'confirm' | 'processing' | 'result';
}

@Injectable({ providedIn: 'root' })
export class PaymentsStore {
  // Payment history
  private readonly _payments = signal<Payment[]>([]);
  private readonly _totalPayments = signal(0);
  private readonly _filterStatus = signal<PaymentStatus | null>(null);
  private readonly _userRole = signal<'client' | 'repairer' | 'admin'>('client');

  // Payment flow state
  private readonly _flowState = signal<PaymentFlowState>({
    requestId: null,
    quoteId: null,
    quoteAmount: 0,
    paymentType: 'full',
    selectedMethod: null,
    phoneNumber: '',
    summary: null,
    currentPayment: null,
    step: 'summary',
  });

  // Public selectors
  readonly payments = this._payments.asReadonly();
  readonly totalPayments = this._totalPayments.asReadonly();
  readonly filterStatus = this._filterStatus.asReadonly();
  readonly flowState = this._flowState.asReadonly();
  readonly userRole = this._userRole.asReadonly();
  readonly isRepairer = computed(() => this._userRole() === 'repairer');

  // Computed
  readonly hasPayments = computed(() => this._payments().length > 0);

  readonly completedPayments = computed(() =>
    this._payments().filter(p => p.status === 'completed')
  );

  readonly pendingPayments = computed(() =>
    this._payments().filter(p => p.status === 'pending' || p.status === 'processing')
  );

  readonly filteredPayments = computed(() => {
    const status = this._filterStatus();
    if (!status) return this._payments();
    return this._payments().filter(p => p.status === status);
  });

  readonly totalSpent = computed(() =>
    this._payments()
      .filter(p => p.status === 'completed')
      .reduce((sum, p) => sum + p.amount, 0)
  );

  readonly totalReceived = computed(() =>
    this._payments()
      .filter(p => p.status === 'completed')
      .reduce((sum, p) => sum + (p.repairerAmount || 0), 0)
  );

  readonly canProceed = computed(() => {
    const state = this._flowState();
    switch (state.step) {
      case 'summary':
        return state.quoteAmount > 0;
      case 'method':
        return state.selectedMethod !== null;
      case 'confirm':
        return state.phoneNumber.length >= 10;
      default:
        return false;
    }
  });

  // Actions for payment history
  setPayments(payments: Payment[], total: number): void {
    this._payments.set(payments);
    this._totalPayments.set(total);
  }

  appendPayments(payments: Payment[]): void {
    this._payments.update(current => [...current, ...payments]);
  }

  updatePayment(id: string, updates: Partial<Payment>): void {
    this._payments.update(payments =>
      payments.map(p => p.id === id ? { ...p, ...updates } : p)
    );
  }

  setFilterStatus(status: PaymentStatus | null): void {
    this._filterStatus.set(status);
  }

  setUserRole(role: 'client' | 'repairer' | 'admin'): void {
    this._userRole.set(role);
  }

  // Actions for payment flow
  initFlow(requestId: string, quoteId: string, quoteAmount: number, summary: PaymentSummary): void {
    this._flowState.set({
      requestId,
      quoteId,
      quoteAmount,
      paymentType: 'full',
      selectedMethod: null,
      phoneNumber: '',
      summary,
      currentPayment: null,
      step: 'summary',
    });
  }

  setPaymentType(type: PaymentType): void {
    this._flowState.update(state => ({
      ...state,
      paymentType: type,
    }));
  }

  setSelectedMethod(method: PaymentMethod): void {
    this._flowState.update(state => ({
      ...state,
      selectedMethod: method,
    }));
  }

  setPhoneNumber(phone: string): void {
    this._flowState.update(state => ({
      ...state,
      phoneNumber: phone,
    }));
  }

  setCurrentPayment(payment: Payment): void {
    this._flowState.update(state => ({
      ...state,
      currentPayment: payment,
    }));
  }

  setStep(step: PaymentFlowState['step']): void {
    this._flowState.update(state => ({
      ...state,
      step,
    }));
  }

  nextStep(): void {
    const steps: PaymentFlowState['step'][] = ['summary', 'method', 'confirm', 'processing', 'result'];
    const currentIndex = steps.indexOf(this._flowState().step);
    if (currentIndex < steps.length - 1) {
      this.setStep(steps[currentIndex + 1]);
    }
  }

  previousStep(): void {
    const steps: PaymentFlowState['step'][] = ['summary', 'method', 'confirm'];
    const currentIndex = steps.indexOf(this._flowState().step);
    if (currentIndex > 0) {
      this.setStep(steps[currentIndex - 1]);
    }
  }

  resetFlow(): void {
    this._flowState.set({
      requestId: null,
      quoteId: null,
      quoteAmount: 0,
      paymentType: 'full',
      selectedMethod: null,
      phoneNumber: '',
      summary: null,
      currentPayment: null,
      step: 'summary',
    });
  }

  reset(): void {
    this._payments.set([]);
    this._totalPayments.set(0);
    this._filterStatus.set(null);
    this.resetFlow();
  }
}
