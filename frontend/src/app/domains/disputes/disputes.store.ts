import { Injectable, signal, computed } from '@angular/core';
import { Dispute, DisputeStatus, DisputeMessage } from './disputes.service';

export interface DisputeFormState {
  requestId: string | null;
  reason: string | null;
  description: string;
  photos: string[];
  step: 'reason' | 'details' | 'evidence' | 'confirm';
}

@Injectable({ providedIn: 'root' })
export class DisputesStore {
  // Dispute list
  private readonly _disputes = signal<Dispute[]>([]);
  private readonly _totalDisputes = signal(0);
  private readonly _filterStatus = signal<DisputeStatus | null>(null);

  // Current dispute
  private readonly _currentDispute = signal<Dispute | null>(null);

  // Form state
  private readonly _formState = signal<DisputeFormState>({
    requestId: null,
    reason: null,
    description: '',
    photos: [],
    step: 'reason',
  });

  // Public selectors
  readonly disputes = this._disputes.asReadonly();
  readonly totalDisputes = this._totalDisputes.asReadonly();
  readonly filterStatus = this._filterStatus.asReadonly();
  readonly currentDispute = this._currentDispute.asReadonly();
  readonly formState = this._formState.asReadonly();

  // Computed
  readonly hasDisputes = computed(() => this._disputes().length > 0);

  readonly openDisputes = computed(() =>
    this._disputes().filter(d => d.status === 'open' || d.status === 'in_review')
  );

  readonly resolvedDisputes = computed(() =>
    this._disputes().filter(d => d.status === 'resolved' || d.status === 'closed')
  );

  readonly filteredDisputes = computed(() => {
    const status = this._filterStatus();
    if (!status) return this._disputes();
    return this._disputes().filter(d => d.status === status);
  });

  readonly canProceed = computed(() => {
    const state = this._formState();
    switch (state.step) {
      case 'reason':
        return state.reason !== null;
      case 'details':
        return state.description.trim().length >= 20;
      case 'evidence':
        return true; // Evidence is optional
      case 'confirm':
        return true;
      default:
        return false;
    }
  });

  readonly currentDisputeMessages = computed(() =>
    this._currentDispute()?.messages || []
  );

  // Actions for dispute list
  setDisputes(disputes: Dispute[], total: number): void {
    this._disputes.set(disputes);
    this._totalDisputes.set(total);
  }

  appendDisputes(disputes: Dispute[]): void {
    this._disputes.update(current => [...current, ...disputes]);
  }

  updateDispute(id: string, updates: Partial<Dispute>): void {
    this._disputes.update(disputes =>
      disputes.map(d => d.id === id ? { ...d, ...updates } : d)
    );

    // Also update current dispute if it matches
    if (this._currentDispute()?.id === id) {
      this._currentDispute.update(d => d ? { ...d, ...updates } : null);
    }
  }

  setFilterStatus(status: DisputeStatus | null): void {
    this._filterStatus.set(status);
  }

  // Actions for current dispute
  setCurrentDispute(dispute: Dispute | null): void {
    this._currentDispute.set(dispute);
  }

  addMessageToCurrentDispute(message: DisputeMessage): void {
    this._currentDispute.update(dispute => {
      if (!dispute) return null;
      return {
        ...dispute,
        messages: [...dispute.messages, message],
      };
    });
  }

  // Actions for form state
  initForm(requestId: string): void {
    this._formState.set({
      requestId,
      reason: null,
      description: '',
      photos: [],
      step: 'reason',
    });
  }

  setReason(reason: string): void {
    this._formState.update(state => ({
      ...state,
      reason,
    }));
  }

  setDescription(description: string): void {
    this._formState.update(state => ({
      ...state,
      description,
    }));
  }

  addPhoto(photoUrl: string): void {
    this._formState.update(state => ({
      ...state,
      photos: [...state.photos, photoUrl],
    }));
  }

  removePhoto(index: number): void {
    this._formState.update(state => ({
      ...state,
      photos: state.photos.filter((_, i) => i !== index),
    }));
  }

  setStep(step: DisputeFormState['step']): void {
    this._formState.update(state => ({
      ...state,
      step,
    }));
  }

  nextStep(): void {
    const steps: DisputeFormState['step'][] = ['reason', 'details', 'evidence', 'confirm'];
    const currentIndex = steps.indexOf(this._formState().step);
    if (currentIndex < steps.length - 1) {
      this.setStep(steps[currentIndex + 1]);
    }
  }

  previousStep(): void {
    const steps: DisputeFormState['step'][] = ['reason', 'details', 'evidence', 'confirm'];
    const currentIndex = steps.indexOf(this._formState().step);
    if (currentIndex > 0) {
      this.setStep(steps[currentIndex - 1]);
    }
  }

  resetForm(): void {
    this._formState.set({
      requestId: null,
      reason: null,
      description: '',
      photos: [],
      step: 'reason',
    });
  }

  reset(): void {
    this._disputes.set([]);
    this._totalDisputes.set(0);
    this._filterStatus.set(null);
    this._currentDispute.set(null);
    this.resetForm();
  }
}
