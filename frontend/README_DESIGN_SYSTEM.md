# Système de Design RepairFone - Guide Complet

## Vue d'ensemble

Bienvenue dans le système de design **RepairFone** ! Ce système a été spécialement créé pour une application de réparation de téléphones et ordinateurs destinée au marché ivoirien (Côte d'Ivoire, Abidjan).

### Caractéristiques Principales

- **Palette Africaine** : Couleurs inspirées de l'Afrique (Orange soleil, Vert forêt, Or, Bleu océan)
- **Mobile-First** : Optimisé pour smartphones (95% des utilisateurs)
- **Touch-Friendly** : Zones tactiles de 48px minimum
- **Accessible** : Conforme WCAG 2.1 AA
- **Mode Sombre** : Support complet du dark mode
- **Performant** : Chargement rapide, animations légères

---

## Documentation Disponible

Le système de design comprend 4 fichiers de documentation :

### 1. README_DESIGN_SYSTEM.md (Ce fichier)
Vue d'ensemble et guide de démarrage rapide

### 2. DESIGN_SYSTEM.md
Documentation complète du système :
- Palette de couleurs détaillée
- Typographie et espacements
- Bordures, ombres, animations
- Breakpoints responsive
- Classes utilitaires
- Mode sombre
- Accessibilité

### 3. INSTALLATION.md
Instructions d'installation étape par étape :
- Installation de Tailwind CSS
- Installation d'Angular Material
- Configuration du projet
- Vérification et tests
- Dépannage

### 4. COMPOSANTS_EXEMPLES.md
Exemples de composants réutilisables :
- Boutons (primaire, secondaire, outline, FAB)
- Cards (simple, image, gradient, Material)
- Formulaires (inputs, contact, recherche)
- Navigation (header, bottom nav, sidebar)
- Badges, listes, modals, notifications
- Layouts et composants métier

---

## Fichiers Créés

Voici la structure complète du système de design :

```
E:\angular_project\RepairFone\frontend\
├── tailwind.config.js              # Configuration Tailwind avec palette africaine
├── src\
│   ├── styles.scss                 # Styles globaux et imports
│   └── styles\
│       ├── design-tokens.scss      # Tokens de design documentés
│       └── themes\
│           └── repairfone-theme.scss  # Thème Angular Material custom
├── DESIGN_SYSTEM.md                # Documentation complète
├── INSTALLATION.md                 # Guide d'installation
├── COMPOSANTS_EXEMPLES.md          # Exemples de composants
└── README_DESIGN_SYSTEM.md         # Ce fichier
```

---

## Démarrage Rapide

### Étape 1 : Installer les Dépendances

```bash
cd E:\angular_project\RepairFone\frontend

# Installer Tailwind CSS
npm install -D tailwindcss postcss autoprefixer

# Installer Angular Material
ng add @angular/material
```

### Étape 2 : Vérifier la Configuration

Les fichiers de configuration sont déjà créés :
- `tailwind.config.js` : Palette africaine configurée
- `src/styles.scss` : Imports Tailwind et Material
- `src/styles/design-tokens.scss` : Tous les tokens documentés
- `src/styles/themes/repairfone-theme.scss` : Thème Material custom

### Étape 3 : Démarrer l'Application

```bash
npm start
```

Ouvrir http://localhost:4200

### Étape 4 : Utiliser le Système

Exemple de bouton :

```html
<button class="btn btn-primary">
  Réserver une réparation
</button>
```

Exemple de card :

```html
<div class="card gradient-african text-white">
  <h3 class="text-2xl font-heading mb-2">Offre Spéciale</h3>
  <p>-20% sur toutes les réparations</p>
</div>
```

---

## Palette de Couleurs Principales

### Couleurs Primaires

```scss
// Orange Africain (Soleil, Énergie)
--color-primary: #FF9800
--color-primary-dark: #E65100

// Vert Forêt (Nature, Espoir)
--color-secondary: #4CAF50
--color-secondary-dark: #2E7D32
```

### Couleurs Tertiaires

```scss
// Or/Doré (Richesse, Terre)
--color-gold: #F9A825

// Bleu Océan (Confiance, Stabilité)
--color-ocean: #1565C0

// Terre Cuite (Alerte, Urgence)
--color-terracotta: #C62828

// Jaune Moutarde (Avertissement)
--color-mustard: #FFC107
```

### Usage des Couleurs

- **Orange** : CTA, boutons principaux, navigation active
- **Vert** : Succès, disponibilité, validation
- **Or** : Premium, VIP, highlights
- **Bleu** : Informations, liens, aide
- **Rouge** : Erreurs, urgent, actions destructives
- **Jaune** : Avertissements, notifications

---

## Classes Utilitaires Essentielles

### Boutons

```html
<button class="btn btn-primary">Primary</button>
<button class="btn btn-secondary">Secondary</button>
<button class="btn btn-outline">Outline</button>
```

### Cards

```html
<div class="card">Contenu</div>
```

### Gradients Africains

```html
<div class="gradient-african">Orange → Or</div>
<div class="gradient-sunset">Coucher de soleil</div>
<div class="gradient-forest">Forêt tropicale</div>
```

### Badges

```html
<span class="badge bg-secondary-500">Disponible</span>
<span class="badge bg-gold-700">Premium</span>
```

### Responsive

```html
<div class="mobile-only">Visible sur mobile uniquement</div>
<div class="desktop-only">Visible sur desktop uniquement</div>
```

### Safe Areas (Notch)

```html
<div class="safe-top">Padding top avec safe area</div>
<div class="safe-area">Padding sur tous les côtés</div>
```

---

## Tailwind Classes Personnalisées

### Couleurs

```html
<!-- Backgrounds -->
<div class="bg-primary-500">Orange</div>
<div class="bg-secondary-500">Vert</div>
<div class="bg-gold-700">Or</div>

<!-- Texte -->
<p class="text-primary-500">Texte orange</p>
<p class="text-secondary-700">Texte vert foncé</p>
```

### Espacement Touch-Friendly

```html
<!-- Bouton avec taille minimale 48px -->
<button class="touch-target-android">Bouton</button>
```

### Ombres

```html
<div class="shadow-warm">Ombre orange chaleureuse</div>
<div class="shadow-success">Ombre verte</div>
```

---

## Mode Sombre

### Activer le Mode Sombre

```html
<!-- Dans index.html -->
<html lang="fr" class="dark">
```

Ou avec TypeScript :

```typescript
// Activer
document.documentElement.classList.add('dark');

// Désactiver
document.documentElement.classList.remove('dark');
```

### Service de Thème

Créer un service pour gérer le thème :

```typescript
import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  toggleDarkMode() {
    document.documentElement.classList.toggle('dark');
  }
}
```

---

## Typographie

### Polices

```scss
// Corps de texte
font-family: 'Inter', sans-serif;

// Titres
font-family: 'Poppins', sans-serif;
```

### Échelle Typographique

```html
<h1 class="text-4xl font-heading">Titre H1 (36px)</h1>
<h2 class="text-3xl font-heading">Titre H2 (30px)</h2>
<h3 class="text-2xl font-heading">Titre H3 (24px)</h3>
<p class="text-base">Texte normal (16px)</p>
<p class="text-sm text-secondary">Texte secondaire (14px)</p>
```

---

## Breakpoints Responsive

```scss
xs: 375px   // Petits smartphones
sm: 640px   // Smartphones standards
md: 768px   // Tablettes portrait
lg: 1024px  // Tablettes landscape / Desktop
xl: 1280px  // Desktop large
```

### Usage

```html
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
  <!-- 1 colonne sur mobile, 2 sur tablette, 3 sur desktop -->
</div>
```

---

## Angular Material

### Modules à Importer

```typescript
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
```

### Utilisation

```html
<button mat-raised-button color="primary">
  Bouton Material
</button>

<mat-card>
  <mat-card-header>
    <mat-card-title>Titre</mat-card-title>
  </mat-card-header>
  <mat-card-content>
    Contenu
  </mat-card-content>
</mat-card>
```

---

## Accessibilité

### Focus Visible

Tous les éléments interactifs ont un focus visible automatique :

```scss
*:focus-visible {
  outline: 2px solid #FF9800;
  outline-offset: 2px;
}
```

### Screen Reader Only

```html
<span class="sr-only">Texte visible uniquement pour les screen readers</span>
```

### Contraste

Toutes les combinaisons de couleurs respectent WCAG 2.1 AA :
- Texte normal : ratio 4.5:1 minimum
- Texte large : ratio 3:1 minimum

---

## Exemples Rapides

### Page d'Accueil Simple

```html
<div class="min-h-screen bg-neutral-50">
  <!-- Header -->
  <header class="bg-gradient-african text-white safe-top">
    <div class="container py-4">
      <h1 class="text-2xl font-heading">RepairFone</h1>
    </div>
  </header>

  <!-- Hero -->
  <section class="container section">
    <h2 class="text-4xl font-heading mb-4">
      Réparations de qualité à Abidjan
    </h2>
    <p class="text-lg text-secondary mb-8">
      Votre smartphone réparé en moins de 24h
    </p>
    <button class="btn btn-primary">
      Réserver maintenant
    </button>
  </section>

  <!-- Services -->
  <section class="container section">
    <h3 class="text-2xl font-heading mb-6">Nos Services</h3>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div class="card">
        <mat-icon class="text-primary-500 text-4xl mb-3">smartphone</mat-icon>
        <h4 class="font-semibold mb-2">Réparation Écran</h4>
        <p class="text-secondary">À partir de 10 000 FCFA</p>
      </div>
      <!-- Plus de cards... -->
    </div>
  </section>
</div>
```

---

## Ressources et Support

### Documentation

1. **DESIGN_SYSTEM.md** - Documentation complète
2. **INSTALLATION.md** - Guide d'installation
3. **COMPOSANTS_EXEMPLES.md** - Exemples de code

### Outils Externes

- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Angular Material](https://material.angular.io)
- [Material Icons](https://fonts.google.com/icons)
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)

### Commandes Utiles

```bash
# Démarrer le serveur
npm start

# Build de production
npm run build

# Tests
npm test

# Linter
ng lint
```

---

## Bonnes Pratiques

### 1. Mobile-First

Toujours designer pour mobile d'abord, puis adapter pour desktop.

```html
<!-- Bon -->
<div class="text-base md:text-lg lg:text-xl">

<!-- Moins bon -->
<div class="text-xl md:text-base">
```

### 2. Touch-Friendly

Respecter les tailles minimales tactiles (48px).

```html
<button class="min-h-touch-android px-6 py-3">
  Bouton
</button>
```

### 3. Accessibilité

Toujours ajouter des labels et des aria-attributes.

```html
<button aria-label="Fermer le modal">
  <mat-icon>close</mat-icon>
</button>
```

### 4. Performance

Utiliser les classes Tailwind au lieu de CSS inline.

```html
<!-- Bon -->
<div class="bg-primary-500 p-4 rounded-lg">

<!-- Moins bon -->
<div style="background: #FF9800; padding: 1rem; border-radius: 0.5rem">
```

---

## Changelog

### Version 1.0.0 (2 janvier 2026)

- Création du système de design complet
- Palette de couleurs africaines/ivoiriennes
- Configuration Tailwind CSS
- Thème Angular Material custom
- Documentation complète
- Exemples de composants

---

## Contribution

Pour contribuer au système de design :

1. Consulter `DESIGN_SYSTEM.md` pour comprendre les tokens
2. Suivre les conventions de nommage
3. Tester en mode clair ET sombre
4. Vérifier l'accessibilité (contraste, focus)
5. Documenter les changements

---

## Licence

Ce système de design a été créé pour **RepairFone** - Côte d'Ivoire.

---

**Créé avec passion pour le marché africain**

Pour toute question, consulter la documentation ou contacter l'équipe UX/UI.
