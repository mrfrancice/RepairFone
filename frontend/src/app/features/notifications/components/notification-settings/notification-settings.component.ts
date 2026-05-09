import { Component, inject, OnInit, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NotificationService, NotificationPreferences, NotificationType } from '../../../../core/services/notification.service';
import { ToastService } from '../../../../core/services/toast.service';
import { UiLoadingComponent } from '../../../../shared/components/ui-loading/ui-loading.component';
import { UiHeaderComponent } from '../../../../shared/components/ui-header/ui-header.component';

interface NotificationCategory {
  title: string;
  types: { type: NotificationType; label: string }[];
}

@Component({
  selector: 'app-notification-settings',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterLink, UiLoadingComponent, UiHeaderComponent],
  template: `
    <div class="notification-settings">
      <ui-header title="Préférences de notification" [showBack]="true" backRoute="/profile" />

      @if (isLoading()) {
        <div class="loading-container">
          <ui-loading size="lg" />
        </div>
      } @else {
        <!-- Push notifications -->
        <section class="section">
          <h2>Notifications push</h2>

          <div class="setting-item">
            <div class="setting-info">
              <span class="icon">🔔</span>
              <div class="text">
                <span class="label">Notifications sur l'appareil</span>
                <span class="description">
                  Recevez des alertes même quand l'app est fermée
                </span>
              </div>
            </div>
            <label class="toggle">
              <input
                type="checkbox"
                [checked]="preferences()?.push"
                (change)="togglePush($event)"
              />
              <span class="slider"></span>
            </label>
          </div>

          @if (!notificationService.pushSupported()) {
            <p class="warning">
              Les notifications push ne sont pas supportées sur cet appareil.
            </p>
          }
        </section>

        <!-- SMS/Email -->
        <section class="section">
          <h2>Canaux de notification</h2>

          <div class="setting-item">
            <div class="setting-info">
              <span class="icon">📱</span>
              <div class="text">
                <span class="label">SMS</span>
                <span class="description">
                  Recevez des SMS pour les notifications importantes
                </span>
              </div>
            </div>
            <label class="toggle">
              <input
                type="checkbox"
                [checked]="preferences()?.sms"
                (change)="updatePreference('sms', $event)"
              />
              <span class="slider"></span>
            </label>
          </div>

          <div class="setting-item">
            <div class="setting-info">
              <span class="icon">📧</span>
              <div class="text">
                <span class="label">Email</span>
                <span class="description">
                  Recevez des emails de résumé
                </span>
              </div>
            </div>
            <label class="toggle">
              <input
                type="checkbox"
                [checked]="preferences()?.email"
                (change)="updatePreference('email', $event)"
              />
              <span class="slider"></span>
            </label>
          </div>
        </section>

        <!-- Notification types -->
        @for (category of categories; track category.title) {
          <section class="section">
            <h2>{{ category.title }}</h2>

            @for (item of category.types; track item.type) {
              <div class="setting-item">
                <div class="setting-info">
                  <span class="icon">{{ notificationService.getTypeIcon(item.type) }}</span>
                  <div class="text">
                    <span class="label">{{ item.label }}</span>
                  </div>
                </div>
                <label class="toggle">
                  <input
                    type="checkbox"
                    [checked]="isTypeEnabled(item.type)"
                    (change)="toggleType(item.type, $event)"
                  />
                  <span class="slider"></span>
                </label>
              </div>
            }
          </section>
        }
      }
    </div>
  `,
  styles: [`
    .notification-settings {
      min-height: 100vh;
      background: #FAFAFA;
      padding-top: var(--header-height, 100px);
      padding-bottom: 2rem;
    }

    .loading-container {
      display: flex;
      justify-content: center;
      padding: 3rem;
    }

    .section {
      background: white;
      margin-top: 1rem;
      padding: 1rem;

      h2 {
        font-size: 0.8125rem;
        font-weight: 600;
        color: #6B7280;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        margin: 0 0 1rem;
      }
    }

    .setting-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.75rem 0;
      border-bottom: 1px solid #f1f5f9;

      &:last-child {
        border-bottom: none;
      }
    }

    .setting-info {
      display: flex;
      align-items: center;
      gap: 0.75rem;

      .icon {
        font-size: 1.25rem;
      }

      .text {
        display: flex;
        flex-direction: column;

        .label {
          font-size: 0.9375rem;
          font-weight: 500;
          color: #1F2937;
        }

        .description {
          font-size: 0.8125rem;
          color: #6B7280;
          margin-top: 0.125rem;
        }
      }
    }

    .toggle {
      position: relative;
      display: inline-block;
      width: 3rem;
      height: 1.75rem;
      flex-shrink: 0;

      input {
        opacity: 0;
        width: 0;
        height: 0;
      }

      .slider {
        position: absolute;
        cursor: pointer;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: #e2e8f0;
        transition: 0.3s;
        border-radius: 9999px;

        &::before {
          position: absolute;
          content: '';
          height: 1.25rem;
          width: 1.25rem;
          left: 0.25rem;
          bottom: 0.25rem;
          background: white;
          transition: 0.3s;
          border-radius: 50%;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
      }

      input:checked + .slider {
        background: var(--color-ocean, #1565C0);
      }

      input:checked + .slider::before {
        transform: translateX(1.25rem);
      }
    }

    .warning {
      font-size: 0.8125rem;
      color: var(--color-mustard, #FFC107);
      margin: 0.5rem 0 0;
      padding: 0.5rem;
      background: #FFF8E1;
      border-radius: 0.375rem;
    }
  `]
})
export class NotificationSettingsComponent implements OnInit {
  readonly notificationService = inject(NotificationService);
  private readonly toast = inject(ToastService);

