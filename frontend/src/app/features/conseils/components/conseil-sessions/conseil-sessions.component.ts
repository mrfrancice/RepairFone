import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { ConseilsService, ConseilSession } from '../../services/conseils.service';
import { ConseilsStore } from '../../stores/conseils.store';

@Component({
  selector: 'app-conseil-sessions',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="sessions-container">
      <header class="sessions-header">
        <button class="back-btn" (click)="goBack()">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
        <h1>Mes sessions</h1>
      </header>

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
                    <span class="session-date">{{ formatDate(session.createdAt) }}</span>
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
                      {{ getStatusLabel(session.status) }}
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
      background: #f9fafb;
    }

    .sessions-header {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      padding-top: calc(1rem + env(safe-area-inset-top, 0));
      background: white;
      border-bottom: 1px solid #e5e7eb;
    }

    .back-btn {
      background: none;
      border: none;
      color: #374151;
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      border-radius: 8px;
    }

    .back-btn:hover {
      background: #f3f4f6;
    }

    .sessions-header h1 {
      font-size: 1.25rem;
      font-weight: 600;
      color: #1f2937;
    }

    .tabs-bar {
      display: flex;
      background: white;
      border-bottom: 1px solid #e5e7eb;
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
      color: #7c3aed;
      border-bottom-color: #7c3aed;
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
      border: 3px solid #e5e7eb;
      border-top-color: #7c3aed;
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
      background: linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%);
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
      background: #f3f4f6;
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
      background: #fef3c7;
      color: #92400e;
    }

    .status-badge.accepted,
    .status-badge.in_progress {
      background: #dbeafe;
      color: #1e40af;
    }

    .status-badge.completed {
      background: #d1fae5;
      color: #065f46;
    }

    .status-badge.cancelled {
      background: #fee2e2;
      color: #991b1b;
    }

    .session-price {
      font-weight: 600;
      color: #7c3aed;
    }

    .chevron {
      color: #9ca3af;
      flex-shrink: 0;
      align-self: center;
    }

    .btn {
      padding: 0.75rem 1.5rem;
      border-radius: 8px;
      font-weight: 600;
      font-size: 1rem;
      border: none;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-primary {
      background: #7c3aed;
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

  readonly activeTab = signal<'active' | 'completed'>('active');

  ngOnInit(): void {
    this.loadSessions();
  }

  async loadSessions(): Promise<void> {
    this.store.setIsLoadingSessions(true);
    try {
      const result = await this.conseilsService.getMySessions();
      this.store.setSessions(result.data, result.total);
    } catch (err) {
      console.error('Error loading sessions:', err);
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

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      pending: 'En attente',
      accepted: 'Acceptée',
      in_progress: 'En cours',
      completed: 'Terminée',
      cancelled: 'Annulée',
    };
    return labels[status] || status;
  }

  formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    } else if (days === 1) {
      return 'Hier';
    } else if (days < 7) {
      return date.toLocaleDateString('fr-FR', { weekday: 'short' });
    }
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  }

  goBack(): void {
    this.router.navigate(['/home']);
  }
}
