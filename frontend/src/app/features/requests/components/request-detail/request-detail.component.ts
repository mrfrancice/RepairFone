import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { RequestsService, RepairRequest, RequestStatus, UpdateStatusDto } from '../../services/requests.service';
import { ReviewsService } from '../../../reviews/services/reviews.service';
import { QuotesService, Quote, QuotePart } from '../../../quotes/services/quotes.service';
import { AuthStore } from '../../../../core/stores/auth.store';
import { UiHeaderComponent } from '../../../../shared/components/ui-header/ui-header.component';

// Interface pour les étapes du timeline
interface TimelineStep {
  id: string;
  status: string;
  label: string;
  description?: string;
  date: string;
  icon: string;
  isActive: boolean;
  isCompleted: boolean;
  isPending: boolean;
}

@Component({
  selector: 'app-request-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, UiHeaderComponent],
  template: `
    <div class="detail-container">
      @if (isLoading()) {
        <div class="loading-state">
          <div class="spinner"></div>
          <p>Chargement...</p>
        </div>
      } @else if (request()) {
        <!-- Header avec gradient orange -->
        <ui-header
          [title]="request()?.device?.brand + ' ' + request()?.device?.model"
          [subtitle]="request()?.serviceType?.name"
          [showBack]="true"
          backRoute="/requests"
        >
          <div header-actions class="status-badge" [class]="'status-' + request()!.status">
            {{ requestsService.getStatusLabel(request()!.status) }}
          </div>
        </ui-header>

        <div class="detail-content">
          <!-- Prix et Durée -->
          @if (request()?.estimatedPrice || request()?.estimatedDuration) {
            <div class="price-duration-card">
              @if (request()?.estimatedPrice) {
                <div class="price-item">
                  <div class="price-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <line x1="12" y1="1" x2="12" y2="23"/>
                      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                    </svg>
                  </div>
                  <div class="price-details">
                    <span class="price-label">Prix estimé</span>
                    <span class="price-value">{{ request()?.estimatedPrice | number }} FCFA</span>
                  </div>
                </div>
              }
              @if (request()?.estimatedDuration) {
                <div class="price-item">
                  <div class="price-icon icon-blue">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <circle cx="12" cy="12" r="10"/>
                      <polyline points="12 6 12 12 16 14"/>
                    </svg>
                  </div>
                  <div class="price-details">
                    <span class="price-label">Durée estimée</span>
                    <span class="price-value">{{ request()?.estimatedDuration }} min</span>
                  </div>
                </div>
              }
            </div>
          }

          <!-- Description -->
          @if (request()?.description) {
            <section class="section">
              <h2>
                <div class="section-icon-wrapper">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                    <line x1="16" y1="13" x2="8" y2="13"/>
                    <line x1="16" y1="17" x2="8" y2="17"/>
                  </svg>
                </div>
                Description du problème
              </h2>
              <p class="description-text">{{ request()?.description }}</p>
            </section>
          }

          <!-- Contact Info -->
          <section class="section">
            <h2>
              <div class="section-icon-wrapper icon-blue">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
              </div>
              {{ isClient() ? 'Réparateur' : 'Client' }}
            </h2>
            @if (isClient()) {
              <div class="contact-card">
                <div class="contact-avatar">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                    <polyline points="9 22 9 12 15 12 15 22"/>
                  </svg>
                </div>
                <div class="contact-info">
                  <div class="contact-name">
                    {{ request()?.repairer?.repairerProfile?.businessName ||
                       (request()?.repairer?.firstName + ' ' + request()?.repairer?.lastName) }}
                  </div>
                  <a [href]="'tel:+225' + request()?.repairer?.phone" class="contact-phone">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                    </svg>
                    +225 {{ request()?.repairer?.phone }}
                  </a>
                </div>
                <a [href]="'tel:+225' + request()?.repairer?.phone" class="call-btn">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                  </svg>
                </a>
              </div>
            } @else {
              <div class="contact-card">
                <div class="contact-avatar client">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                </div>
                <div class="contact-info">
                  <div class="contact-name">
                    {{ request()?.client?.firstName }} {{ request()?.client?.lastName }}
                  </div>
                  <a [href]="'tel:+225' + request()?.client?.phone" class="contact-phone">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                    </svg>
                    +225 {{ request()?.client?.phone }}
                  </a>
                  @if (request()?.clientAddress) {
                    <div class="contact-address">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                        <circle cx="12" cy="10" r="3"/>
                      </svg>
                      {{ request()?.clientAddress }}
                    </div>
                  }
                </div>
                <a [href]="'tel:+225' + request()?.client?.phone" class="call-btn">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                  </svg>
                </a>
              </div>
            }
          </section>

          <!-- Section Devis -->
          @if (quote()) {
            <section class="section quote-section">
              <h2>
                <div class="section-icon-wrapper icon-green">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                    <line x1="16" y1="13" x2="8" y2="13"/>
                    <line x1="16" y1="17" x2="8" y2="17"/>
                  </svg>
                </div>
                Devis
                <span class="quote-status-badge" [class]="'quote-status-' + quote()!.status">
                  {{ quotesService.getStatusLabel(quote()!.status) }}
                </span>
              </h2>

              <div class="quote-details">
                <div class="quote-row">
                  <span class="quote-label">Main d'œuvre</span>
                  <span class="quote-value">{{ quote()!.laborCost | number }} FCFA</span>
                </div>
                @if (quote()!.parts && quote()!.parts.length > 0) {
                  <div class="quote-parts">
                    <span class="quote-label">Pièces détachées</span>
                    @for (part of quote()!.parts; track $index) {
                      <div class="quote-part-item">
                        <span>{{ part.name }} x{{ part.quantity }}</span>
                        <span>{{ part.price * part.quantity | number }} FCFA</span>
                      </div>
                    }
                  </div>
                }
                @if (quote()!.partsCost > 0) {
                  <div class="quote-row">
                    <span class="quote-label">Total pièces</span>
                    <span class="quote-value">{{ quote()!.partsCost | number }} FCFA</span>
                  </div>
                }
                <div class="quote-row quote-total">
                  <span class="quote-label">Total</span>
                  <span class="quote-value">{{ quote()!.totalAmount | number }} FCFA</span>
                </div>
                <div class="quote-row">
                  <span class="quote-label">Durée estimée</span>
                  <span class="quote-value">{{ quote()!.estimatedDuration }}</span>
                </div>
                @if (quote()!.notes) {
                  <div class="quote-notes">
                    <span class="quote-label">Notes</span>
                    <p>{{ quote()!.notes }}</p>
                  </div>
                }
                <div class="quote-row quote-expiry">
                  <span class="quote-label">Validité</span>
                  @if (isQuoteExpired()) {
                    <span class="quote-value text-red">Expiré</span>
                  } @else {
                    <span class="quote-value">{{ getQuoteDaysRemaining() }} jour(s) restant(s)</span>
                  }
                </div>
              </div>

              <!-- Actions Client sur le devis -->
              @if (isClient() && quote()!.status === 'pending' && !isQuoteExpired()) {
                <div class="quote-actions">
                  @if (quoteError()) {
                    <div class="alert alert-error">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="15" y1="9" x2="9" y2="15"/>
                        <line x1="9" y1="9" x2="15" y2="15"/>
                      </svg>
                      {{ quoteError() }}
                    </div>
                  }
                  <div class="action-buttons">
                    <button
                      class="btn btn-success"
                      (click)="acceptQuote()"
                      [disabled]="isUpdating()"
                    >
                      @if (isUpdating()) {
                        <span class="spinner-small"></span>
                      } @else {
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      }
                      Accepter le devis
                    </button>
                    <button
                      class="btn btn-danger"
                      (click)="openRejectQuoteModal()"
                      [disabled]="isUpdating()"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"/>
                        <line x1="6" y1="6" x2="18" y2="18"/>
                      </svg>
                      Refuser
                    </button>
                  </div>
                </div>
              }

              @if (quote()!.status === 'accepted') {
                <div class="quote-accepted-message">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                    <polyline points="22 4 12 14.01 9 11.01"/>
                  </svg>
                  <span>Devis accepté - La réparation peut commencer</span>
                </div>
              }

              @if (quote()!.status === 'rejected') {
                <div class="quote-rejected-message">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="15" y1="9" x2="9" y2="15"/>
                    <line x1="9" y1="9" x2="15" y2="15"/>
                  </svg>
                  <span>Devis refusé - En attente d'une nouvelle proposition</span>
                  @if (quote()!.clientProposedPrice) {
                    <span class="client-proposal">
                      Votre contre-proposition: {{ quote()!.clientProposedPrice | number }} FCFA
                    </span>
                  }
                </div>
                @if (quote()!.rejectionReason) {
                  <p class="rejection-detail">{{ quote()!.rejectionReason }}</p>
                }
                <!-- Option pour le client d'annuler la négociation -->
                @if (isClient()) {
                  <div class="negotiation-client-actions">
                    <p class="waiting-message">Le réparateur peut accepter votre contre-proposition ou faire une nouvelle offre.</p>
                    <button class="btn btn-outline-danger btn-sm" (click)="cancelNegotiation()" [disabled]="isUpdating()">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="15" y1="9" x2="9" y2="15"/>
                        <line x1="9" y1="9" x2="15" y2="15"/>
                      </svg>
                      Annuler et chercher un autre réparateur
                    </button>
                    @if (quoteError()) {
                      <div class="alert alert-danger">{{ quoteError() }}</div>
                    }
                  </div>
                }
              }
            </section>
          }

          <!-- Historique des négociations -->
          @if (quoteHistory().length > 1) {
            <section class="section quote-history-section">
              <h2>
                <div class="section-icon-wrapper icon-gray">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="12 6 12 12 16 14"/>
                  </svg>
                </div>
                Historique des négociations ({{ quoteHistory().length }})
              </h2>

              <div class="quote-history-list">
                @for (historyQuote of quoteHistory(); track historyQuote.id; let i = $index) {
                  <div class="quote-history-item" [class.current]="i === 0">
                    <div class="history-header">
                      <span class="history-number">Devis #{{ quoteHistory().length - i }}</span>
                      <span class="history-date">{{ formatDateTime(historyQuote.createdAt) }}</span>
                      <span class="history-status" [class]="'status-' + historyQuote.status">
                        {{ quotesService.getStatusLabel(historyQuote.status) }}
                      </span>
                    </div>
                    <div class="history-details">
                      <div class="history-price">
                        <span class="price-label">Montant proposé:</span>
                        <span class="price-value">{{ historyQuote.totalAmount | number }} FCFA</span>
                      </div>
                      @if (historyQuote.status === 'rejected' && historyQuote.clientProposedPrice) {
                        <div class="history-counter-proposal">
                          <span class="price-label">Contre-proposition client:</span>
                          <span class="price-value counter">{{ historyQuote.clientProposedPrice | number }} FCFA</span>
                        </div>
                      }
                      @if (historyQuote.status === 'rejected' && historyQuote.rejectionReason) {
                        <p class="history-reason">{{ historyQuote.rejectionReason }}</p>
                      }
                    </div>
                  </div>
                }
              </div>
            </section>
          }

          <!-- Bouton Créer un devis (Réparateur, demande acceptée, pas de devis OU devis rejeté) -->
          @if (isRepairer() && request()?.status === 'accepted' && (!quote() || quote()?.status === 'rejected')) {
            <section class="section actions-section" [class.actions-negotiation]="quote()?.status === 'rejected'">
              <h2>
                <div class="section-icon-wrapper" [class.icon-green]="!quote()" [class.icon-orange]="quote()?.status === 'rejected'">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                    <line x1="12" y1="11" x2="12" y2="17"/>
                    <line x1="9" y1="14" x2="15" y2="14"/>
                  </svg>
                </div>
                {{ quote()?.status === 'rejected' ? 'Négociation en cours' : 'Créer un devis' }}
              </h2>
              @if (quote()?.status === 'rejected') {
                <p class="action-hint negotiation-hint">
                  Le client a refusé votre devis précédent.
                  @if (quote()?.clientProposedPrice) {
                    Il propose <strong>{{ quote()!.clientProposedPrice | number }} FCFA</strong>.
                  }
                </p>

                <!-- Actions pour contre-proposition -->
                @if (quote()?.clientProposedPrice) {
                  <div class="negotiation-actions">
                    <button class="btn btn-success" (click)="acceptCounterProposal()" [disabled]="isUpdating()">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                      Accepter {{ quote()!.clientProposedPrice | number }} FCFA
                    </button>
                    <a class="btn btn-primary" [routerLink]="['/repairer/quotes/new']" [queryParams]="{requestId: request()?.id}">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="12" y1="5" x2="12" y2="19"/>
                        <line x1="5" y1="12" x2="19" y2="12"/>
                      </svg>
                      Faire une contre-offre
                    </a>
                    <button class="btn btn-outline-danger" (click)="cancelNegotiation()" [disabled]="isUpdating()">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="15" y1="9" x2="9" y2="15"/>
                        <line x1="9" y1="9" x2="15" y2="15"/>
                      </svg>
                      Annuler la négociation
                    </button>
                  </div>
                } @else {
                  <div class="negotiation-actions">
                    <a class="btn btn-primary btn-block" [routerLink]="['/repairer/quotes/new']" [queryParams]="{requestId: request()?.id}">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="12" y1="5" x2="12" y2="19"/>
                        <line x1="5" y1="12" x2="19" y2="12"/>
                      </svg>
                      Créer une nouvelle proposition
                    </a>
                    <button class="btn btn-outline-danger" (click)="cancelNegotiation()" [disabled]="isUpdating()">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="15" y1="9" x2="9" y2="15"/>
                        <line x1="9" y1="9" x2="15" y2="15"/>
                      </svg>
                      Annuler la négociation
                    </button>
                  </div>
                }
                @if (quoteError()) {
                  <div class="alert alert-danger">{{ quoteError() }}</div>
                }
              } @else {
                <p class="action-hint">Établissez un devis détaillé pour cette réparation. Le client pourra l'accepter ou le refuser.</p>
                <a class="btn btn-primary btn-block" [routerLink]="['/repairer/quotes/new']" [queryParams]="{requestId: request()?.id}">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="12" y1="5" x2="12" y2="19"/>
                    <line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                  Créer le devis
                </a>
              }
            </section>
          }

          <!-- Motif de rejet (si rejeté) -->
          @if (request()?.status === 'rejected' && request()?.rejectionReason) {
            <section class="section rejection-section">
              <h2>
                <div class="section-icon-wrapper icon-red">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="15" y1="9" x2="9" y2="15"/>
                    <line x1="9" y1="9" x2="15" y2="15"/>
                  </svg>
                </div>
                Motif du rejet
              </h2>
              <p class="rejection-reason">{{ request()?.rejectionReason }}</p>
            </section>
          }

          <!-- Timeline du workflow -->
          <section class="section workflow-section">
            <h2>
              <div class="section-icon-wrapper icon-purple">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12 6 12 12 16 14"/>
                </svg>
              </div>
              Suivi de la demande
            </h2>
            <div class="workflow-timeline">
              @for (step of combinedTimeline(); track step.id; let last = $last) {
                <div class="workflow-step"
                     [class.completed]="step.isCompleted"
                     [class.active]="step.isActive"
                     [class.pending]="step.isPending">
                  <div class="step-indicator">
                    <div class="step-icon">
                      @if (step.isCompleted) {
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      } @else {
                        <span class="step-emoji">{{ step.icon }}</span>
                      }
                    </div>
                    @if (!last) {
                      <div class="step-connector"></div>
                    }
                  </div>
                  <div class="step-content">
                    <div class="step-label">{{ step.label }}</div>
                    @if (step.description) {
                      <div class="step-description">{{ step.description }}</div>
                    }
                    @if (step.date && (step.isCompleted || step.isActive)) {
                      <div class="step-date">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                          <line x1="16" y1="2" x2="16" y2="6"/>
                          <line x1="8" y1="2" x2="8" y2="6"/>
                          <line x1="3" y1="10" x2="21" y2="10"/>
                        </svg>
                        {{ formatDateTime(step.date) }}
                      </div>
                    }
                  </div>
                </div>
              }
            </div>
          </section>

          <!-- Actions Réparateur - Pending -->
          @if (isRepairer() && request()?.status === 'pending') {
            <section class="section actions-section">
              <h2>
                <div class="section-icon-wrapper icon-green">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="9 11 12 14 22 4"/>
                    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
                  </svg>
                </div>
                Actions
              </h2>

              @if (error()) {
                <div class="alert alert-error">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="15" y1="9" x2="9" y2="15"/>
                    <line x1="9" y1="9" x2="15" y2="15"/>
                  </svg>
                  {{ error() }}
                </div>
              }

              <div class="action-buttons">
                <button
                  class="btn btn-success"
                  (click)="acceptRequest()"
                  [disabled]="isUpdating()"
                >
                  @if (isUpdating()) {
                    <span class="spinner-small"></span>
                  } @else {
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  }
                  Accepter
                </button>
                <button
                  class="btn btn-danger"
                  (click)="openRejectModal()"
                  [disabled]="isUpdating()"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                  Rejeter
                </button>
              </div>
            </section>
          }

          <!-- Actions Réparateur - Accepted (Marquer comme terminée) - Visible seulement si le devis est accepté -->
          @if (isRepairer() && request()?.status === 'accepted' && quote()?.status === 'accepted') {
            <section class="section actions-section actions-purple">
              <h2>
                <div class="section-icon-wrapper icon-purple">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
                  </svg>
                </div>
                Réparation en cours
              </h2>

              @if (error()) {
                <div class="alert alert-error">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="15" y1="9" x2="9" y2="15"/>
                    <line x1="9" y1="9" x2="15" y2="15"/>
                  </svg>
                  {{ error() }}
                </div>
              }

              <p class="action-hint">Une fois la réparation terminée, marquez la demande comme terminée.</p>

              <button
                class="btn btn-completed btn-block"
                (click)="markAsCompleted()"
                [disabled]="isUpdating()"
              >
                @if (isUpdating()) {
                  <span class="spinner-small"></span>
                } @else {
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                    <polyline points="22 4 12 14.01 9 11.01"/>
                  </svg>
                }
                Marquer comme terminée
              </button>
            </section>
          }

          <!-- Actions Réparateur - Completed (Marquer comme livrée) -->
          @if (isRepairer() && request()?.status === 'completed') {
            <section class="section actions-section actions-cyan">
              <h2>
                <div class="section-icon-wrapper icon-cyan">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="1" y="3" width="15" height="13"/>
                    <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
                    <circle cx="5.5" cy="18.5" r="2.5"/>
                    <circle cx="18.5" cy="18.5" r="2.5"/>
                  </svg>
                </div>
                Prêt pour livraison
              </h2>

              @if (error()) {
                <div class="alert alert-error">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="15" y1="9" x2="9" y2="15"/>
                    <line x1="9" y1="9" x2="15" y2="15"/>
                  </svg>
                  {{ error() }}
                </div>
              }

              <p class="action-hint">Une fois l'appareil remis au client, marquez la demande comme livrée.</p>

              <button
                class="btn btn-delivered btn-block"
                (click)="markAsDelivered()"
                [disabled]="isUpdating()"
              >
                @if (isUpdating()) {
                  <span class="spinner-small"></span>
                } @else {
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M5 12h14"/>
                    <path d="M12 5l7 7-7 7"/>
                  </svg>
                }
                Marquer comme livrée
              </button>
            </section>
          }

          <!-- Info pour client sur demande en attente -->
          @if (isClient() && request()?.status === 'pending') {
            <section class="section info-section">
              <div class="info-message">
                <div class="info-icon-wrapper">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="12 6 12 12 16 14"/>
                  </svg>
                </div>
                <div class="info-text">
                  <h3>En attente de réponse</h3>
                  <p>Votre demande est en cours d'analyse par le réparateur. Vous serez notifié dès qu'il aura répondu.</p>
                </div>
              </div>
            </section>
          }

          <!-- Info pour demande acceptée (client uniquement) -->
          @if (isClient() && request()?.status === 'accepted') {
            <section class="section success-section">
              <div class="success-message">
                <div class="success-icon-wrapper">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                    <polyline points="22 4 12 14.01 9 11.01"/>
                  </svg>
                </div>
                <div class="success-text">
                  <h3>Demande acceptée !</h3>
                  <p>Votre réparation est en cours. Le réparateur vous contactera pour les détails.</p>
                </div>
              </div>
            </section>
          }

          <!-- Info pour demande terminée -->
          @if (request()?.status === 'completed') {
            <section class="section completed-section">
              <div class="completed-message">
                <div class="completed-icon-wrapper">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
                  </svg>
                </div>
                <div class="completed-text">
                  <h3>Réparation terminée !</h3>
                  @if (isClient()) {
                    <p>Votre appareil est prêt. Contactez le réparateur pour récupérer votre appareil.</p>
                  } @else {
                    <p>La réparation est terminée. Attendez que le client récupère son appareil.</p>
                  }
                </div>
              </div>
            </section>
          }

          <!-- Info pour demande livrée -->
          @if (request()?.status === 'delivered') {
            <section class="section delivered-section">
              <div class="delivered-message">
                <div class="delivered-icon-wrapper">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                    <polyline points="22 4 12 14.01 9 11.01"/>
                  </svg>
                </div>
                <div class="delivered-text">
                  <h3>Appareil livré !</h3>
                  @if (isClient()) {
                    <p>Votre appareil vous a été remis. Merci d'avoir utilisé RepairFone !</p>
                  } @else {
                    <p>L'appareil a été remis au client. Cette demande est terminée.</p>
                  }
                </div>
              </div>
            </section>
          }

          <!-- Bouton Chat -->
          @if (request()?.status === 'accepted' || request()?.status === 'completed') {
            <div class="chat-action">
              <a [routerLink]="['/chat', request()?.id]" class="btn btn-chat">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
                Ouvrir la conversation
              </a>
            </div>
          }
        </div>
      } @else {
        <div class="error-state">
          <div class="error-icon">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          </div>
          <h2>Demande non trouvée</h2>
          <p>Cette demande n'existe pas ou a été supprimée.</p>
          <a routerLink="/requests" class="btn btn-primary">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Retour à mes demandes
          </a>
        </div>
      }

      <!-- Modal de rejet -->
      @if (showRejectModal()) {
        <div class="modal-overlay" (click)="closeRejectModal()">
          <div class="modal-content" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <div class="modal-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="15" y1="9" x2="9" y2="15"/>
                  <line x1="9" y1="9" x2="15" y2="15"/>
                </svg>
              </div>
              <h3>Rejeter la demande</h3>
              <p class="modal-subtitle">Veuillez expliquer au client pourquoi vous rejetez cette demande.</p>
            </div>

            <textarea
              [(ngModel)]="rejectionReason"
              rows="4"
              class="form-textarea"
              placeholder="Ex: Pièce non disponible, appareil trop ancien, hors zone de service..."
            ></textarea>

            @if (rejectError()) {
              <div class="alert alert-error">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="15" y1="9" x2="9" y2="15"/>
                  <line x1="9" y1="9" x2="15" y2="15"/>
                </svg>
                {{ rejectError() }}
              </div>
            }

            <div class="modal-buttons">
              <button class="btn btn-secondary" (click)="closeRejectModal()">Annuler</button>
              <button
                class="btn btn-danger"
                (click)="confirmReject()"
                [disabled]="isUpdating() || !rejectionReason.trim()"
              >
                @if (isUpdating()) {
                  <span class="spinner-small"></span>
                }
                Confirmer le rejet
              </button>
            </div>
          </div>
        </div>
      }

      <!-- Modal de création de devis -->
      @if (showQuoteModal()) {
        <div class="modal-overlay" (click)="closeQuoteModal()">
          <div class="modal-content modal-large" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <div class="modal-icon modal-icon-green">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="12" y1="11" x2="12" y2="17"/>
                  <line x1="9" y1="14" x2="15" y2="14"/>
                </svg>
              </div>
              <h3>Créer un devis</h3>
              <p class="modal-subtitle">Détaillez le coût de la réparation</p>
            </div>

            <div class="quote-form">
              <div class="form-group">
                <label for="laborCost">Main d'œuvre (FCFA) *</label>
                <input
                  type="number"
                  id="laborCost"
                  [(ngModel)]="laborCost"
                  class="form-input"
                  placeholder="Ex: 15000"
                  min="0"
                />
              </div>

              <div class="form-group">
                <label for="estimatedDuration">Durée estimée *</label>
                <input
                  type="text"
                  id="estimatedDuration"
                  [(ngModel)]="estimatedDuration"
                  class="form-input"
                  placeholder="Ex: 2 heures, 1 jour..."
                />
              </div>

              <div class="form-group">
                <label>Pièces détachées</label>
                <div class="parts-list">
                  @for (part of quoteParts; track $index; let i = $index) {
                    <div class="part-row">
                      <input
                        type="text"
                        [(ngModel)]="part.name"
                        class="form-input part-name"
                        placeholder="Nom de la pièce"
                      />
                      <input
                        type="number"
                        [(ngModel)]="part.price"
                        class="form-input part-price"
                        placeholder="Prix"
                        min="0"
                      />
                      <input
                        type="number"
                        [(ngModel)]="part.quantity"
                        class="form-input part-qty"
                        placeholder="Qté"
                        min="1"
                      />
                      <button type="button" class="btn-remove-part" (click)="removePart(i)">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <line x1="18" y1="6" x2="6" y2="18"/>
                          <line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                      </button>
                    </div>
                  }
                </div>
                <button type="button" class="btn-add-part" (click)="addPart()">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="12" y1="5" x2="12" y2="19"/>
                    <line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                  Ajouter une pièce
                </button>
              </div>

              <div class="form-group">
                <label for="quoteNotes">Notes (optionnel)</label>
                <textarea
                  id="quoteNotes"
                  [(ngModel)]="quoteNotes"
                  class="form-textarea"
                  rows="2"
                  placeholder="Informations supplémentaires..."
                ></textarea>
              </div>

              <div class="quote-summary">
                <div class="summary-row">
                  <span>Main d'œuvre</span>
                  <span>{{ laborCost | number }} FCFA</span>
                </div>
                <div class="summary-row summary-total">
                  <span>Total</span>
                  <span>{{ calculateQuoteTotal() | number }} FCFA</span>
                </div>
              </div>
            </div>

            @if (quoteError()) {
              <div class="alert alert-error">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="15" y1="9" x2="9" y2="15"/>
                  <line x1="9" y1="9" x2="15" y2="15"/>
                </svg>
                {{ quoteError() }}
              </div>
            }

            <div class="modal-buttons">
              <button class="btn btn-secondary" (click)="closeQuoteModal()">Annuler</button>
              <button
                class="btn btn-success"
                (click)="submitQuote()"
                [disabled]="isCreatingQuote() || laborCost <= 0 || !estimatedDuration.trim()"
              >
                @if (isCreatingQuote()) {
                  <span class="spinner-small"></span>
                }
                Envoyer le devis
              </button>
            </div>
          </div>
        </div>
      }

      <!-- Modal de refus de devis -->
      @if (showRejectQuoteModal()) {
        <div class="modal-overlay" (click)="closeRejectQuoteModal()">
          <div class="modal-content modal-reject-quote" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <div class="modal-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="15" y1="9" x2="9" y2="15"/>
                  <line x1="9" y1="9" x2="15" y2="15"/>
                </svg>
              </div>
              <h3>Refuser le devis</h3>
              <p class="modal-subtitle">Vous pouvez proposer un autre prix au réparateur</p>
            </div>

            <div class="form-group">
              <label class="form-label">Votre contre-proposition (optionnel)</label>
              <div class="price-input-wrapper">
                <input
                  type="number"
                  [(ngModel)]="quoteProposedPrice"
                  class="form-input"
                  placeholder="Ex: 25000"
                  min="0"
                />
                <span class="price-currency">FCFA</span>
              </div>
              <p class="form-hint">Le réparateur pourra créer un nouveau devis basé sur votre proposition</p>
            </div>

            <div class="form-group">
              <label class="form-label">Motif du refus (optionnel)</label>
              <textarea
                [(ngModel)]="quoteRejectReason"
                rows="3"
                class="form-textarea"
                placeholder="Ex: Prix trop élevé, délai trop long..."
              ></textarea>
            </div>

            @if (quoteError()) {
              <div class="alert alert-error">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="15" y1="9" x2="9" y2="15"/>
                  <line x1="9" y1="9" x2="15" y2="15"/>
                </svg>
                {{ quoteError() }}
              </div>
            }

            <div class="modal-buttons">
              <button class="btn btn-secondary" (click)="closeRejectQuoteModal()">Annuler</button>
              <button
                class="btn btn-danger"
                (click)="confirmRejectQuote()"
                [disabled]="isUpdating()"
              >
                @if (isUpdating()) {
                  <span class="spinner-small"></span>
                }
                Confirmer le refus
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .detail-container {
      min-height: 100vh;
      background: #f8fafc;
      padding-bottom: 2rem;
    }

    /* Loading & Error States */
    .loading-state, .error-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      gap: 1rem;
      padding: 2rem;
      text-align: center;
    }

    .spinner {
      width: 48px;
      height: 48px;
      border: 4px solid #f1f5f9;
      border-top-color: #FF6B35;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    .spinner-small {
      width: 18px;
      height: 18px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .loading-state p {
      color: #64748b;
    }

    .error-icon {
      width: 100px;
      height: 100px;
      border-radius: 50%;
      background: linear-gradient(135deg, #fff7ed, #ffedd5);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #FF6B35;
      margin-bottom: 1rem;
    }

    .error-state h2 {
      font-size: 1.5rem;
      font-weight: 700;
      color: #1f2937;
      margin: 0;
    }

    .error-state p {
      color: #64748b;
      margin-bottom: 1.5rem;
    }

    .status-badge {
      padding: 0.375rem 0.75rem;
      border-radius: 20px;
      font-size: 0.6875rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .status-pending {
      background: linear-gradient(135deg, #fef3c7, #fde68a);
      color: #92400e;
    }

    .status-accepted {
      background: linear-gradient(135deg, #d1fae5, #a7f3d0);
      color: #065f46;
    }

    .status-rejected {
      background: linear-gradient(135deg, #fee2e2, #fecaca);
      color: #991b1b;
    }

    .status-in_progress {
      background: linear-gradient(135deg, #dbeafe, #bfdbfe);
      color: #1e40af;
    }

    .status-completed {
      background: linear-gradient(135deg, #d1fae5, #a7f3d0);
      color: #065f46;
    }

    .status-cancelled {
      background: linear-gradient(135deg, #f1f5f9, #e2e8f0);
      color: #475569;
    }

    .status-completed {
      background: linear-gradient(135deg, #ede9fe, #ddd6fe);
      color: #5b21b6;
    }

    .status-delivered {
      background: linear-gradient(135deg, #cffafe, #a5f3fc);
      color: #0e7490;
    }

    .header-title {
      position: relative;
      z-index: 1;
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .device-icon {
      width: 56px;
      height: 56px;
      border-radius: 16px;
      background: rgba(255, 255, 255, 0.2);
      backdrop-filter: blur(8px);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
    }

    .device-info h1 {
      font-size: 1.25rem;
      font-weight: 700;
      color: white;
      margin: 0 0 0.25rem 0;
    }

    .device-info p {
      font-size: 0.875rem;
      color: rgba(255, 255, 255, 0.85);
      margin: 0;
    }

    /* Content */
    .detail-content {
      padding: 1rem;
      padding-top: 100px;
    }

    /* Price Duration Card */
    .price-duration-card {
      display: flex;
      gap: 1rem;
      background: white;
      border-radius: 16px;
      padding: 1rem;
      margin-bottom: 1rem;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
    }

    .price-item {
      flex: 1;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.5rem;
      background: #f8fafc;
      border-radius: 12px;
    }

    .price-icon {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      background: linear-gradient(135deg, #FF6B35, #FF9800);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      flex-shrink: 0;
    }

    .price-icon.icon-blue {
      background: linear-gradient(135deg, #3b82f6, #60a5fa);
    }

    .price-details {
      display: flex;
      flex-direction: column;
    }

    .price-label {
      font-size: 0.75rem;
      color: #64748b;
    }

    .price-value {
      font-size: 1rem;
      font-weight: 700;
      color: #1f2937;
    }

    /* Sections */
    .section {
      background: white;
      border-radius: 16px;
      padding: 1.25rem;
      margin-bottom: 1rem;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    }

    .section h2 {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      font-size: 1rem;
      font-weight: 600;
      color: #1f2937;
      margin: 0 0 1rem 0;
      padding-bottom: 0.75rem;
      border-bottom: 1px solid #f1f5f9;
    }

    .section-icon-wrapper {
      width: 36px;
      height: 36px;
      border-radius: 10px;
      background: linear-gradient(135deg, #FF6B35, #FF9800);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      flex-shrink: 0;
    }

    .section-icon-wrapper.icon-blue {
      background: linear-gradient(135deg, #3b82f6, #60a5fa);
    }

    .section-icon-wrapper.icon-green {
      background: linear-gradient(135deg, #10b981, #34d399);
    }

    .section-icon-wrapper.icon-orange {
      background: linear-gradient(135deg, #f59e0b, #fbbf24);
    }

    .actions-negotiation {
      border: 2px solid #f59e0b !important;
      background: linear-gradient(135deg, #fffbeb, #fef3c7) !important;
    }

    .negotiation-hint {
      color: #92400e;

      strong {
        color: #d97706;
        font-size: 1.1em;
      }
    }

    .section-icon-wrapper.icon-purple {
      background: linear-gradient(135deg, #8b5cf6, #a78bfa);
    }

    .section-icon-wrapper.icon-red {
      background: linear-gradient(135deg, #ef4444, #f87171);
    }

    .description-text {
      color: #475569;
      line-height: 1.6;
      margin: 0;
      padding: 1rem;
      background: #f8fafc;
      border-radius: 10px;
      font-size: 0.9375rem;
    }

    /* Contact Card */
    .contact-card {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      background: #f8fafc;
      border-radius: 12px;
    }

    .contact-avatar {
      width: 50px;
      height: 50px;
      border-radius: 12px;
      background: linear-gradient(135deg, #FF6B35, #FF9800);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      flex-shrink: 0;
    }

    .contact-avatar.client {
      background: linear-gradient(135deg, #3b82f6, #60a5fa);
    }

    .contact-info {
      flex: 1;
      min-width: 0;
    }

    .contact-name {
      font-weight: 600;
      color: #1f2937;
      margin-bottom: 0.25rem;
    }

    .contact-phone {
      display: inline-flex;
      align-items: center;
      gap: 0.375rem;
      color: #FF6B35;
      text-decoration: none;
      font-size: 0.875rem;
      font-weight: 500;
    }

    .contact-phone:hover {
      text-decoration: underline;
    }

    .contact-address {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      color: #64748b;
      font-size: 0.8125rem;
      margin-top: 0.25rem;
    }

    .call-btn {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      background: linear-gradient(135deg, #10b981, #34d399);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      text-decoration: none;
      flex-shrink: 0;
      transition: all 0.2s;
      box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
    }

    .call-btn:hover {
      transform: scale(1.05);
      box-shadow: 0 6px 16px rgba(16, 185, 129, 0.4);
    }

    /* Rejection Section */
    .rejection-section {
      background: linear-gradient(135deg, #fef2f2, #fee2e2);
      border: 1px solid #fecaca;
    }

    .rejection-reason {
      color: #991b1b;
      font-style: italic;
      margin: 0;
      padding: 1rem;
      background: rgba(255, 255, 255, 0.5);
      border-radius: 10px;
    }

    /* Timeline */
    .timeline {
      display: flex;
      flex-direction: column;
    }

    .timeline-item {
      display: flex;
      gap: 1rem;
      position: relative;
      padding-bottom: 1.25rem;
    }

    .timeline-item:last-child {
      padding-bottom: 0;
    }

    .timeline-item:last-child .timeline-line {
      display: none;
    }

    .timeline-dot {
      width: 14px;
      height: 14px;
      border-radius: 50%;
      margin-top: 4px;
      flex-shrink: 0;
      z-index: 1;
      border: 3px solid white;
      box-shadow: 0 0 0 2px currentColor;
    }

    .dot-pending {
      background: #f59e0b;
      color: #f59e0b;
    }

    .dot-accepted {
      background: #10b981;
      color: #10b981;
    }

    .dot-rejected {
      background: #ef4444;
      color: #ef4444;
    }

    .dot-in_progress {
      background: #3b82f6;
      color: #3b82f6;
    }

    .dot-completed {
      background: #10b981;
      color: #10b981;
    }

    .dot-cancelled {
      background: #64748b;
      color: #64748b;
    }

    .dot-completed {
      background: #8b5cf6;
      color: #8b5cf6;
    }

    .dot-delivered {
      background: #06b6d4;
      color: #06b6d4;
    }

    .timeline-line {
      position: absolute;
      left: 6px;
      top: 22px;
      bottom: 0;
      width: 2px;
      background: #e2e8f0;
    }

    .timeline-content {
      flex: 1;
      padding-bottom: 0.5rem;
    }

    .timeline-status {
      font-weight: 600;
      font-size: 0.9375rem;
    }

    .text-pending { color: #92400e; }
    .text-accepted { color: #065f46; }
    .text-rejected { color: #991b1b; }
    .text-in_progress { color: #1e40af; }
    .text-completed { color: #5b21b6; }
    .text-delivered { color: #0e7490; }
    .text-cancelled { color: #475569; }

    .timeline-comment {
      font-size: 0.875rem;
      color: #64748b;
      margin-top: 0.25rem;
      padding: 0.5rem 0.75rem;
      background: #f8fafc;
      border-radius: 8px;
    }

    .timeline-date {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      font-size: 0.75rem;
      color: #94a3b8;
      margin-top: 0.375rem;
    }

    /* Workflow Timeline - Nouveau design */
    .workflow-section {
      background: white;
    }

    .workflow-timeline {
      display: flex;
      flex-direction: column;
      gap: 0;
    }

    .workflow-step {
      display: flex;
      gap: 1rem;
      position: relative;
    }

    .step-indicator {
      display: flex;
      flex-direction: column;
      align-items: center;
      flex-shrink: 0;
    }

    .step-icon {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.25rem;
      transition: all 0.3s ease;
      position: relative;
      z-index: 2;
    }

    .workflow-step.completed .step-icon {
      background: linear-gradient(135deg, #10b981, #34d399);
      color: white;
      box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
    }

    .workflow-step.active .step-icon {
      background: linear-gradient(135deg, #FF6B35, #FF9800);
      color: white;
      box-shadow: 0 4px 12px rgba(255, 107, 53, 0.4);
      animation: pulse-orange 2s ease-in-out infinite;
    }

    .workflow-step.pending .step-icon {
      background: #f1f5f9;
      color: #94a3b8;
      border: 2px dashed #cbd5e1;
    }

    @keyframes pulse-orange {
      0%, 100% {
        box-shadow: 0 4px 12px rgba(255, 107, 53, 0.4);
      }
      50% {
        box-shadow: 0 4px 20px rgba(255, 107, 53, 0.6);
      }
    }

    .step-emoji {
      font-size: 1.25rem;
    }

    .step-connector {
      width: 3px;
      flex: 1;
      min-height: 24px;
      margin: 4px 0;
      border-radius: 2px;
      transition: background 0.3s ease;
    }

    .workflow-step.completed .step-connector {
      background: linear-gradient(180deg, #10b981, #34d399);
    }

    .workflow-step.active .step-connector {
      background: linear-gradient(180deg, #FF6B35, #e2e8f0);
    }

    .workflow-step.pending .step-connector {
      background: #e2e8f0;
    }

    .step-content {
      flex: 1;
      padding-bottom: 1.25rem;
      min-height: 60px;
    }

    .step-label {
      font-weight: 600;
      font-size: 0.9375rem;
      margin-bottom: 0.25rem;
      transition: color 0.3s ease;
    }

    .workflow-step.completed .step-label {
      color: #065f46;
    }

    .workflow-step.active .step-label {
      color: #c2410c;
    }

    .workflow-step.pending .step-label {
      color: #94a3b8;
    }

    .step-description {
      font-size: 0.8125rem;
      color: #64748b;
      margin-bottom: 0.375rem;
      line-height: 1.4;
    }

    .workflow-step.pending .step-description {
      color: #cbd5e1;
    }

    .step-date {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      font-size: 0.75rem;
      color: #94a3b8;
    }

    .workflow-step.completed .step-date {
      color: #10b981;
    }

    .workflow-step.active .step-date {
      color: #FF6B35;
    }

    /* Actions Section */
    .actions-section {
      border: 2px solid #FF6B35;
      background: linear-gradient(135deg, #fff7ed, #ffedd5);
    }

    .actions-section.actions-purple {
      border-color: #8b5cf6;
      background: linear-gradient(135deg, #f5f3ff, #ede9fe);
    }

    .actions-section.actions-cyan {
      border-color: #06b6d4;
      background: linear-gradient(135deg, #ecfeff, #cffafe);
    }

    .action-hint {
      color: #64748b;
      font-size: 0.875rem;
      margin: 0 0 1rem 0;
      line-height: 1.5;
    }

    .action-buttons {
      display: flex;
      gap: 0.75rem;
    }

    .section-icon-wrapper.icon-cyan {
      background: linear-gradient(135deg, #06b6d4, #22d3ee);
    }

    .alert {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.875rem 1rem;
      border-radius: 10px;
      margin-bottom: 1rem;
    }

    .alert-error {
      background: white;
      color: #991b1b;
      border: 1px solid #fecaca;
    }

    /* Buttons */
    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 0.875rem 1.5rem;
      border-radius: 12px;
      font-weight: 600;
      font-size: 0.9375rem;
      border: none;
      cursor: pointer;
      transition: all 0.2s;
      text-decoration: none;
    }

    .btn-primary {
      background: linear-gradient(135deg, #FF6B35, #FF9800);
      color: white;
      box-shadow: 0 4px 15px rgba(255, 107, 53, 0.4);
    }

    .btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(255, 107, 53, 0.5);
    }

    .btn-success {
      flex: 1;
      background: linear-gradient(135deg, #10b981, #34d399);
      color: white;
      box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
    }

    .btn-success:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(16, 185, 129, 0.4);
    }

    .btn-danger {
      flex: 1;
      background: linear-gradient(135deg, #ef4444, #f87171);
      color: white;
      box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
    }

    .btn-danger:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(239, 68, 68, 0.4);
    }

    .btn-outline-danger {
      background: transparent;
      color: #ef4444;
      border: 2px solid #ef4444;
      box-shadow: none;
    }

    .btn-outline-danger:hover:not(:disabled) {
      background: #fef2f2;
      transform: translateY(-2px);
    }

    .negotiation-actions {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      margin-top: 1rem;
    }

    .negotiation-actions .btn {
      width: 100%;
    }

    .negotiation-client-actions {
      margin-top: 1rem;
      padding-top: 1rem;
      border-top: 1px dashed #e2e8f0;
    }

    .negotiation-client-actions .waiting-message {
      color: #64748b;
      font-size: 0.875rem;
      margin-bottom: 0.75rem;
    }

    .btn-sm {
      padding: 0.5rem 1rem;
      font-size: 0.875rem;
    }

    .btn-secondary {
      background: #e2e8f0;
      color: #475569;
    }

    .btn-secondary:hover {
      background: #cbd5e1;
    }

    .btn-completed {
      background: linear-gradient(135deg, #8b5cf6, #a78bfa);
      color: white;
      box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
    }

    .btn-completed:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(139, 92, 246, 0.4);
    }

    .btn-delivered {
      background: linear-gradient(135deg, #06b6d4, #22d3ee);
      color: white;
      box-shadow: 0 4px 12px rgba(6, 182, 212, 0.3);
    }

    .btn-delivered:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(6, 182, 212, 0.4);
    }

    .btn-chat {
      width: 100%;
      background: linear-gradient(135deg, #FF6B35, #FF9800);
      color: white;
      box-shadow: 0 4px 15px rgba(255, 107, 53, 0.4);
    }

    .btn-chat:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(255, 107, 53, 0.5);
    }

    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none !important;
    }

    .chat-action {
      margin-top: 0.5rem;
    }

    /* Info & Success Sections */
    .info-section {
      background: linear-gradient(135deg, #fffbeb, #fef3c7);
      border: 1px solid #fde68a;
    }

    .info-message {
      display: flex;
      gap: 1rem;
      align-items: flex-start;
    }

    .info-icon-wrapper {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      background: linear-gradient(135deg, #f59e0b, #fbbf24);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      flex-shrink: 0;
    }

    .info-text h3 {
      font-size: 1rem;
      font-weight: 600;
      color: #92400e;
      margin: 0 0 0.25rem 0;
    }

    .info-text p {
      color: #92400e;
      margin: 0;
      font-size: 0.875rem;
      line-height: 1.5;
    }

    .success-section {
      background: linear-gradient(135deg, #ecfdf5, #d1fae5);
      border: 1px solid #a7f3d0;
    }

    .success-message {
      display: flex;
      gap: 1rem;
      align-items: flex-start;
    }

    .success-icon-wrapper {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      background: linear-gradient(135deg, #10b981, #34d399);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      flex-shrink: 0;
    }

    .success-text h3 {
      font-size: 1rem;
      font-weight: 600;
      color: #065f46;
      margin: 0 0 0.25rem 0;
    }

    .success-text p {
      color: #047857;
      margin: 0;
      font-size: 0.875rem;
      line-height: 1.5;
    }

    /* Completed Section */
    .completed-section {
      background: linear-gradient(135deg, #f5f3ff, #ede9fe);
      border: 1px solid #c4b5fd;
    }

    .completed-message {
      display: flex;
      gap: 1rem;
      align-items: flex-start;
    }

    .completed-icon-wrapper {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      background: linear-gradient(135deg, #8b5cf6, #a78bfa);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      flex-shrink: 0;
    }

    .completed-text h3 {
      font-size: 1rem;
      font-weight: 600;
      color: #5b21b6;
      margin: 0 0 0.25rem 0;
    }

    .completed-text p {
      color: #6d28d9;
      margin: 0;
      font-size: 0.875rem;
      line-height: 1.5;
    }

    /* Delivered Section */
    .delivered-section {
      background: linear-gradient(135deg, #ecfeff, #cffafe);
      border: 1px solid #67e8f9;
    }

    .delivered-message {
      display: flex;
      gap: 1rem;
      align-items: flex-start;
    }

    .delivered-icon-wrapper {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      background: linear-gradient(135deg, #06b6d4, #22d3ee);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      flex-shrink: 0;
    }

    .delivered-text h3 {
      font-size: 1rem;
      font-weight: 600;
      color: #0e7490;
      margin: 0 0 0.25rem 0;
    }

    .delivered-text p {
      color: #0891b2;
      margin: 0;
      font-size: 0.875rem;
      line-height: 1.5;
    }

    /* Modal */
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.6);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 1rem;
    }

    .modal-content {
      background: white;
      border-radius: 20px;
      padding: 1.5rem;
      width: 100%;
      max-width: 420px;
      max-height: 90vh;
      overflow-y: auto;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    }

    .modal-header {
      text-align: center;
      margin-bottom: 1.5rem;
    }

    .modal-icon {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      background: linear-gradient(135deg, #fee2e2, #fecaca);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #ef4444;
      margin: 0 auto 1rem;
    }

    .modal-content h3 {
      font-size: 1.25rem;
      font-weight: 700;
      color: #1f2937;
      margin: 0 0 0.5rem 0;
    }

    .modal-subtitle {
      color: #64748b;
      font-size: 0.875rem;
      margin: 0;
    }

    .form-textarea {
      width: 100%;
      padding: 1rem;
      border: 2px solid #e2e8f0;
      border-radius: 12px;
      font-size: 1rem;
      resize: vertical;
      min-height: 100px;
      transition: all 0.2s;
      font-family: inherit;
    }

    .form-textarea:focus {
      outline: none;
      border-color: #FF6B35;
      box-shadow: 0 0 0 3px rgba(255, 107, 53, 0.15);
    }

    .modal-reject-quote .form-group {
      margin-bottom: 1rem;
    }

    .form-label {
      display: block;
      font-size: 0.875rem;
      font-weight: 600;
      color: #374151;
      margin-bottom: 0.5rem;
    }

    .form-input {
      width: 100%;
      padding: 0.75rem 1rem;
      border: 2px solid #e2e8f0;
      border-radius: 12px;
      font-size: 1rem;
      transition: all 0.2s;
    }

    .form-input:focus {
      outline: none;
      border-color: #FF6B35;
      box-shadow: 0 0 0 3px rgba(255, 107, 53, 0.15);
    }

    .price-input-wrapper {
      display: flex;
      align-items: center;
      border: 2px solid #e2e8f0;
      border-radius: 12px;
      overflow: hidden;
      transition: all 0.2s;
    }

    .price-input-wrapper:focus-within {
      border-color: #FF6B35;
      box-shadow: 0 0 0 3px rgba(255, 107, 53, 0.15);
    }

    .price-input-wrapper .form-input {
      border: none;
      border-radius: 0;
      flex: 1;
    }

    .price-input-wrapper .form-input:focus {
      box-shadow: none;
    }

    .price-currency {
      padding: 0 1rem;
      background: #f8fafc;
      color: #64748b;
      font-weight: 600;
      font-size: 0.875rem;
      border-left: 2px solid #e2e8f0;
      height: 100%;
      display: flex;
      align-items: center;
    }

    .form-hint {
      font-size: 0.75rem;
      color: #64748b;
      margin-top: 0.5rem;
      margin-bottom: 0;
    }

    .modal-buttons {
      display: flex;
      gap: 0.75rem;
      margin-top: 1.25rem;
    }

    .modal-buttons .btn {
      flex: 1;
    }

    @media (max-width: 480px) {
      .price-duration-card {
        flex-direction: column;
      }

      .action-buttons {
        flex-direction: column;
      }

      .btn-success, .btn-danger {
        flex: none;
      }
    }

    /* Quote Section Styles */
    .quote-section {
      border: 2px solid #10b981;
      background: linear-gradient(135deg, #ecfdf5, #d1fae5);
    }

    .quote-section h2 {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      flex-wrap: wrap;
    }

    .quote-status-badge {
      margin-left: auto;
      padding: 0.25rem 0.75rem;
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 600;
    }

    .quote-status-pending {
      background: #fef3c7;
      color: #92400e;
    }

    .quote-status-accepted {
      background: #d1fae5;
      color: #065f46;
    }

    .quote-status-rejected {
      background: #fee2e2;
      color: #991b1b;
    }

    .quote-status-expired {
      background: #f1f5f9;
      color: #475569;
    }

    .quote-details {
      background: white;
      border-radius: 12px;
      padding: 1rem;
    }

    .quote-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem 0;
      border-bottom: 1px solid #f1f5f9;
    }

    .quote-row:last-child {
      border-bottom: none;
    }

    .quote-label {
      color: #64748b;
      font-size: 0.875rem;
    }

    .quote-value {
      font-weight: 600;
      color: #1f2937;
    }

    .quote-total {
      background: #f0fdf4;
      margin: 0.5rem -1rem -1rem;
      padding: 1rem;
      border-radius: 0 0 12px 12px;
    }

    .quote-total .quote-label {
      font-weight: 600;
      color: #065f46;
    }

    .quote-total .quote-value {
      font-size: 1.25rem;
      color: #065f46;
    }

    .quote-parts {
      padding: 0.75rem 0;
      border-bottom: 1px solid #f1f5f9;
    }

    .quote-part-item {
      display: flex;
      justify-content: space-between;
      padding: 0.375rem 0.5rem;
      background: #f8fafc;
      border-radius: 6px;
      margin-top: 0.375rem;
      font-size: 0.875rem;
    }

    .quote-notes {
      padding: 0.75rem 0;
      border-bottom: 1px solid #f1f5f9;
    }

    .quote-notes p {
      margin: 0.375rem 0 0;
      color: #475569;
      font-size: 0.875rem;
      padding: 0.5rem;
      background: #f8fafc;
      border-radius: 6px;
      font-style: italic;
    }

    .quote-expiry .text-red {
      color: #dc2626;
    }

    .quote-actions {
      margin-top: 1rem;
      padding-top: 1rem;
      border-top: 1px dashed #a7f3d0;
    }

    .quote-accepted-message,
    .quote-rejected-message {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-top: 1rem;
      padding: 1rem;
      border-radius: 10px;
      font-weight: 500;
    }

    .quote-accepted-message {
      background: #d1fae5;
      color: #065f46;
    }

    .quote-rejected-message {
      background: #fee2e2;
      color: #991b1b;
      flex-wrap: wrap;
    }

    .quote-rejected-message .client-proposal {
      width: 100%;
      margin-top: 0.5rem;
      padding-top: 0.5rem;
      border-top: 1px dashed #fca5a5;
      font-weight: 600;
      color: #7c3aed;
    }

    .rejection-detail {
      margin: 0.75rem 0 0 0;
      padding: 0.75rem;
      background: #fef2f2;
      border-radius: 8px;
      font-size: 0.875rem;
      color: #991b1b;
      font-style: italic;
    }

    /* Quote History Section */
    .quote-history-section {
      border: 2px solid #e2e8f0;
      background: #f8fafc;
    }

    .icon-gray {
      background: linear-gradient(135deg, #e2e8f0, #cbd5e1);
      color: #64748b;
    }

    .quote-history-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .quote-history-item {
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 1rem;
    }

    .quote-history-item.current {
      border-color: #FF6B35;
      box-shadow: 0 0 0 3px rgba(255, 107, 53, 0.1);
    }

    .history-header {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      flex-wrap: wrap;
      margin-bottom: 0.75rem;
    }

    .history-number {
      font-weight: 600;
      color: #1f2937;
    }

    .history-date {
      font-size: 0.75rem;
      color: #64748b;
    }

    .history-status {
      margin-left: auto;
      padding: 0.25rem 0.5rem;
      border-radius: 6px;
      font-size: 0.75rem;
      font-weight: 600;
    }

    .history-status.status-pending {
      background: #fef3c7;
      color: #92400e;
    }

    .history-status.status-accepted {
      background: #d1fae5;
      color: #065f46;
    }

    .history-status.status-rejected {
      background: #fee2e2;
      color: #991b1b;
    }

    .history-status.status-expired {
      background: #e2e8f0;
      color: #64748b;
    }

    .history-details {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .history-price,
    .history-counter-proposal {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .history-price .price-label,
    .history-counter-proposal .price-label {
      font-size: 0.875rem;
      color: #64748b;
    }

    .history-price .price-value {
      font-weight: 600;
      color: #1f2937;
    }

    .history-counter-proposal .price-value.counter {
      font-weight: 600;
      color: #7c3aed;
    }

    .history-reason {
      margin: 0.5rem 0 0 0;
      padding: 0.5rem;
      background: #fef2f2;
      border-radius: 6px;
      font-size: 0.8125rem;
      color: #991b1b;
      font-style: italic;
    }

    /* Quote Modal Styles */
    .modal-large {
      max-width: 500px;
    }

    .modal-icon-green {
      background: linear-gradient(135deg, #d1fae5, #a7f3d0);
      color: #10b981;
    }

    .quote-form {
      margin-bottom: 1rem;
    }

    .form-group {
      margin-bottom: 1rem;
    }

    .form-group label {
      display: block;
      font-weight: 500;
      color: #374151;
      margin-bottom: 0.5rem;
      font-size: 0.875rem;
    }

    .form-input {
      width: 100%;
      padding: 0.75rem 1rem;
      border: 2px solid #e5e7eb;
      border-radius: 10px;
      font-size: 1rem;
      transition: all 0.2s;
      background: #f9fafb;
    }

    .form-input:focus {
      outline: none;
      border-color: #FF6B35;
      background: white;
      box-shadow: 0 0 0 3px rgba(255, 107, 53, 0.15);
    }

    .parts-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      margin-bottom: 0.5rem;
    }

    .part-row {
      display: flex;
      gap: 0.5rem;
      align-items: center;
    }

    .part-name {
      flex: 2;
    }

    .part-price {
      flex: 1;
      min-width: 80px;
    }

    .part-qty {
      width: 60px;
      flex: none;
    }

    .btn-remove-part {
      width: 36px;
      height: 36px;
      border-radius: 8px;
      border: none;
      background: #fee2e2;
      color: #dc2626;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      transition: all 0.2s;
    }

    .btn-remove-part:hover {
      background: #fecaca;
    }

    .btn-add-part {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      background: #f0fdf4;
      border: 1px dashed #10b981;
      border-radius: 8px;
      color: #059669;
      font-size: 0.875rem;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-add-part:hover {
      background: #d1fae5;
    }

    .quote-summary {
      background: #f8fafc;
      border-radius: 10px;
      padding: 1rem;
      margin-top: 1rem;
    }

    .summary-row {
      display: flex;
      justify-content: space-between;
      padding: 0.5rem 0;
      font-size: 0.875rem;
      color: #64748b;
    }

    .summary-total {
      border-top: 2px solid #e2e8f0;
      margin-top: 0.5rem;
      padding-top: 0.75rem;
      font-weight: 600;
      color: #1f2937;
      font-size: 1rem;
    }

    .btn-block {
      width: 100%;
    }
  `],
})
export class RequestDetailComponent implements OnInit {
  readonly requestsService = inject(RequestsService);
  private readonly reviewsService = inject(ReviewsService);
  readonly quotesService = inject(QuotesService);
  private readonly authStore = inject(AuthStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly request = signal<RepairRequest | null>(null);
  readonly isLoading = signal(true);
  readonly isUpdating = signal(false);
  readonly error = signal<string | null>(null);
  readonly reviewExists = signal(false);
  readonly showRejectModal = signal(false);
  readonly rejectError = signal<string | null>(null);

  // Quote signals
  readonly quote = signal<Quote | null>(null);
  readonly quoteHistory = signal<Quote[]>([]);
  readonly showQuoteModal = signal(false);
  readonly isCreatingQuote = signal(false);
  readonly quoteError = signal<string | null>(null);
  readonly showRejectQuoteModal = signal(false);

  // Quote form
  laborCost = 0;
  estimatedDuration = '';
  quoteNotes = '';
  quoteParts: QuotePart[] = [];
  quoteRejectReason = '';
  quoteProposedPrice: number | null = null;

  comment = '';
  rejectionReason = '';

  // Computed timeline combiné avec tous les statuts
  readonly combinedTimeline = computed(() => {
    const req = this.request();
    const currentQuote = this.quote();
    if (!req) return [];

    const steps: TimelineStep[] = [];
    const currentStatus = req.status;

    // Définition des étapes du workflow
    const workflowSteps = [
      { status: 'pending', label: 'En cours d\'analyse', description: 'Demande créée', icon: '📝' },
      { status: 'accepted', label: 'Acceptée', description: 'Demande acceptée par le réparateur', icon: '✅' },
      { status: 'quote', label: 'Devis', description: '', icon: '📄' },
      { status: 'in_progress', label: 'En cours de réparation', description: 'Réparation en cours', icon: '🔧' },
      { status: 'completed', label: 'Réparation terminée', description: 'Réparation terminée', icon: '✨' },
      { status: 'delivered', label: 'Livrée', description: 'Appareil livré au client', icon: '🎉' },
    ];

    // Ordre des statuts pour déterminer progression
    const statusOrder = ['pending', 'accepted', 'quote', 'in_progress', 'completed', 'delivered'];
    const currentIndex = statusOrder.indexOf(currentStatus);

    // Trouver les dates dans l'historique
    const statusHistory = req.statusHistory || [];
    const getDateForStatus = (status: string): string | null => {
      const historyItem = statusHistory.find(h => h.status === status);
      return historyItem?.createdAt || null;
    };

    for (const step of workflowSteps) {
      const stepIndex = statusOrder.indexOf(step.status);
      let isCompleted = false;
      let isActive = false;
      let isPending = true;
      let date = '';
      let description = step.description;
      let label = step.label;

      // Cas spécial pour l'étape "Devis"
      if (step.status === 'quote') {
        if (currentQuote) {
          // Il y a un devis
          date = currentQuote.createdAt;
          if (currentQuote.status === 'accepted') {
            label = 'Devis accepté';
            description = `Montant: ${new Intl.NumberFormat('fr-FR').format(currentQuote.totalAmount)} FCFA`;
            isCompleted = true;
            isPending = false;
          } else if (currentQuote.status === 'rejected') {
            label = 'Devis refusé';
            description = currentQuote.rejectionReason || 'En attente d\'une nouvelle proposition';
            isActive = currentStatus === 'accepted';
            isPending = false;
          } else if (currentQuote.status === 'pending') {
            label = 'Devis envoyé';
            description = `Montant proposé: ${new Intl.NumberFormat('fr-FR').format(currentQuote.totalAmount)} FCFA`;
            isActive = true;
            isPending = false;
          } else if (currentQuote.status === 'expired') {
            label = 'Devis expiré';
            description = 'Le devis a expiré';
            isCompleted = false;
            isPending = false;
          }
        } else if (currentStatus === 'accepted') {
          // Pas de devis mais demande acceptée = en attente de devis
          label = 'En attente de devis';
          description = 'Le réparateur prépare le devis';
          isActive = true;
          isPending = false;
        } else if (stepIndex < currentIndex) {
          // Étape passée sans devis (cas particulier)
          isCompleted = true;
          isPending = false;
        }
      } else {
        // Autres étapes normales
        const historyDate = getDateForStatus(step.status);
        if (historyDate) {
          date = historyDate;
        }

        if (step.status === currentStatus) {
          isActive = true;
          isPending = false;
          if (step.status === 'pending') {
            date = req.createdAt;
          }
        } else if (stepIndex < currentIndex) {
          isCompleted = true;
          isPending = false;
        }

        // Pour pending, utiliser la date de création
        if (step.status === 'pending' && !date) {
          date = req.createdAt;
          if (currentIndex >= 0) {
            isCompleted = true;
            isPending = false;
          }
        }
      }

      // Cas spécial: si le devis est accepté, in_progress peut être actif
      if (step.status === 'in_progress' && currentQuote?.status === 'accepted' && currentStatus === 'accepted') {
        isActive = true;
        isPending = false;
        isCompleted = false;
      }

      steps.push({
        id: step.status,
        status: step.status,
        label,
        description,
        date,
        icon: step.icon,
        isActive,
        isCompleted,
        isPending,
      });
    }

    return steps;
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadRequest(id);
    }
  }

  async loadRequest(id: string): Promise<void> {
    this.isLoading.set(true);

    try {
      const request = await this.requestsService.getRequest(id);
      this.request.set(request);

      // Load quote if exists
      await this.loadQuote(id);
    } catch (err) {
      console.error('Error loading request:', err);
    } finally {
      this.isLoading.set(false);
    }
  }

  async loadQuote(requestId: string): Promise<void> {
    try {
      const quote = await this.quotesService.getQuoteByRequest(requestId);
      this.quote.set(quote);

      // Load quote history for negotiation display
      const history = await this.quotesService.getQuoteHistoryByRequest(requestId);
      this.quoteHistory.set(history);
    } catch (err) {
      console.error('Error loading quote:', err);
      this.quote.set(null);
      this.quoteHistory.set([]);
    }
  }

  async acceptRequest(): Promise<void> {
    const request = this.request();
    if (!request) return;

    this.error.set(null);
    this.isUpdating.set(true);

    try {
      const dto: UpdateStatusDto = {
        status: 'accepted',
        comment: 'Demande acceptée',
      };

      const updated = await this.requestsService.updateStatus(request.id, dto);
      this.request.set(updated);
    } catch (err: any) {
      this.error.set(err.message || 'Erreur lors de l\'acceptation');
    } finally {
      this.isUpdating.set(false);
    }
  }

  openRejectModal(): void {
    this.rejectionReason = '';
    this.rejectError.set(null);
    this.showRejectModal.set(true);
  }

  closeRejectModal(): void {
    this.showRejectModal.set(false);
    this.rejectionReason = '';
    this.rejectError.set(null);
  }

  async confirmReject(): Promise<void> {
    const request = this.request();
    if (!request) return;

    if (!this.rejectionReason.trim()) {
      this.rejectError.set('Veuillez indiquer le motif du rejet');
      return;
    }

    this.rejectError.set(null);
    this.isUpdating.set(true);

    try {
      const dto: UpdateStatusDto = {
        status: 'rejected',
        rejectionReason: this.rejectionReason.trim(),
      };

      const updated = await this.requestsService.updateStatus(request.id, dto);
      this.request.set(updated);
      this.closeRejectModal();
    } catch (err: any) {
      this.rejectError.set(err.message || 'Erreur lors du rejet');
    } finally {
      this.isUpdating.set(false);
    }
  }

  async markAsCompleted(): Promise<void> {
    const request = this.request();
    if (!request) return;

    this.error.set(null);
    this.isUpdating.set(true);

    try {
      const dto: UpdateStatusDto = {
        status: 'completed',
        comment: 'Réparation terminée',
      };

      const updated = await this.requestsService.updateStatus(request.id, dto);
      this.request.set(updated);
    } catch (err: any) {
      this.error.set(err.message || 'Erreur lors de la mise à jour');
    } finally {
      this.isUpdating.set(false);
    }
  }

  async markAsDelivered(): Promise<void> {
    const request = this.request();
    if (!request) return;

    this.error.set(null);
    this.isUpdating.set(true);

    try {
      const dto: UpdateStatusDto = {
        status: 'delivered',
        comment: 'Appareil livré au client',
      };

      const updated = await this.requestsService.updateStatus(request.id, dto);
      this.request.set(updated);
    } catch (err: any) {
      this.error.set(err.message || 'Erreur lors de la mise à jour');
    } finally {
      this.isUpdating.set(false);
    }
  }

  isClient(): boolean {
    return this.authStore.user()?.role === 'client';
  }

  isRepairer(): boolean {
    return this.authStore.user()?.role === 'repairer';
  }

  formatDateTime(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  // Quote methods
  openQuoteModal(): void {
    this.laborCost = 0;
    this.estimatedDuration = '';
    this.quoteNotes = '';
    this.quoteParts = [];
    this.quoteError.set(null);
    this.showQuoteModal.set(true);
  }

  closeQuoteModal(): void {
    this.showQuoteModal.set(false);
    this.quoteError.set(null);
  }

  addPart(): void {
    this.quoteParts.push({ name: '', price: 0, quantity: 1 });
  }

  removePart(index: number): void {
    this.quoteParts.splice(index, 1);
  }

  calculateQuoteTotal(): number {
    const partsCost = this.quoteParts.reduce((sum, part) => sum + (part.price * part.quantity), 0);
    return this.laborCost + partsCost;
  }

  async submitQuote(): Promise<void> {
    const request = this.request();
    if (!request) return;

    if (this.laborCost <= 0) {
      this.quoteError.set('Le coût de main d\'œuvre doit être supérieur à 0');
      return;
    }

    if (!this.estimatedDuration.trim()) {
      this.quoteError.set('La durée estimée est requise');
      return;
    }

    this.quoteError.set(null);
    this.isCreatingQuote.set(true);

    try {
      const validParts = this.quoteParts.filter(p => p.name.trim() && p.price > 0);

      const quote = await this.quotesService.createQuote({
        requestId: request.id,
        laborCost: this.laborCost,
        parts: validParts,
        estimatedDuration: this.estimatedDuration,
        notes: this.quoteNotes || undefined,
      });

      this.quote.set(quote);
      this.closeQuoteModal();

      // Reload request to get updated status
      await this.loadRequest(request.id);
    } catch (err: any) {
      this.quoteError.set(err.message || 'Erreur lors de la création du devis');
    } finally {
      this.isCreatingQuote.set(false);
    }
  }

  async acceptQuote(): Promise<void> {
    const quote = this.quote();
    if (!quote) return;

    this.quoteError.set(null);
    this.isUpdating.set(true);

    try {
      const updatedQuote = await this.quotesService.acceptQuote(quote.id);
      this.quote.set(updatedQuote);

      // Reload request to get updated status
      const request = this.request();
      if (request) {
        await this.loadRequest(request.id);
      }
    } catch (err: any) {
      this.quoteError.set(err.message || 'Erreur lors de l\'acceptation du devis');
    } finally {
      this.isUpdating.set(false);
    }
  }

  openRejectQuoteModal(): void {
    this.quoteRejectReason = '';
    this.quoteProposedPrice = null;
    this.quoteError.set(null);
    this.showRejectQuoteModal.set(true);
  }

  closeRejectQuoteModal(): void {
    this.showRejectQuoteModal.set(false);
    this.quoteError.set(null);
  }

  async confirmRejectQuote(): Promise<void> {
    const quote = this.quote();
    if (!quote) return;

    this.quoteError.set(null);
    this.isUpdating.set(true);

    try {
      const proposedPrice = this.quoteProposedPrice && this.quoteProposedPrice > 0
        ? this.quoteProposedPrice
        : undefined;
      const updatedQuote = await this.quotesService.rejectQuote(
        quote.id,
        this.quoteRejectReason || undefined,
        proposedPrice
      );
      this.quote.set(updatedQuote);
      this.closeRejectQuoteModal();

      // Reload request to get updated status
      const request = this.request();
      if (request) {
        await this.loadRequest(request.id);
      }
    } catch (err: any) {
      this.quoteError.set(err.message || 'Erreur lors du refus du devis');
    } finally {
      this.isUpdating.set(false);
    }
  }

  isQuoteExpired(): boolean {
    const quote = this.quote();
    if (!quote) return false;
    return this.quotesService.isExpired(quote);
  }

  getQuoteDaysRemaining(): number {
    const quote = this.quote();
    if (!quote) return 0;
    return this.quotesService.getDaysUntilExpiry(quote);
  }

  async acceptCounterProposal(): Promise<void> {
    const quote = this.quote();
    if (!quote || !quote.clientProposedPrice) return;

    this.quoteError.set(null);
    this.isUpdating.set(true);

    try {
      const newQuote = await this.quotesService.acceptCounterProposal(quote.id);
      this.quote.set(newQuote);

      // Reload request and quote history
      const request = this.request();
      if (request) {
        await this.loadRequest(request.id);
      }
    } catch (err: any) {
      this.quoteError.set(err.message || 'Erreur lors de l\'acceptation de la contre-proposition');
    } finally {
      this.isUpdating.set(false);
    }
  }

  async cancelNegotiation(): Promise<void> {
    const quote = this.quote();
    if (!quote) return;

    if (!confirm('Êtes-vous sûr de vouloir annuler définitivement cette négociation ? La demande sera remise en attente.')) {
      return;
    }

    this.quoteError.set(null);
    this.isUpdating.set(true);

    try {
      await this.quotesService.cancelNegotiation(quote.id, 'Négociation annulée par ' + (this.isRepairer() ? 'le réparateur' : 'le client'));

      // Reload request
      const request = this.request();
      if (request) {
        await this.loadRequest(request.id);
      }
    } catch (err: any) {
      this.quoteError.set(err.message || 'Erreur lors de l\'annulation de la négociation');
    } finally {
      this.isUpdating.set(false);
    }
  }
}
