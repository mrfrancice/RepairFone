import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UiHeaderComponent } from '@app/features/common/components';

@Component({
  selector: 'app-terms',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, UiHeaderComponent],
  template: `
    <div class="legal-container">
      <ui-header title="Conditions d'utilisation" [showBack]="true" />

      <main class="legal-content">
        <p class="updated-date">Dernière mise à jour : Mai 2026</p>

        <section class="legal-section">
          <h2>1. Acceptation des conditions</h2>
          <p>
            En utilisant l'application RepairFone, vous acceptez les présentes conditions d'utilisation.
            Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser l'application.
          </p>
        </section>

        <section class="legal-section">
          <h2>2. Description du service</h2>
          <p>
            RepairFone est une plateforme de mise en relation entre les particuliers ayant besoin
            de réparations de leurs appareils électroniques et les réparateurs professionnels.
          </p>
          <p>
            Notre rôle est limité à la mise en relation. Nous ne sommes pas partie aux contrats
            conclus entre les clients et les réparateurs.
          </p>
        </section>

        <section class="legal-section">
          <h2>3. Inscription et compte</h2>
          <ul>
            <li>Vous devez fournir des informations exactes lors de l'inscription</li>
            <li>Vous êtes responsable de la confidentialité de votre compte</li>
            <li>Vous devez avoir au moins 18 ans pour utiliser le service</li>
            <li>Un seul compte par personne est autorisé</li>
          </ul>
        </section>

        <section class="legal-section">
          <h2>4. Obligations des utilisateurs</h2>
          <h3>Pour les clients :</h3>
          <ul>
            <li>Décrire honnêtement les pannes et problèmes</li>
            <li>Respecter les rendez-vous pris avec les réparateurs</li>
            <li>Effectuer les paiements convenus</li>
          </ul>
          <h3>Pour les réparateurs :</h3>
          <ul>
            <li>Disposer des compétences et autorisations nécessaires</li>
            <li>Fournir des devis honnêtes et transparents</li>
            <li>Respecter les délais annoncés</li>
            <li>Garantir la qualité des réparations</li>
          </ul>
        </section>

        <section class="legal-section">
          <h2>5. Paiements et commissions</h2>
          <p>
            Les paiements sont effectués via les moyens de paiement proposés dans l'application.
            RepairFone prélève une commission sur chaque transaction réussie.
          </p>
        </section>

        <section class="legal-section">
          <h2>6. Responsabilités</h2>
          <p>
            RepairFone ne peut être tenu responsable des litiges entre clients et réparateurs.
            Nous proposons cependant un système de médiation pour aider à résoudre les conflits.
          </p>
        </section>

        <section class="legal-section">
          <h2>7. Propriété intellectuelle</h2>
          <p>
            L'ensemble du contenu de l'application (logos, textes, images) est protégé par
            les droits de propriété intellectuelle. Toute reproduction est interdite sans
            autorisation préalable.
          </p>
        </section>

        <section class="legal-section">
          <h2>8. Modification des conditions</h2>
          <p>
            Nous nous réservons le droit de modifier ces conditions à tout moment.
            Les utilisateurs seront informés des modifications significatives.
          </p>
        </section>

        <section class="legal-section">
          <h2>9. Contact</h2>
          <p>
            Pour toute question concernant ces conditions, contactez-nous à :
            <strong>support&#64;repairfone.com</strong>
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

    .legal-section h3 {
      font-size: 1rem;
      font-weight: 500;
      color: #374151;
      margin: 1rem 0 0.5rem;
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
export class TermsComponent {}