  preferences = signal<NotificationPreferences | null>(null);
  isLoading = signal(true);

  categories: NotificationCategory[] = [
    {
      title: 'Demandes',
      types: [
        { type: 'request_created', label: 'Nouvelle demande' },
        { type: 'request_accepted', label: 'Demande acceptée' },
        { type: 'request_rejected', label: 'Demande refusée' },
      ],
    },
    {
      title: 'Devis',
      types: [
        { type: 'quote_received', label: 'Devis reçu' },
        { type: 'quote_accepted', label: 'Devis accepté' },
        { type: 'quote_rejected', label: 'Devis refusé' },
      ],
    },
    {
      title: 'Réparations',
      types: [
        { type: 'repair_started', label: 'Réparation commencée' },
        { type: 'repair_completed', label: 'Réparation terminée' },
      ],
    },
    {
      title: 'Paiements',
      types: [
        { type: 'payment_received', label: 'Paiement reçu' },
        { type: 'payment_requested', label: 'Demande de paiement' },
      ],
    },
    {
      title: 'Litiges',
      types: [
        { type: 'dispute_opened', label: 'Litige ouvert' },
        { type: 'dispute_resolved', label: 'Litige résolu' },
      ],
    },
    {
      title: 'Communication',
      types: [
        { type: 'new_message', label: 'Nouveau message' },
        { type: 'new_review', label: 'Nouvel avis' },
      ],
    },
  ];

  async ngOnInit(): Promise<void> {
    await this.loadPreferences();
  }

  private async loadPreferences(): Promise<void> {
    this.isLoading.set(true);

    try {
      const prefs = await this.notificationService.getPreferences();
      this.preferences.set(prefs);
    } catch (err) {
      this.toast.error('Erreur lors du chargement des préférences');
    } finally {
      this.isLoading.set(false);
    }
  }

  async togglePush(event: Event): Promise<void> {
    const checked = (event.target as HTMLInputElement).checked;

    if (checked) {
      const granted = await this.notificationService.requestPushPermission();
      if (granted) {
        await this.savePreference({ push: true });
        this.toast.success('Notifications push activées');
      } else {
        (event.target as HTMLInputElement).checked = false;
        this.toast.error('Permission refusée');
      }
    } else {
      await this.notificationService.unsubscribeFromPush();
      await this.savePreference({ push: false });
      this.toast.info('Notifications push désactivées');
    }
  }

  async updatePreference(key: 'sms' | 'email', event: Event): Promise<void> {
    const checked = (event.target as HTMLInputElement).checked;
    await this.savePreference({ [key]: checked });
  }

  isTypeEnabled(type: NotificationType): boolean {
    const prefs = this.preferences();
    return prefs?.types?.[type] !== false;
  }

  async toggleType(type: NotificationType, event: Event): Promise<void> {
    const checked = (event.target as HTMLInputElement).checked;
    const currentTypes = this.preferences()?.types || {};

    await this.savePreference({
      types: {
        ...currentTypes,
        [type]: checked,
      },
    });
  }

  private async savePreference(update: Partial<NotificationPreferences>): Promise<void> {
    try {
      await this.notificationService.updatePreferences(update);

      this.preferences.update((prefs) =>
        prefs ? { ...prefs, ...update } : null
      );
    } catch (err) {
      this.toast.error('Erreur lors de la sauvegarde');
    }
  }
}
