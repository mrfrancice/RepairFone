import { Injectable, signal, computed } from '@angular/core';
import type { ConseilType, ConseilFormat } from './types';
import type { Expert, ConseilSession, ConseilMessage } from './conseils.service';

@Injectable({ providedIn: 'root' })
export class ConseilsStore {
  // Selected options
  private readonly _selectedType = signal<ConseilType | null>(null);
  private readonly _selectedFormat = signal<ConseilFormat | null>(null);
  private readonly _selectedExpert = signal<Expert | null>(null);

  // Experts list
  private readonly _experts = signal<Expert[]>([]);
  private readonly _totalExperts = signal(0);
  private readonly _isLoadingExperts = signal(false);

  // Current session
  private readonly _currentSession = signal<ConseilSession | null>(null);
  private readonly _messages = signal<ConseilMessage[]>([]);
  private readonly _isLoadingMessages = signal(false);

  // Sessions list
  private readonly _sessions = signal<ConseilSession[]>([]);
  private readonly _totalSessions = signal(0);
  private readonly _isLoadingSessions = signal(false);

  // Public signals
  readonly selectedType = this._selectedType.asReadonly();
  readonly selectedFormat = this._selectedFormat.asReadonly();
  readonly selectedExpert = this._selectedExpert.asReadonly();

  readonly experts = this._experts.asReadonly();
  readonly totalExperts = this._totalExperts.asReadonly();
  readonly isLoadingExperts = this._isLoadingExperts.asReadonly();

  readonly currentSession = this._currentSession.asReadonly();
  readonly messages = this._messages.asReadonly();
  readonly isLoadingMessages = this._isLoadingMessages.asReadonly();

  readonly sessions = this._sessions.asReadonly();
  readonly totalSessions = this._totalSessions.asReadonly();
  readonly isLoadingSessions = this._isLoadingSessions.asReadonly();

  // Computed
  readonly hasSelectedType = computed(() => this._selectedType() !== null);
  readonly hasSelectedFormat = computed(() => this._selectedFormat() !== null);
  readonly hasSelectedExpert = computed(() => this._selectedExpert() !== null);
  readonly canProceed = computed(() =>
    this.hasSelectedType() && this.hasSelectedFormat() && this.hasSelectedExpert()
  );

  readonly availableExperts = computed(() =>
    this._experts().filter((e) => e.isAvailable)
  );

  // Actions
  setSelectedType(type: ConseilType | null): void {
    this._selectedType.set(type);
    // Reset expert when type changes
    if (type !== this._selectedType()) {
      this._selectedExpert.set(null);
    }
  }

  setSelectedFormat(format: ConseilFormat | null): void {
    this._selectedFormat.set(format);
  }

  setSelectedExpert(expert: Expert | null): void {
    this._selectedExpert.set(expert);
  }

  setExperts(experts: Expert[], total: number): void {
    this._experts.set(experts);
    this._totalExperts.set(total);
  }

  setIsLoadingExperts(loading: boolean): void {
    this._isLoadingExperts.set(loading);
  }

  setCurrentSession(session: ConseilSession | null): void {
    this._currentSession.set(session);
  }

  setMessages(messages: ConseilMessage[]): void {
    this._messages.set(messages);
  }

  addMessage(message: ConseilMessage): void {
    this._messages.update((msgs) => [...msgs, message]);
  }

  setIsLoadingMessages(loading: boolean): void {
    this._isLoadingMessages.set(loading);
  }

  setSessions(sessions: ConseilSession[], total: number): void {
    this._sessions.set(sessions);
    this._totalSessions.set(total);
  }

  setIsLoadingSessions(loading: boolean): void {
    this._isLoadingSessions.set(loading);
  }

  // Reset
  reset(): void {
    this._selectedType.set(null);
    this._selectedFormat.set(null);
    this._selectedExpert.set(null);
    this._currentSession.set(null);
    this._messages.set([]);
  }
}
