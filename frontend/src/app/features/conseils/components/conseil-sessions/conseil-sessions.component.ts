import { Component, inject, OnInit, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { ConseilsService, ConseilSession, ConseilsStore } from '@app/domains/conseils';
import { UiErrorStateComponent } from '../../../../shared/components/ui-error-state/ui-error-state.component';
import { FormatDatePipe } from '../../../../shared/pipes/format-date.pipe';
import { StatusLabelsService, SessionStatus } from '../../../../shared/services/status-labels.service';
import { LoggerService } from '../../../../core/services/logger.service';
import { UiHeaderComponent } from '../../../../shared/components/ui-header/ui-header.component';

@Component({
  selector: 'app-conseil-sessions',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterLink, UiErrorStateComponent, FormatDatePipe, UiHeaderComponent],
  template: `
    <div class="sessions-container">
      <ui-header title="Mes sessions" [showBack]="true" (onBack)="goBack()" />

      <!-- Tabs -->
      <div class="tabs-bar">
        <button
          class="tab"
          [class.active]="activeTab() === 'active'"
          (click)="setTab('active')"
        >
          En cours
        </button>
        <button
          class="tab"
          [class.active]="activeTab() === 'completed'"
          (click)="setTab('completed')"
        >
          Terminées
        </button>
      </div>

      <div class="sessions-content">
        @if (store.isLoadingSessions()) {
          <div class="loading-state">
            <div class="spinner"></div>
            <p>Chargement...</p>
          </div>
        } @else if (error()) {
          <ui-error-state
            [message]="error()!"
            severity="error"
            [showRetry]="true"
            (onRetry)="loadSessions()"
          />
        } @else if (filteredSessions().length === 0) {
          <div class="empty-state">
            <span class="empty-icon">💬</span>
            <h3>Aucune session</h3>
            <p>
              @if (activeTab() === 'active') {
                Vous n'avez pas de session en cours
              } @else {
                Vous n'avez pas encore terminé de session
              }
            </p>
            <button class="btn btn-primary" routerLink="/conseils">
              Demander un conseil
            </button>
          </div>
        } @else {
          <div class="sessions-list">
            @for (session of filteredSessions(); track session.id) {
              <div class="session-card" (click)="openSession(session)">
                <div class="expert-avatar">
                  @if (session.expert?.avatarUrl) {
                    <img [src]="session.expert?.avatarUrl" [alt]="session.expert?.firstName" />
                  } @else {
                    <div class="avatar-placeholder">
                      {{ getExpertInitials(session) }}
                    </div>
                  }
                </div>

                <div class="session-info">
                  <div class="session-header">
                    <span class="expert-name">
                      {{ session.expert?.firstName }} {{ session.expert?.lastName }}
                    </span>
                    <span class="session-date">{{ session.createdAt | formatDate }}</span>
                  </div>

                  <div class="session-type">
                    <span class="type-icon">{{ getTypeIcon(session.type) }}</span>
                    <span>{{ getTypeLabel(session.type) }}</span>
                    <span class="format-badge">{{ getFormatLabel(session.format) }}</span>
                  </div>

                  @if (session.subject) {
                    <p class="session-subject">{{ session.subject }}</p>
                  }

                  <div class="session-footer">
                    <span class="status-badge" [class]="session.status">
                      {{ statusLabels.getSessionStatusLabel($any(session.status)) }}
                    </span>
                    <span class="session-price">{{ session.price | number }} FCFA</span>
                  </div>
                </div>

                <svg class="chevron" width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M7.5 15L12.5 10L7.5 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
            }
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .sessions-container {
      min-height: 100vh;
      background: #FAFAFA;
      padding-top: var(--header-height, 100px);
    }

    .tabs-bar {
      display: flex;
      background: white;
      border-bottom: 1px solid #EEEEEE;
    }

    .tab {
      flex: 1;
      padding: 0.875rem;
      background: none;
      border: none;
      border-bottom: 2px solid transparent;
      font-size: 0.875rem;
      font-weight: 500;
      color: #6b7280;
      cursor: pointer;
      transition: all 0.2s;
    }

    .tab.active {
      color: var(--color-primary-500, #FF9800);
      border-bottom-color: var(--color-primary-500, #FF9800);
    }

    .sessions-content {
      padding: 1rem;
    }

    .loading-state, .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 3rem 1rem;
      text-align: center;
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 3px solid #EEEEEE;
      border-top-color: var(--color-primary-500, #FF9800);
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-bottom: 1rem;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .empty-icon {
      font-size: 3rem;
      margin-bottom: 1rem;
    }

    .empty-state h3 {
      font-size: 1.25rem;
      font-weight: 600;
      color: #1f2937;
      margin-bottom: 0.5rem;
    }

    .empty-state p {
      color: #6b7280;
      margin-bottom: 1.5rem;
    }

    .sessions-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .session-card {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      background: white;
      border-radius: 16px;
      padding: 1rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      cursor: pointer;
      transition: all 0.2s;
    }

    .session-card:hover {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    .expert-avatar img,
    .avatar-placeholder {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      object-fit: cover;
    }

    .avatar-placeholder {
      background: linear-gradient(135deg, var(--color-primary-500, #FF9800) 0%, var(--color-gold-800, #F9A825) 100%);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
    }

    .session-info {
      flex: 1;
      min-width: 0;
    }

    .session-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 0.25rem;
    }

    .expert-name {
      font-weight: 600;
      color: #1f2937;
    }

    .session-date {
      font-size: 0.75rem;
      color: #9ca3af;
    }

    .session-type {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      font-size: 0.875rem;
      color: #6b7280;
      margin-bottom: 0.5rem;
    }

    .type-icon {
      font-size: 1rem;
    }

    .format-badge {
      background: #F5F5F5;
      padding: 0.125rem 0.5rem;
      border-radius: 4px;
      font-size: 0.75rem;
    }

    .session-subject {
      font-size: 0.875rem;
      color: #4b5563;
      margin: 0;
      margin-bottom: 0.5rem;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .session-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .status-badge {
      font-size: 0.75rem;
      font-weight: 500;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
    }

    .status-badge.pending {
      background: #FFF8E1;
      color: #92400e;
    }

    .status-badge.accepted,
    .status-badge.in_progress {
      background: #E3F2FD;
      color: var(--color-ocean, #1565C0);
    }

    .status-badge.completed {
      background: #E8F5E9;
      color: #065f46;
    }

    .status-badge.cancelled {
      background: #FFEBEE;
      color: #991b1b;
    }

    .session-price {
      font-weight: 600;
      color: var(--color-primary-500, #FF9800);
    }

    .chevron {
      color: #9ca3af;
      flex-shrink: 0;
      align-self: center;
    }

    .btn {
      padding: 0.75rem 1.5rem;
      border-radius: 12px;
      font-weight: 600;
      font-size: 1rem;
      border: none;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-primary {
      background: var(--color-primary-500, #FF9800);
      color: white;
    }

    .btn-primary:hover {
      background: #6d28d9;
    }
  `],
})
export class ConseilSessionsComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly conseilsService = inject(ConseilsService);
  readonly store = inject(ConseilsStore);
  readonly statusLabels = inject(StatusLabelsService);
  private readonly logger = inject(LoggerService);

  readonly activeTab = signal<'active' | 'completed'>('active');
  readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.loadSessions();
  }

  async loadSessions(): Promise<void> {
    this.store.setIsLoadingSessions(true);
    this.error.set(null);
    try {
      const result = await this.conseilsService.getMySessions();
      this.store.setSessions(result.data, result.total);
    } catch (err: any) {
      this.logger.error('ConseilSessionsComponent', 'Error loading sessions', err);
      this.error.set(err.message || 'Impossible de charger les sessions');
    } finally {
      this.store.setIsLoadingSessions(false);
    }
  }

  setTab(tab: 'active' | 'completed'): void {
    this.activeTab.set(tab);
  }

  filteredSessions(): ConseilSession[] {
    const sessions = this.store.sessions();
    if (this.activeTab() === 'active') {
      return sessions.filter((s) =>
        ['pending', 'accepted', 'in_progress'].includes(s.status)
      );
    }
    return sessions.filter((s) =>
      ['completed', 'cancelled'].includes(s.status)
    );
  }

  openSession(session: ConseilSession): void {
    this.store.setCurrentSession(session);
    this.router.navigate(['/conseils/chat', session.id]);
  }

  getExpertInitials(session: ConseilSession): string {
    if (session.expert) {
      return `${session.expert.firstName[0]}${session.expert.lastName[0]}`.toUpperCase();
    }
    return 'E';
  }

  getTypeIcon(type: string): string {
    const icons: Record<string, string> = {
      diagnostic: '🔍',
      software: '💻',
      purchase: '🛒',
      maintenance: '🛠️',
    };
    return icons[type] || '💬';
  }

  getTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      diagnostic: 'Diagnostic',
      software: 'Logiciel',
      purchase: 'Achat',
      maintenance: 'Entretien',
    };
    return labels[type] || type;
  }

  getFormatLabel(format: string): string {
    const labels: Record<string, string> = {
      chat: 'Chat',
      call: 'Appel',
    };
    return labels[format] || format;
  }

  goBack(): void {
    this.router.navigate(['/home']);
  }
}
