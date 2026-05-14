import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { UiHeaderComponent } from '@app/features/common/components';

@Component({
  selector: 'app-legal-notice',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterLink, UiHeaderComponent],
  template: `
    <div class="legal-container">
      <ui-header title="Mentions légales" [showBack]="true" />

      <main class="legal-content">
        <p class="updated-date">Dernière mise à jour : Mai 2026</p>

        <section class="legal-section">
          <h2>1. Éditeur de l'application</h2>
          <p>
            L'application <strong>RepairFone</strong> est éditée par&nbsp;:
          </p>
          <ul>
            <li><strong>Raison sociale</strong> : RepairFone SARL <em>(à compléter à l'immatriculation)</em></li>
            <li><strong>Forme juridique</strong> : Société à responsabilité limitée</li>
            <li><strong>Siège social</strong> : Abidjan, Côte d'Ivoire</li>
            <li><strong>RCCM</strong> : <em>à renseigner après immatriculation</em></li>
            <li><strong>Contact</strong> : support&#64;repairfone.ci</li>
          </ul>
        </section>

        <section class="legal-section">
          <h2>2. Directeur de la publication</h2>
          <p>
            Le directeur de la publication est le représentant légal de RepairFone SARL.
          </p>
        </section>

        <section class="legal-section">
          <h2>3. Hébergement</h2>
          <p>
            L'application est hébergée sur des serveurs sécurisés. L'identité et les coordonnées
            de l'hébergeur sont communiquées sur demande à&nbsp;<strong>support&#64;repairfone.ci</strong>.
          </p>
        </section>

        <section class="legal-section">
          <h2>4. Propriété intellectuelle</h2>
          <p>
            L'ensemble des éléments composant l'application (textes, images, logos, code, marques)
            sont la propriété exclusive de RepairFone ou de ses partenaires. Toute reproduction,
            représentation, modification ou exploitation, en tout ou partie, est interdite sans
            autorisation écrite préalable.
          </p>
        </section>

        <section class="legal-section">
          <h2>5. Données personnelles</h2>
          <p>
            Le traitement des données personnelles est décrit dans notre
            <a routerLink="/privacy">politique de confidentialité</a>. RepairFone respecte
            la loi ivoirienne n°&nbsp;2013-450 du 19&nbsp;juin&nbsp;2013 relative à la protection
            des données à caractère personnel, ainsi que le Règlement Général sur la Protection
            des Données (RGPD - UE 2016/679) pour les utilisateurs résidant dans l'Union européenne.
          </p>
        </section>

        <section class="legal-section">
          <h2>6. Loi applicable et juridiction</h2>
          <p>
            Les présentes mentions légales sont régies par le droit ivoirien. Tout litige relatif
            à l'utilisation de l'application sera soumis à la compétence exclusive des tribunaux
            d'Abidjan, sauf disposition contraire de la loi.
          </p>
        </section>

        <section class="legal-section">
          <h2>7. Contact</h2>
          <p>
            Pour toute question concernant ces mentions légales&nbsp;:
            <strong>support&#64;repairfone.ci</strong>
          </p>
        </section>
      </main>
    </div>
  `,
  styles: [`
    .legal-container {
      min-height: 100vh;
      background: #f8fafc;
    }

    .legal-content {
      padding: 1.5rem;
      padding-top: calc(var(--header-height, 100px) + 1.5rem);
      max-width: 800px;
      margin: 0 auto;
    }

    .updated-date {
      color: #6B7280;
      font-size: 0.875rem;
      margin-bottom: 2rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid #e2e8f0;
    }

    .legal-section {
      margin-bottom: 2rem;
    }

    .legal-section h2 {
      font-size: 1.125rem;
      font-weight: 600;
      color: #1f2937;
      margin-bottom: 0.75rem;
    }

    .legal-section p {
      color: #4B5563;
      line-height: 1.6;
      margin-bottom: 0.75rem;
    }

    .legal-section ul {
      color: #4B5563;
      line-height: 1.8;
      padding-left: 1.5rem;
      margin: 0.5rem 0;
    }

    .legal-section li {
      margin-bottom: 0.25rem;
    }

    .legal-section strong {
      color: var(--color-primary-500, #FF9800);
    }

    .legal-section a {
      color: var(--color-primary-500, #FF9800);
      text-decoration: underline;
    }
  `],
})
export class LegalNoticeComponent {}
