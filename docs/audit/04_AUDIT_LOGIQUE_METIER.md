# AUDIT LOGIQUE METIER - REPAIRFONE

**Date** : 6 Janvier 2026
**Score** : 6/10
**Auditeur** : Fullstack Architect

---

## TABLE DES MATIERES

1. [Résumé Exécutif](#1-résumé-exécutif)
2. [Modèle de Domaine](#2-modèle-de-domaine)
3. [Flux Métier](#3-flux-métier)
4. [Intégrité des Données](#4-intégrité-des-données)
5. [Service Layer](#5-service-layer)
6. [Cas Limites](#6-cas-limites)
7. [Contrats API](#7-contrats-api)
8. [Plan de Remédiation](#8-plan-de-remédiation)

---

## 1. RESUME EXECUTIF

RepairFone est un système de gestion de réparation téléphonique connectant clients et techniciens (repairers). L'analyse du backend NestJS et du frontend Angular révèle plusieurs **incohérences critiques** dans le modèle de domaine, les flux business, et les validations.

### Statistiques

| Catégorie | Score | Statut |
|-----------|-------|--------|
| Modèle de Domaine | 6/10 | Incohérences |
| Flux Métier | 5/10 | Bugs logiques |
| Intégrité Données | 6/10 | Validations manquantes |
| Service Layer | 7/10 | Bon avec améliorations |
| Gestion Edge Cases | 5/10 | Insuffisant |

---

## 2. MODELE DE DOMAINE

### 2.1 Entités Principales

| Entité | Fichier | Description |
|--------|---------|-------------|
| `User` | `backend/src/modules/users/entities/user.entity.ts` | Compte utilisateur |
| `RepairerProfile` | `backend/src/modules/users/entities/repairer-profile.entity.ts` | Profil business réparateur |
| `RepairRequest` | `backend/src/modules/requests/entities/repair-request.entity.ts` | Demande de réparation |
| `Quote` | `backend/src/modules/quotes/entities/quote.entity.ts` | Devis |
| `Payment` | `backend/src/modules/payments/entities/payment.entity.ts` | Transaction paiement |
| `Review` | `backend/src/modules/reviews/entities/review.entity.ts` | Avis client |
| `Dispute` | `backend/src/modules/disputes/entities/dispute.entity.ts` | Litige |
| `Device` | `backend/src/modules/devices/entities/device.entity.ts` | Catalogue appareils |
| `ServiceType` | `backend/src/modules/devices/entities/service-type.entity.ts` | Types de services |

---

### 2.2 CRITIQUE - Désalignement Status Enum

#### RequestStatus

**Backend** (`repair-request.entity.ts:15-21`) :
```typescript
export enum RequestStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  COMPLETED = 'completed',
  DELIVERED = 'delivered',
}
```

**Frontend** (`frontend/src/app/shared/models/index.ts:165-173`) :
```typescript
export type RequestStatus =
  | 'pending'
  | 'accepted'
  | 'rejected'
  | 'in_progress'      // ❌ N'EXISTE PAS AU BACKEND!
  | 'awaiting_parts'   // ❌ N'EXISTE PAS AU BACKEND!
  | 'completed'
  | 'cancelled'        // ❌ N'EXISTE PAS AU BACKEND!
  | 'disputed';        // ❌ N'EXISTE PAS AU BACKEND!
```

**Impact** :
- Erreurs de rendu UI pour statuts inexistants
- Échecs de filtres/recherches
- Problèmes d'affichage badges de statut

---

#### PaymentStatus

**Backend** (`payment.entity.ts:25-29`) :
```typescript
export enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',  // "COMPLETED"
  FAILED = 'failed',
  REFUNDED = 'refunded',
  BLOCKED = 'blocked',
  CANCELLED = 'cancelled',
}
```

**Frontend** (`models/index.ts:372`) :
```typescript
export type PaymentStatus = 'pending' | 'processing' | 'paid' | 'failed' | 'refunded' | 'blocked' | 'released';
```

**Différences** :
- Backend utilise `COMPLETED`, frontend attend `paid`
- Frontend attend `released` qui n'existe pas au backend
- Backend a `CANCELLED` que le frontend n'a pas

---

### 2.3 Correction Recommandée

**Backend** - Ajouter les statuts manquants :

```typescript
// backend/src/modules/requests/entities/repair-request.entity.ts
export enum RequestStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  IN_PROGRESS = 'in_progress',     // AJOUTER
  AWAITING_PARTS = 'awaiting_parts', // AJOUTER
  COMPLETED = 'completed',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',         // AJOUTER
  DISPUTED = 'disputed',           // AJOUTER
  REJECTED = 'rejected',
}
```

**Frontend** - Aligner avec backend :

```typescript
// frontend/src/app/shared/models/index.ts
export type PaymentStatus =
  | 'pending'
  | 'processing'
  | 'completed'   // Pas 'paid'
  | 'failed'
  | 'refunded'
  | 'blocked'
  | 'cancelled';  // Pas 'released'
```

---

## 3. FLUX METIER

### 3.1 Machine à États Request

**État Actuel** :

```
PENDING ──────> ACCEPTED ──────> COMPLETED ──────> DELIVERED
    │               │
    └───> REJECTED  │
                    │
              (pas de chemin retour ou vers cancelled)
```

**Problèmes Identifiés** :

| # | Problème | Impact |
|---|----------|--------|
| 1 | Pas de status `IN_PROGRESS` | Impossible de savoir si réparation commencée |
| 2 | Pas de status `CANCELLED` | Champs `cancelledAt`, `cancelledBy` existent mais pas le status |
| 3 | Pas de status `AWAITING_PARTS` | Scénario courant non modélisé |
| 4 | Pas d'intégration Dispute | Entité Dispute existe mais pas de status `DISPUTED` |

---

### 3.2 CRITIQUE - Quote Auto-Accepte Request

**Fichier** : `backend/src/modules/quotes/quotes.service.ts:161-165`

```typescript
// Update request status
await this.requestRepo.update(dto.requestId, {
  status: RequestStatus.ACCEPTED,
  estimatedPrice: totalAmount,
});
```

**Problème** : Créer un devis change automatiquement la demande en `ACCEPTED`. Cela contourne le flux prévu :

1. Réparateur reçoit demande (PENDING)
2. Réparateur envoie devis
3. Client examine devis
4. Client accepte devis (puis ACCEPTED)

**Impact Business** : Le client ne peut pas comparer les devis de plusieurs réparateurs avant d'accepter.

**Correction Recommandée** :

```typescript
// quotes.service.ts
async create(dto: CreateQuoteDto, repairerId: string): Promise<Quote> {
  const request = await this.requestRepo.findOne({ where: { id: dto.requestId } });

  // NE PAS auto-accepter la demande
  // Juste créer le devis avec status PENDING
  const quote = this.quoteRepo.create({
    ...dto,
    repairerId,
    status: QuoteStatus.PENDING,
    validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 jours
  });

  return this.quoteRepo.save(quote);
}

// Nouveau endpoint pour accepter un devis
async acceptQuote(quoteId: string, clientId: string): Promise<Quote> {
  const quote = await this.quoteRepo.findOne({
    where: { id: quoteId },
    relations: ['request']
  });

  // Vérifier que le client est propriétaire de la demande
  if (quote.request.clientId !== clientId) {
    throw new ForbiddenException('Non autorisé');
  }

  // Maintenant accepter la demande et assigner le réparateur
  quote.status = QuoteStatus.ACCEPTED;
  quote.request.status = RequestStatus.ACCEPTED;
  quote.request.repairerId = quote.repairerId;

  await this.requestRepo.save(quote.request);
  return this.quoteRepo.save(quote);
}
```

---

### 3.3 Reviews sur Mauvais Status

**Fichier** : `backend/src/modules/reviews/reviews.service.ts:84-85`

```typescript
if (request.status !== RequestStatus.ACCEPTED) {
  throw new BadRequestException('Vous ne pouvez noter que les demandes acceptées');
}
```

**Problème** : Les avis ne peuvent être créés que pour les demandes `ACCEPTED`, mais logiquement les avis devraient être permis pour `COMPLETED` ou `DELIVERED` (après que le travail soit fait).

**Correction** :

```typescript
if (![RequestStatus.COMPLETED, RequestStatus.DELIVERED].includes(request.status)) {
  throw new BadRequestException('Vous ne pouvez noter que les réparations terminées');
}
```

---

### 3.4 Double Système de Notation

Le système a deux mécanismes de notation parallèles :

1. **Review Entity** (`review.entity.ts`) : Avis traditionnels 1-5 étoiles
2. **StepRating Entity** (`step-rating.entity.ts`) : Notations incrémentielles -5 à +5 par étape

**Problèmes** :
- `repairers.service.ts:255-275` utilise les step ratings pour potentiellement bloquer les réparateurs (cumulative <= -10)
- L'entité `Review` a des sous-ratings séparés (`qualityRating`, `communicationRating`, `timelinessRating`)
- Les deux systèmes mettent à jour `ratingAvg` sur `RepairerProfile`, créant des race conditions potentielles

**Recommandation** : Documenter clairement l'interaction des deux systèmes ou les fusionner.

---

## 4. INTEGRITE DES DONNEES

### 4.1 Validations Manquantes

#### DTOs Sans Décorateurs de Validation

**Fichier** : `backend/src/modules/payments/payments.service.ts:10-16`

```typescript
export class InitiatePaymentDto {
  requestId: string;      // ❌ Pas de @IsUUID()
  quoteId: string;        // ❌ Pas de @IsUUID()
  paymentMethod: PaymentMethod;  // ❌ Pas de @IsEnum()
  paymentType: PaymentType;      // ❌ Pas de @IsEnum()
  phoneNumber: string;           // ❌ Pas de @IsString(), @IsPhoneNumber()
}
```

**Correction** :

```typescript
import { IsUUID, IsEnum, IsString, Matches } from 'class-validator';

export class InitiatePaymentDto {
  @IsUUID()
  requestId: string;

  @IsUUID()
  quoteId: string;

  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @IsEnum(PaymentType)
  paymentType: PaymentType;

  @IsString()
  @Matches(/^\+225[0-9]{10}$/, {
    message: 'Format téléphone invalide. Utilisez +225XXXXXXXXXX'
  })
  phoneNumber: string;
}
```

---

### 4.2 Champs Requis Conditionnellement

**Problème** : `RepairRequest` a des champs optionnels qui devraient être requis pour certains `deliveryMode` :

```typescript
// Pour AT_HOME delivery, ces champs devraient être requis mais sont optionnels:
@Column({ name: 'client_latitude', type: 'decimal', precision: 10, scale: 8, nullable: true })
clientLatitude?: number;

@Column({ name: 'client_longitude', type: 'decimal', precision: 11, scale: 8, nullable: true })
clientLongitude?: number;

@Column({ name: 'client_address', type: 'text', nullable: true })
clientAddress?: string;
```

**Impact** : Un client peut sélectionner `AT_HOME` sans fournir d'adresse.

**Correction** - Validation Conditionnelle :

```typescript
import { ValidateIf, IsNotEmpty, IsNumber } from 'class-validator';

export class CreateRequestDto {
  @IsEnum(DeliveryMode)
  deliveryMode: DeliveryMode;

  @ValidateIf(o => o.deliveryMode === DeliveryMode.AT_HOME)
  @IsNotEmpty({ message: 'L\'adresse est requise pour un service à domicile' })
  clientAddress?: string;

  @ValidateIf(o => o.deliveryMode === DeliveryMode.AT_HOME)
  @IsNumber()
  clientLatitude?: number;

  @ValidateIf(o => o.deliveryMode === DeliveryMode.AT_HOME)
  @IsNumber()
  clientLongitude?: number;
}
```

---

### 4.3 Précision Décimale

**Problème** : Conversions `Number()` pour les champs décimaux peuvent perdre de la précision :

```typescript
const quoteAmount = Number(quote.totalAmount);  // Peut perdre précision
```

**Recommandation** : Utiliser une bibliothèque comme `decimal.js` pour les calculs monétaires ou garder les montants en centimes (entiers).

---

## 5. SERVICE LAYER

### 5.1 CRITIQUE - Pas de Transactions DB

**Fichier** : `backend/src/modules/payments/payments.service.ts:99-106`

```typescript
const savedPayment = await this.paymentRepo.save(payment);

// En production, ici on appellerait l'API du provider de paiement
// Pour l'instant, on met en processing
savedPayment.status = PaymentStatus.PROCESSING;
await this.paymentRepo.save(savedPayment);

return this.findOne(savedPayment.id, clientId, UserRole.CLIENT);
```

**Problème** : Si le second `save` échoue, le paiement reste dans un état incohérent.

**Correction avec Transactions** :

```typescript
import { DataSource, QueryRunner } from 'typeorm';

@Injectable()
export class PaymentsService {
  constructor(private dataSource: DataSource) {}

  async initiatePayment(dto: InitiatePaymentDto, clientId: string): Promise<Payment> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const payment = queryRunner.manager.create(Payment, {
        ...dto,
        clientId,
        status: PaymentStatus.PENDING,
      });

      const savedPayment = await queryRunner.manager.save(payment);

      // Appel provider de paiement
      const providerResult = await this.paymentProvider.initiate(savedPayment);

      savedPayment.status = PaymentStatus.PROCESSING;
      savedPayment.providerTransactionId = providerResult.transactionId;
      await queryRunner.manager.save(savedPayment);

      await queryRunner.commitTransaction();
      return savedPayment;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
```

---

### 5.2 DTOs Définis dans les Fichiers Service

**Problème** : Tous les DTOs sont définis avec les services au lieu de fichiers séparés :
- `requests.service.ts` contient `CreateRequestDto`, `UpdateRequestStatusDto`, `RequestFilters`
- `quotes.service.ts` contient `CreateQuoteDto`, `UpdateQuoteDto`, etc.

**Impact** : Risques de dépendances circulaires et mauvaise organisation du code.

**Correction** :

```
backend/src/modules/requests/
├── dto/
│   ├── create-request.dto.ts
│   ├── update-request.dto.ts
│   ├── request-filters.dto.ts
│   └── index.ts
├── entities/
│   └── repair-request.entity.ts
├── requests.controller.ts
├── requests.service.ts
└── requests.module.ts
```

---

### 5.3 Mutations Cross-Entity

**Problème** : `QuotesService` modifie le status de `RepairRequest` :

```typescript
// quotes.service.ts:161-165
await this.requestRepo.update(dto.requestId, {
  status: RequestStatus.ACCEPTED,
  estimatedPrice: totalAmount,
});
```

Cette mutation cross-entity devrait être coordonnée via un service de niveau supérieur ou des events.

**Correction** - Pattern Events :

```typescript
// quotes.service.ts
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class QuotesService {
  constructor(private eventEmitter: EventEmitter2) {}

  async acceptQuote(quoteId: string): Promise<Quote> {
    // ... logique
    quote.status = QuoteStatus.ACCEPTED;
    await this.quoteRepo.save(quote);

    // Émettre un event au lieu de modifier directement
    this.eventEmitter.emit('quote.accepted', {
      quoteId: quote.id,
      requestId: quote.requestId,
      repairerId: quote.repairerId,
    });

    return quote;
  }
}

// requests.service.ts
@OnEvent('quote.accepted')
async handleQuoteAccepted(payload: { requestId: string; repairerId: string }) {
  await this.requestRepo.update(payload.requestId, {
    status: RequestStatus.ACCEPTED,
    repairerId: payload.repairerId,
  });
}
```

---

## 6. CAS LIMITES

### 6.1 Race Conditions

#### Génération Numéro de Demande

**Fichier** : `requests.service.ts:486-505`

```typescript
private async generateRequestNumber(): Promise<string> {
  const count = await this.requestRepository
    .createQueryBuilder('request')
    .where('request.createdAt >= :start', { start: startOfMonth })
    .andWhere('request.createdAt <= :end', { end: endOfMonth })
    .getCount();

  const sequence = (count + 1).toString().padStart(4, '0');
  return `${prefix}${year}${month}${sequence}`;
}
```

**Problème** : Des demandes concurrentes pourraient générer des numéros dupliqués. Pas de contrainte d'unicité au niveau DB lors de la génération.

**Correction** :

```typescript
// Option 1: Utiliser une séquence DB
@Column({
  type: 'varchar',
  length: 20,
  unique: true,
  default: () => `'RF' || TO_CHAR(NOW(), 'YYMM') || LPAD(NEXTVAL('request_seq')::text, 4, '0')`
})
requestNumber: string;

// Option 2: Retry sur conflit
private async generateRequestNumber(): Promise<string> {
  const maxRetries = 5;
  for (let i = 0; i < maxRetries; i++) {
    const number = await this.buildRequestNumber();
    const exists = await this.requestRepository.findOne({
      where: { requestNumber: number }
    });
    if (!exists) return number;
  }
  throw new ConflictException('Impossible de générer un numéro unique');
}
```

---

### 6.2 Edge Cases Non Gérés

| # | Scénario | État Actuel | Recommandation |
|---|----------|-------------|----------------|
| 1 | Devis expiré | Check à l'acceptation mais pas de job d'expiration auto | Créer scheduled job |
| 2 | Conversation orpheline | Reste active si demande rejetée | Désactiver automatiquement |
| 3 | Réparateur bloqué avec réparations actives | Pas de handling | Notifier clients, proposer réassignation |
| 4 | Acceptation devis concurrente | Check basique sans lock DB | Ajouter lock pessimiste |

---

### 6.3 Expiration Automatique des Devis

**Correction** - Scheduled Job :

```typescript
// quotes.scheduled.ts
import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class QuotesScheduledService {
  constructor(
    private quotesRepo: Repository<Quote>,
    private notificationService: NotificationsService,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async expireQuotes(): Promise<void> {
    const expiredQuotes = await this.quotesRepo.find({
      where: {
        status: QuoteStatus.PENDING,
        validUntil: LessThan(new Date()),
      },
      relations: ['request', 'repairer'],
    });

    for (const quote of expiredQuotes) {
      quote.status = QuoteStatus.EXPIRED;
      await this.quotesRepo.save(quote);

      // Notifier le client
      await this.notificationService.send({
        userId: quote.request.clientId,
        type: 'QUOTE_EXPIRED',
        title: 'Devis expiré',
        message: `Le devis de ${quote.repairer.firstName} a expiré`,
      });
    }
  }
}
```

---

## 7. CONTRATS API

### 7.1 Désalignement QuotePart

**Backend** (`quote.entity.ts:20-25`) :
```typescript
export interface QuotePart {
  name: string;
  description?: string;
  price: number;
  quantity: number;
}
```

**Frontend** (`models/index.ts:324-330`) :
```typescript
export interface QuotePart {
  name: string;
  quantity: number;
  unitPrice: number;      // ❌ Nom différent!
  totalPrice: number;     // ❌ Champ additionnel!
  isOriginal?: boolean;   // ❌ Champ additionnel!
}
```

**Correction** - Aligner les interfaces :

```typescript
// Définition partagée (ou backend comme source de vérité)
export interface QuotePart {
  name: string;
  description?: string;
  unitPrice: number;      // Renommer 'price' en 'unitPrice'
  quantity: number;
  isOriginal?: boolean;   // Ajouter au backend
  // totalPrice = unitPrice * quantity (calculé côté frontend)
}
```

---

### 7.2 Format Response Repairer

**Backend** (`repairers.service.ts`) retourne :
```typescript
repairerProfile: {
  rating: Number(profile.ratingAvg) || 0,
  reviewCount: profile.ratingCount || 0,
  ...
}
```

**Frontend** attend :
```typescript
export interface RepairerProfile {
  rating: number;
  ratingAvg: number;    // Attente duplicate
  ratingCount: number;  // Nom différent de reviewCount
  reviewCount: number;  // Attente duplicate
  ...
}
```

**Correction** : Standardiser les noms de champs.

---

## 8. PLAN DE REMEDIATION

### Critique (Semaine 1-2)

| # | Action | Fichiers | Effort |
|---|--------|----------|--------|
| 1 | Aligner enums RequestStatus | Backend + Frontend | 1 jour |
| 2 | Aligner enums PaymentStatus | Backend + Frontend | 0.5 jour |
| 3 | Découpler quote creation de request acceptance | quotes.service.ts | 1 jour |
| 4 | Corriger review status check | reviews.service.ts | 0.5 jour |
| 5 | Ajouter transactions DB | payments.service.ts, quotes.service.ts | 2 jours |

### Haute (Semaine 3-4)

| # | Action | Effort |
|---|--------|--------|
| 6 | Ajouter validation DTOs | 2 jours |
| 7 | Validation conditionnelle adresse | 0.5 jour |
| 8 | Séparer DTOs en fichiers dédiés | 1 jour |
| 9 | Aligner interfaces QuotePart | 0.5 jour |
| 10 | Standardiser noms champs API | 1 jour |

### Moyenne (Mois 2)

| # | Action | Effort |
|---|--------|--------|
| 11 | Implémenter pattern Events | 2 jours |
| 12 | Job expiration devis | 1 jour |
| 13 | Gérer réparateur bloqué | 1 jour |
| 14 | Lock pessimiste acceptation | 0.5 jour |
| 15 | Séquence DB pour numéros | 0.5 jour |

### Basse (Backlog)

| # | Action |
|---|--------|
| 16 | Documenter interaction systèmes notation |
| 17 | Audit précision décimale |
| 18 | Tests E2E flux complets |

---

## CONCLUSION

Le modèle de domaine RepairFone présente des **incohérences significatives** entre frontend et backend qui causent des bugs fonctionnels. Les problèmes les plus critiques sont :

1. **Désalignement des enums de status** - Cause des erreurs UI
2. **Quote auto-accepte Request** - Bypass de la logique métier
3. **Pas de transactions DB** - Risque de données incohérentes
4. **Validations manquantes** - Données invalides possibles

**Recommandation** : Prioriser l'alignement des enums et le découplage quote/request avant tout développement additionnel.

---

*Audit logique métier réalisé le 6 Janvier 2026*
