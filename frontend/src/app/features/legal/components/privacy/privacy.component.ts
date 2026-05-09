import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UiHeaderComponent } from '../../../../shared/components/ui-header/ui-header.component';

@Component({
  selector: 'app-privacy',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, UiHeaderComponent],
  template: `
    <div class="legal-container">
      <ui-header title="Politique de confidentialité" [showBack]="true" />

      <main class="legal-content">
        <p class="updated-date">Dernière mise à jour : Mai 2026</p>

        <section class="legal-section">
          <h2>1. Introduction</h2>
          <p>
            Chez RepairFone, nous accordons une grande importance à la protection de vos données
            personnelles. Cette politique explique comment nous collectons, utilisons et protégeons
            vos informations.
          </p>
        </section>

        <section class="legal-section">
          <h2>2. Données collectées</h2>
          <p>Nous collectons les données suivantes :</p>
          <ul>
            <li><strong>Informations d'identité :</strong> nom, prénom, numéro de téléphone</li>
            <li><strong>Données de localisation :</strong> adresse, position géographique (avec votre consentement)</li>
            <li><strong>Données de transaction :</strong> historique des demandes et paiements</li>
            <li><strong>Données techniques :</strong> type d'appareil, système d'exploitation</li>
            <li><strong>Communications :</strong> messages échangés sur la plateforme</li>
          </ul>
        </section>

        <section class="legal-section">
          <h2>3. Utilisation des données</h2>
          <p>Vos données sont utilisées pour :</p>
          <ul>
            <li>Fournir et améliorer nos services</li>
            <li>Mettre en relation clients et réparateurs</li>
            <li>Traiter les paiements</li>
            <li>Envoyer des notifications relatives au service</li>
            <li>Prévenir la fraude et assurer la sécurité</li>
            <li>Répondre à vos demandes d'assistance</li>
          </ul>
        </section>

        <section class="legal-section">
          <h2>4. Partage des données</h2>
          <p>Vos données peuvent être partagées avec :</p>
          <ul>
            <li>Les réparateurs (pour les demandes de réparation)</li>
            <li>Les prestataires de paiement</li>
            <li>Les autorités compétentes (si requis par la loi)</li>
          </ul>
          <p>
            Nous ne vendons jamais vos données personnelles à des tiers.
          </p>
        </section>

        <section class="legal-section">
          <h2>5. Sécurité des données</h2>
          <p>
            Nous mettons en œuvre des mesures de sécurité techniques et organisationnelles
            pour protéger vos données contre tout accès non autorisé, perte ou modification.
          </p>
          <ul>
            <li>Chiffrement des données sensibles</li>
            <li>Authentification sécurisée par OTP</li>
            <li>Serveurs sécurisés</li>
            <li>Accès restreint aux données</li>
          </ul>
        </section>

        <section class="legal-section">
          <h2>6. Conservation des données</h2>
          <p>
            Vos données sont conservées pendant la durée nécessaire aux finalités pour lesquelles
            elles ont été collectées, et conformément aux obligations légales applicables.
          </p>
        </section>

        <section class="legal-section">
          <h2>7. Vos droits</h2>
          <p>Vous disposez des droits suivants :</p>
          <ul>
            <li><strong>Droit d'accès :</strong> consulter vos données personnelles</li>
            <li><strong>Droit de rectification :</strong> corriger vos données inexactes</li>
            <li><strong>Droit à l'effacement :</strong> demander la suppression de vos données</li>
            <li><strong>Droit à la portabilité :</strong> recevoir vos données dans un format standard</li>
            <li><strong>Droit d'opposition :</strong> vous opposer à certains traitements</li>
          </ul>
          <p>
            Pour exercer ces droits, contactez-nous à <strong>privacy&#64;repairfone.com</strong>
          </p>
        </section>

        <section class="legal-section">
          <h2>8. Cookies et technologies similaires</h2>
          <p>
            L'application peut utiliser des cookies et des technologies similaires pour améliorer
            votre expérience et analyser l'utilisation du service.
          </p>
        </section>

        <section class="legal-section">
          <h2>9. Modifications</h2>
          <p>
            Nous pouvons mettre à jour cette politique périodiquement. Vous serez informé
            de tout changement significatif.
          </p>
        </section>

        <section class="legal-section">
          <h2>10. Contact</h2>
          <p>
            Pour toute question concernant cette politique de confidentialité, contactez notre
            Délégué à la Protection des Données :
          </p>
          <p>
            <strong>privacy&#64;repairfone.com</strong>
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
  `],
})
export class PrivacyComponent {}
