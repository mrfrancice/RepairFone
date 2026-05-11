import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { UiHeaderComponent } from '../../../../shared/components/ui-header/ui-header.component';

@Component({
  selector: 'app-repairer-terms',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterLink, UiHeaderComponent],
  template: `
    <div class="legal-container">
      <ui-header title="Charte des réparateurs" [showBack]="true" />

      <main class="legal-content">
        <p class="updated-date">Dernière mise à jour : Mai 2026</p>

        <section class="legal-section">
          <h2>1. Objet</h2>
          <p>
            La présente charte définit les engagements que prend tout réparateur en s'inscrivant
            sur RepairFone. Elle complète les
            <a routerLink="/terms">conditions générales d'utilisation</a> et la
            <a routerLink="/privacy">politique de confidentialité</a>.
          </p>
        </section>

        <section class="legal-section">
          <h2>2. Conditions d'éligibilité</h2>
          <ul>
            <li>Être majeur et titulaire d'une pièce d'identité valide</li>
            <li>Disposer des compétences techniques requises pour les réparations annoncées</li>
            <li>Justifier le cas échéant d'une immatriculation au RCCM ou d'un statut d'auto-entrepreneur</li>
            <li>Fournir des informations exactes lors de l'inscription (identité, coordonnées, qualifications)</li>
          </ul>
        </section>

        <section class="legal-section">
          <h2>3. Engagements qualité</h2>
          <ul>
            <li><strong>Devis honnête</strong> : prix et délais réalistes, sans surfacturation ni piège</li>
            <li><strong>Diagnostic transparent</strong> : informer le client de la nature exacte de la panne</li>
            <li><strong>Pièces conformes</strong> : utiliser des pièces neuves ou d'occasion explicitement déclarées</li>
            <li><strong>Garantie</strong> : assurer une garantie minimale de 30&nbsp;jours sur les réparations effectuées</li>
            <li><strong>Respect des délais</strong> : prévenir le client en cas de retard, sans excès</li>
          </ul>
        </section>

        <section class="legal-section">
          <h2>4. Comportement professionnel</h2>
          <ul>
            <li>Courtoisie et respect dans les échanges (chat, appels, rendez-vous)</li>
            <li>Confidentialité des données personnelles du client (contacts, contenus de l'appareil)</li>
            <li>Interdiction de contourner la plateforme pour la conclusion d'une réparation initiée via RepairFone</li>
            <li>Interdiction de toute pratique discriminatoire (origine, genre, religion, etc.)</li>
          </ul>
        </section>

        <section class="legal-section">
          <h2>5. Système d'avis</h2>
          <p>
            Les clients peuvent évaluer chaque réparation. Toute tentative de manipulation
            des avis (faux comptes, échanges contre cadeaux, pression sur le client) entraîne
            une suspension immédiate.
          </p>
        </section>

        <section class="legal-section">
          <h2>6. Litiges</h2>
          <p>
            En cas de désaccord, le réparateur s'engage à privilégier le dialogue avec le client
            via le système de litiges interne. RepairFone propose une médiation et peut, le cas
            échéant, statuer en faveur du client après examen des éléments fournis.
          </p>
        </section>

        <section class="legal-section">
          <h2>7. Commission</h2>
          <p>
            RepairFone prélève une commission sur chaque transaction réussie, dont le taux est
            indiqué au moment de la facturation. Cette commission rémunère la mise en relation,
            la médiation, le support et l'hébergement.
          </p>
        </section>

        <section class="legal-section">
          <h2>8. Sanctions</h2>
          <p>
            Le non-respect de la présente charte peut entraîner&nbsp;:
          </p>
          <ul>
            <li>Un avertissement</li>
            <li>Une suspension temporaire du compte</li>
            <li>La résiliation définitive du compte avec confiscation des sommes en attente
              en cas de fraude avérée</li>
          </ul>
        </section>

        <section class="legal-section">
          <h2>9. Modifications</h2>
          <p>
            RepairFone peut faire évoluer cette charte. Les réparateurs sont informés des
            modifications significatives via l'application et disposent de 30&nbsp;jours pour
            les accepter ou clôturer leur compte.
          </p>
        </section>

        <section class="legal-section">
          <h2>10. Contact</h2>
          <p>
            Pour toute question relative à cette charte&nbsp;:
            <strong>repairer-support&#64;repairfone.ci</strong>
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
export class RepairerTermsComponent {}
