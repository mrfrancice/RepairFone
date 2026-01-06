# Exemples de Composants - RepairFone

Ce document contient des exemples de composants UI réutilisables utilisant le système de design RepairFone.

---

## Table des Matières

1. [Boutons](#boutons)
2. [Cards](#cards)
3. [Formulaires](#formulaires)
4. [Navigation](#navigation)
5. [Badges et Labels](#badges-et-labels)
6. [Listes](#listes)
7. [Modals](#modals)
8. [Notifications](#notifications)
9. [Layout](#layout)
10. [Composants Métier](#composants-métier)

---

## Boutons

### Bouton Principal (CTA)

```html
<!-- Avec classes custom -->
<button class="btn btn-primary">
  Réserver une réparation
</button>

<!-- Avec Tailwind -->
<button class="bg-primary-500 hover:bg-primary-700 text-white font-medium py-3 px-6 rounded-lg min-h-touch-android transition-all">
  Réserver une réparation
</button>

<!-- Avec Angular Material -->
<button mat-raised-button color="primary">
  Réserver une réparation
</button>
```

### Bouton Secondaire

```html
<button class="btn btn-secondary">
  Voir les détails
</button>

<button class="bg-secondary-500 hover:bg-secondary-700 text-white font-medium py-3 px-6 rounded-lg min-h-touch-android">
  Voir les détails
</button>
```

### Bouton Outline

```html
<button class="btn btn-outline">
  Annuler
</button>

<button class="border-2 border-primary-500 text-primary-500 hover:bg-primary-500 hover:text-white font-medium py-3 px-6 rounded-lg min-h-touch-android transition-all">
  Annuler
</button>
```

### Bouton avec Icône

```html
<button class="btn btn-primary">
  <mat-icon>build</mat-icon>
  <span class="ml-2">Démarrer la réparation</span>
</button>

<button class="bg-primary-500 hover:bg-primary-700 text-white font-medium py-3 px-6 rounded-lg min-h-touch-android flex items-center gap-2">
  <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793z"/>
    <path fill-rule="evenodd" d="M11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"/>
  </svg>
  Démarrer la réparation
</button>
```

### Bouton FAB (Floating Action Button)

```html
<button mat-fab color="primary" class="fixed bottom-6 right-6 safe-bottom safe-right">
  <mat-icon>add</mat-icon>
</button>

<button class="fixed bottom-6 right-6 bg-primary-500 hover:bg-primary-700 text-white w-14 h-14 rounded-full shadow-lg flex items-center justify-center safe-bottom safe-right">
  <mat-icon>add</mat-icon>
</button>
```

---

## Cards

### Card Simple

```html
<div class="card">
  <h3 class="text-xl font-heading mb-2">Réparation Écran</h3>
  <p class="text-secondary mb-4">Remplacement d'écran pour iPhone et Android</p>
  <p class="text-2xl font-bold text-primary-500">15 000 FCFA</p>
</div>
```

### Card avec Image

```html
<div class="card overflow-hidden p-0">
  <img src="/assets/images/repair-service.jpg" alt="Service" class="w-full h-48 object-cover">
  <div class="p-6">
    <h3 class="text-xl font-heading mb-2">Réparation Express</h3>
    <p class="text-secondary mb-4">Votre téléphone réparé en 1 heure</p>
    <button class="btn btn-primary w-full">Choisir ce service</button>
  </div>
</div>
```

### Card avec Gradient

```html
<div class="card gradient-african text-white">
  <h3 class="text-2xl font-heading mb-2">Offre Spéciale</h3>
  <p class="mb-4 opacity-90">-20% sur toutes les réparations ce mois-ci</p>
  <button class="bg-white text-primary-500 hover:bg-neutral-100 font-medium py-2 px-6 rounded-lg">
    Profiter de l'offre
  </button>
</div>
```

### Card avec Material

```html
<mat-card>
  <mat-card-header>
    <div mat-card-avatar class="bg-primary-500 flex items-center justify-center">
      <mat-icon class="text-white">build</mat-icon>
    </div>
    <mat-card-title>Réparation Batterie</mat-card-title>
    <mat-card-subtitle>Disponible en 24h</mat-card-subtitle>
  </mat-card-header>
  <mat-card-content>
    <p>Remplacement de batterie originale avec garantie 6 mois.</p>
    <p class="text-2xl font-bold text-primary-500 mt-4">12 000 FCFA</p>
  </mat-card-content>
  <mat-card-actions>
    <button mat-button color="primary">RÉSERVER</button>
    <button mat-button>EN SAVOIR PLUS</button>
  </mat-card-actions>
</mat-card>
```

### Card de Service (Métier)

```html
<div class="card hover:shadow-xl transition-shadow cursor-pointer">
  <div class="flex items-start gap-4">
    <div class="bg-primary-50 p-3 rounded-lg">
      <mat-icon class="text-primary-500 text-3xl">smartphone</mat-icon>
    </div>
    <div class="flex-1">
      <h3 class="text-lg font-semibold mb-1">Réparation Écran iPhone</h3>
      <p class="text-sm text-secondary mb-3">Écran LCD original, installation en 30 min</p>
      <div class="flex items-center justify-between">
        <span class="text-xl font-bold text-primary-500">15 000 FCFA</span>
        <span class="badge bg-secondary-500">Disponible</span>
      </div>
    </div>
  </div>
</div>
```

---

## Formulaires

### Input Simple

```html
<!-- Avec Material -->
<mat-form-field appearance="outline" class="w-full">
  <mat-label>Nom complet</mat-label>
  <input matInput placeholder="Entrez votre nom" required>
  <mat-icon matPrefix>person</mat-icon>
  <mat-error>Le nom est requis</mat-error>
</mat-form-field>

<!-- Avec Tailwind -->
<div class="mb-4">
  <label class="block text-sm font-medium mb-2">Nom complet</label>
  <input
    type="text"
    placeholder="Entrez votre nom"
    class="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
  >
</div>
```

### Formulaire de Contact

```html
<form class="card max-w-lg mx-auto">
  <h2 class="text-2xl font-heading mb-6">Demander un Devis</h2>

  <mat-form-field appearance="outline" class="w-full mb-4">
    <mat-label>Nom complet</mat-label>
    <input matInput placeholder="Votre nom" required>
    <mat-icon matPrefix>person</mat-icon>
  </mat-form-field>

  <mat-form-field appearance="outline" class="w-full mb-4">
    <mat-label>Téléphone</mat-label>
    <input matInput placeholder="+225 XX XX XX XX XX" required>
    <mat-icon matPrefix>phone</mat-icon>
  </mat-form-field>

  <mat-form-field appearance="outline" class="w-full mb-4">
    <mat-label>Type d'appareil</mat-label>
    <mat-select required>
      <mat-option value="iphone">iPhone</mat-option>
      <mat-option value="android">Android</mat-option>
      <mat-option value="laptop">Ordinateur</mat-option>
      <mat-option value="tablet">Tablette</mat-option>
    </mat-select>
    <mat-icon matPrefix>devices</mat-icon>
  </mat-form-field>

  <mat-form-field appearance="outline" class="w-full mb-6">
    <mat-label>Description du problème</mat-label>
    <textarea matInput rows="4" placeholder="Décrivez le problème..."></textarea>
  </mat-form-field>

  <button type="submit" class="btn btn-primary w-full">
    Envoyer la demande
  </button>
</form>
```

### Recherche

```html
<div class="relative">
  <input
    type="search"
    placeholder="Rechercher un service..."
    class="w-full pl-12 pr-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
  >
  <mat-icon class="absolute left-3 top-3 text-neutral-500">search</mat-icon>
</div>
```

---

## Navigation

### Header Mobile

```html
<header class="bg-gradient-african text-white safe-top sticky top-0 z-50 shadow-lg">
  <div class="container py-4">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <img src="/assets/logo-white.svg" alt="RepairFone" class="h-8">
        <h1 class="text-xl font-heading">RepairFone</h1>
      </div>
      <button mat-icon-button>
        <mat-icon class="text-white">menu</mat-icon>
      </button>
    </div>
  </div>
</header>
```

### Bottom Navigation (Mobile)

```html
<nav class="fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200 safe-bottom z-50">
  <div class="flex justify-around items-center py-2">
    <button class="flex flex-col items-center py-2 px-4 text-primary-500">
      <mat-icon>home</mat-icon>
      <span class="text-xs mt-1">Accueil</span>
    </button>
    <button class="flex flex-col items-center py-2 px-4 text-neutral-600">
      <mat-icon>build</mat-icon>
      <span class="text-xs mt-1">Services</span>
    </button>
    <button class="flex flex-col items-center py-2 px-4 text-neutral-600">
      <mat-icon>receipt_long</mat-icon>
      <span class="text-xs mt-1">Commandes</span>
    </button>
    <button class="flex flex-col items-center py-2 px-4 text-neutral-600">
      <mat-icon>person</mat-icon>
      <span class="text-xs mt-1">Profil</span>
    </button>
  </div>
</nav>
```

### Sidebar (Desktop)

```html
<aside class="w-64 bg-white border-r border-neutral-200 h-screen sticky top-0 desktop-only">
  <div class="p-6">
    <h2 class="text-2xl font-heading text-gradient-african mb-6">RepairFone</h2>

    <nav class="space-y-2">
      <a href="#" class="flex items-center gap-3 px-4 py-3 rounded-lg bg-primary-50 text-primary-700">
        <mat-icon>dashboard</mat-icon>
        <span class="font-medium">Tableau de bord</span>
      </a>
      <a href="#" class="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-neutral-100 text-neutral-700">
        <mat-icon>build</mat-icon>
        <span>Services</span>
      </a>
      <a href="#" class="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-neutral-100 text-neutral-700">
        <mat-icon>receipt_long</mat-icon>
        <span>Commandes</span>
      </a>
      <a href="#" class="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-neutral-100 text-neutral-700">
        <mat-icon>people</mat-icon>
        <span>Clients</span>
      </a>
      <a href="#" class="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-neutral-100 text-neutral-700">
        <mat-icon>settings</mat-icon>
        <span>Paramètres</span>
      </a>
    </nav>
  </div>
</aside>
```

---

## Badges et Labels

### Badges de Statut

```html
<!-- Disponible -->
<span class="badge bg-secondary-500">Disponible</span>

<!-- En cours -->
<span class="badge bg-ocean-500">En cours</span>

<!-- Urgent -->
<span class="badge bg-terracotta-500">Urgent</span>

<!-- Premium -->
<span class="badge bg-gold-700">Premium</span>

<!-- Nouveau -->
<span class="badge bg-mustard-600 text-neutral-900">Nouveau</span>
```

### Labels avec Icône

```html
<div class="inline-flex items-center gap-2 px-3 py-1 bg-secondary-50 text-secondary-700 rounded-full">
  <mat-icon class="text-sm">check_circle</mat-icon>
  <span class="text-sm font-medium">Réparé</span>
</div>

<div class="inline-flex items-center gap-2 px-3 py-1 bg-primary-50 text-primary-700 rounded-full">
  <mat-icon class="text-sm">schedule</mat-icon>
  <span class="text-sm font-medium">En attente</span>
</div>
```

---

## Listes

### Liste de Services

```html
<div class="space-y-4">
  <div class="card hover:shadow-lg transition-shadow cursor-pointer">
    <div class="flex items-center gap-4">
      <div class="bg-primary-50 p-3 rounded-lg">
        <mat-icon class="text-primary-500">smartphone</mat-icon>
      </div>
      <div class="flex-1">
        <h3 class="font-semibold">Réparation Écran</h3>
        <p class="text-sm text-secondary">À partir de 10 000 FCFA</p>
      </div>
      <mat-icon class="text-neutral-400">chevron_right</mat-icon>
    </div>
  </div>

  <div class="card hover:shadow-lg transition-shadow cursor-pointer">
    <div class="flex items-center gap-4">
      <div class="bg-secondary-50 p-3 rounded-lg">
        <mat-icon class="text-secondary-500">battery_charging_full</mat-icon>
      </div>
      <div class="flex-1">
        <h3 class="font-semibold">Remplacement Batterie</h3>
        <p class="text-sm text-secondary">À partir de 8 000 FCFA</p>
      </div>
      <mat-icon class="text-neutral-400">chevron_right</mat-icon>
    </div>
  </div>
</div>
```

### Liste de Commandes

```html
<div class="space-y-3">
  <div class="card">
    <div class="flex items-start justify-between mb-3">
      <div>
        <h3 class="font-semibold mb-1">Commande #R2024-001</h3>
        <p class="text-sm text-secondary">iPhone 12 - Écran cassé</p>
      </div>
      <span class="badge bg-ocean-500">En cours</span>
    </div>
    <div class="flex items-center justify-between text-sm">
      <span class="text-secondary">2 janv. 2026</span>
      <span class="font-semibold text-primary-500">15 000 FCFA</span>
    </div>
  </div>
</div>
```

---

## Modals

### Modal Simple

```html
<!-- Backdrop -->
<div class="fixed inset-0 bg-black bg-opacity-50 z-modal-backdrop flex items-center justify-center p-4">
  <!-- Modal -->
  <div class="bg-white rounded-2xl max-w-md w-full p-6 animate-slide-up">
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-xl font-heading">Confirmer la réservation</h2>
      <button mat-icon-button>
        <mat-icon>close</mat-icon>
      </button>
    </div>

    <p class="text-secondary mb-6">
      Êtes-vous sûr de vouloir réserver ce service de réparation ?
    </p>

    <div class="flex gap-3">
      <button class="btn btn-outline flex-1">Annuler</button>
      <button class="btn btn-primary flex-1">Confirmer</button>
    </div>
  </div>
</div>
```

### Modal de Succès

```html
<div class="fixed inset-0 bg-black bg-opacity-50 z-modal-backdrop flex items-center justify-center p-4">
  <div class="bg-white rounded-2xl max-w-md w-full p-6 text-center animate-slide-up">
    <div class="w-16 h-16 bg-secondary-50 rounded-full flex items-center justify-center mx-auto mb-4">
      <mat-icon class="text-secondary-500 text-4xl">check_circle</mat-icon>
    </div>

    <h2 class="text-2xl font-heading mb-2">Réservation confirmée !</h2>
    <p class="text-secondary mb-6">
      Votre demande de réparation a été enregistrée avec succès.
      Nous vous contacterons sous 24h.
    </p>

    <button class="btn btn-primary w-full">Compris</button>
  </div>
</div>
```

---

## Notifications

### Toast Success

```html
<div class="fixed top-6 right-6 bg-white shadow-xl rounded-lg p-4 flex items-center gap-3 max-w-sm animate-slide-down">
  <div class="bg-secondary-50 p-2 rounded-lg">
    <mat-icon class="text-secondary-500">check_circle</mat-icon>
  </div>
  <div class="flex-1">
    <h4 class="font-semibold">Succès</h4>
    <p class="text-sm text-secondary">Votre commande a été créée</p>
  </div>
  <button mat-icon-button class="text-neutral-400">
    <mat-icon>close</mat-icon>
  </button>
</div>
```

### Toast Error

```html
<div class="fixed top-6 right-6 bg-white shadow-xl rounded-lg p-4 flex items-center gap-3 max-w-sm animate-slide-down">
  <div class="bg-terracotta-50 p-2 rounded-lg">
    <mat-icon class="text-terracotta-500">error</mat-icon>
  </div>
  <div class="flex-1">
    <h4 class="font-semibold">Erreur</h4>
    <p class="text-sm text-secondary">Une erreur s'est produite</p>
  </div>
  <button mat-icon-button class="text-neutral-400">
    <mat-icon>close</mat-icon>
  </button>
</div>
```

---

## Layout

### Page Container

```html
<div class="min-h-screen bg-neutral-50">
  <!-- Header -->
  <header class="bg-gradient-african text-white safe-top">
    <!-- Contenu header -->
  </header>

  <!-- Main Content -->
  <main class="container section pb-20">
    <!-- Contenu principal -->
  </main>

  <!-- Bottom Nav (Mobile) -->
  <nav class="mobile-only">
    <!-- Navigation mobile -->
  </nav>
</div>
```

### Grid Layout

```html
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  <!-- Cards -->
</div>
```

---

## Composants Métier

### Card Service de Réparation

```html
<div class="card hover:shadow-xl transition-all cursor-pointer">
  <div class="flex items-start gap-4">
    <div class="bg-primary-50 p-4 rounded-xl">
      <mat-icon class="text-primary-500 text-4xl">smartphone</mat-icon>
    </div>
    <div class="flex-1">
      <div class="flex items-start justify-between mb-2">
        <h3 class="text-lg font-semibold">Réparation Écran iPhone 13</h3>
        <span class="badge bg-secondary-500">Disponible</span>
      </div>
      <p class="text-sm text-secondary mb-3">
        Écran OLED original, installation en 30 minutes, garantie 6 mois
      </p>
      <div class="flex items-center justify-between">
        <div>
          <span class="text-2xl font-bold text-primary-500">25 000</span>
          <span class="text-sm text-secondary ml-1">FCFA</span>
        </div>
        <button class="btn-primary px-4 py-2 rounded-lg text-sm">
          Réserver
        </button>
      </div>
    </div>
  </div>
</div>
```

### Status de Commande

```html
<div class="card">
  <div class="flex items-center justify-between mb-4">
    <h3 class="font-semibold">Commande #R2024-001</h3>
    <span class="badge bg-ocean-500">En cours</span>
  </div>

  <div class="space-y-3 mb-4">
    <div class="flex items-start gap-3">
      <div class="bg-secondary-500 text-white w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
        <mat-icon class="text-sm">check</mat-icon>
      </div>
      <div class="flex-1">
        <p class="font-medium">Commande reçue</p>
        <p class="text-sm text-secondary">2 janv. 2026, 10:30</p>
      </div>
    </div>

    <div class="flex items-start gap-3">
      <div class="bg-ocean-500 text-white w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
        <mat-icon class="text-sm">build</mat-icon>
      </div>
      <div class="flex-1">
        <p class="font-medium">Réparation en cours</p>
        <p class="text-sm text-secondary">En attente...</p>
      </div>
    </div>

    <div class="flex items-start gap-3">
      <div class="bg-neutral-300 w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
        <mat-icon class="text-sm text-neutral-500">check</mat-icon>
      </div>
      <div class="flex-1">
        <p class="font-medium text-neutral-400">Prêt pour récupération</p>
        <p class="text-sm text-neutral-400">En attente...</p>
      </div>
    </div>
  </div>

  <button class="btn btn-outline w-full">Voir les détails</button>
</div>
```

---

## Utilisation

Pour utiliser ces composants :

1. Copier le code HTML
2. Adapter selon vos besoins
3. S'assurer que les modules Material sont importés
4. Ajouter les interactions TypeScript si nécessaire

Pour plus d'informations, consulter `DESIGN_SYSTEM.md`.
