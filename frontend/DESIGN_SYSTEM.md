# Système de Design RepairFone

## Vue d'ensemble

Ce système de design a été spécialement conçu pour **RepairFone**, une plateforme de réparation de téléphones et ordinateurs destinée au marché ivoirien (Côte d'Ivoire, Abidjan).

### Inspiration et Philosophie

Le design s'inspire des couleurs vibrantes et chaleureuses de l'Afrique et de la Côte d'Ivoire :

- **Orange** : Soleil africain, énergie, chaleur, accueil
- **Vert** : Forêts luxuriantes, nature, espoir, croissance
- **Or/Doré** : Terre, sable saharien, richesse culturelle
- **Bleu** : Océan Atlantique, confiance, stabilité
- **Terre cuite** : Terre africaine, authenticité, tradition

### Principes de Design

1. **Mobile-First** : Optimisé pour les smartphones, le device principal du marché
2. **Touch-Friendly** : Zones tactiles de 48px minimum (Android standard)
3. **Accessible** : Contraste WCAG AA, navigation clavier, screen readers
4. **Performant** : Chargement rapide, animations légères
5. **Culturellement Adapté** : Couleurs et visuels évoquant l'Afrique

---

## Structure des Fichiers

```
frontend/
├── tailwind.config.js                 # Configuration Tailwind CSS
├── src/
│   ├── styles.scss                    # Styles globaux et imports
│   └── styles/
│       ├── design-tokens.scss         # Tokens de design (couleurs, espacements, etc.)
│       └── themes/
│           └── repairfone-theme.scss  # Thème Angular Material
```

---

## Palette de Couleurs

### Couleurs Primaires

#### Orange Africain (Primary)
Représente le soleil, l'énergie et l'accueil africain.

```scss
$color-primary: (
  500: #FF9800,  // Couleur principale
  600: #FB8C00,
  700: #F57C00,
  800: #EF6C00,
  900: #E65100,  // Ultra foncé
)
```

**Usage** : Boutons principaux, CTA, éléments interactifs importants, navigation active

#### Vert Forêt (Secondary)
Symbolise la nature, l'espoir et la croissance.

```scss
$color-secondary: (
  500: #4CAF50,  // Couleur principale
  600: #43A047,
  700: #388E3C,
  800: #2E7D32,  // Forêt tropicale
  900: #1B5E20,
)
```

**Usage** : Messages de succès, indicateurs positifs, badges de statut

### Couleurs Tertiaires

#### Or/Doré
```scss
$color-gold: (
  700: #FBC02D,  // Or/Doré principal
  800: #F9A825,
)
```

**Usage** : Highlights, badges premium, récompenses, éléments VIP

#### Bleu Océan
```scss
$color-ocean: (
  500: #2196F3,  // Bleu océan
  800: #1565C0,  // Bleu confiance
)
```

**Usage** : Informations, liens, éléments informatifs, aide

### Couleurs d'Accent

#### Terre Cuite (Warning/Error)
```scss
$color-terracotta: (
  500: #F44336,
  800: #C62828,
)
```

**Usage** : Alertes, erreurs, actions destructives

#### Jaune Moutarde (Warning)
```scss
$color-mustard: (
  600: #FFC107,
)
```

**Usage** : Avertissements, notifications importantes

### Couleurs Neutres

```scss
$color-neutral: (
  50: #FAFAFA,   // Backgrounds
  100: #F5F5F5,  // Surfaces
  300: #E0E0E0,  // Borders
  600: #757575,  // Texte secondaire
  800: #424242,  // Texte primaire
  900: #212121,  // Texte emphase
)
```

### Couleurs Sémantiques

```scss
// Succès
--color-success: #4CAF50;
--color-success-light: #81C784;
--color-success-dark: #2E7D32;

// Avertissement
--color-warning: #FFC107;
--color-warning-light: #FFD54F;
--color-warning-dark: #F57C00;

// Erreur
--color-error: #F44336;
--color-error-light: #EF5350;
--color-error-dark: #C62828;

// Information
--color-info: #2196F3;
--color-info-light: #64B5F6;
--color-info-dark: #1565C0;
```

---

## Typographie

### Familles de Polices

```scss
// Corps de texte et UI
font-family: 'Inter', system-ui, sans-serif;

// Titres et headings
font-family: 'Poppins', 'Inter', sans-serif;

// Code et données
font-family: 'JetBrains Mono', 'Courier New', monospace;
```

### Échelle Typographique

| Taille | Pixels | Usage |
|--------|--------|-------|
| xs     | 12px   | Très petit texte, labels |
| sm     | 14px   | Texte secondaire, captions |
| base   | 16px   | **Texte principal** (optimal mobile) |
| lg     | 18px   | Texte important, sous-titres |
| xl     | 20px   | Titres H4 |
| 2xl    | 24px   | Titres H3 |
| 3xl    | 30px   | Titres H2 |
| 4xl    | 36px   | Titres H1 |
| 5xl    | 48px   | Hero titles |
| 6xl    | 60px   | Display titles |

### Poids de Police

- **Light** : 300
- **Regular** : 400 (texte standard)
- **Medium** : 500 (emphase légère)
- **Semibold** : 600
- **Bold** : 700 (titres, emphase forte)
- **Extrabold** : 800

---

## Espacements

Système basé sur 4px (0.25rem) pour la cohérence.

```scss
$spacing: (
  0: 0,
  1: 4px,
  2: 8px,
  3: 12px,
  4: 16px,    // Base
  6: 24px,
  8: 32px,
  12: 48px,
  16: 64px,
)
```

### Zones Tactiles (Touch Targets)

- **iOS** : 44px minimum (recommandation Apple)
- **Android** : 48px minimum (recommandation Google)
- **RepairFone** : **48px** (optimal pour la majorité)

---

## Bordures et Rayons

### Rayons de Bordure

```scss
$border-radius: (
  sm: 4px,      // Subtil
  default: 8px, // Standard
  md: 12px,     // Médium
  lg: 16px,     // Large (boutons, cartes)
  xl: 20px,     // Très large
  2xl: 24px,    // Extra large (modals)
  full: 9999px, // Circulaire (avatars, badges)
)
```

**RepairFone utilise principalement** : `lg` (16px) pour un look moderne et africain

---

## Ombres

Système d'ombres adapté au design africain (légèrement plus prononcées).

```scss
// Mode clair
--shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
--shadow: 0 2px 8px 0 rgba(0, 0, 0, 0.1);
--shadow-md: 0 4px 12px 0 rgba(0, 0, 0, 0.1);
--shadow-lg: 0 8px 24px 0 rgba(0, 0, 0, 0.12);
--shadow-xl: 0 12px 32px 0 rgba(0, 0, 0, 0.15);

// Ombres spéciales
--shadow-warm: 0 4px 16px 0 rgba(255, 152, 0, 0.15);  // Orange chaleureuse
--shadow-success: 0 4px 16px 0 rgba(76, 175, 80, 0.15);  // Verte
```

---

## Breakpoints (Responsive)

Approche **Mobile-First** adaptée au marché africain.

```scss
$breakpoints: (
  xs: 375px,    // Petits smartphones
  sm: 640px,    // Smartphones standards
  md: 768px,    // Tablettes portrait
  lg: 1024px,   // Tablettes landscape / Desktop
  xl: 1280px,   // Desktop large
  2xl: 1536px,  // Desktop très large
)
```

**Priorité** : xs, sm, md (95% des utilisateurs)

---

## Classes Utilitaires Personnalisées

### Gradients Africains

```scss
// Gradient orange → or
.gradient-african
background: linear-gradient(135deg, #FF9800 0%, #F9A825 100%);

// Gradient coucher de soleil
.gradient-sunset
background: linear-gradient(135deg, #E65100 0%, #F9A825 50%, #FBC02D 100%);

// Gradient forêt
.gradient-forest
background: linear-gradient(135deg, #1B5E20 0%, #2E7D32 50%, #4CAF50 100%);
```

### Boutons

```scss
// Bouton principal (Orange)
.btn-primary
background-color: #FF9800;
min-height: 48px;
border-radius: 16px;

// Bouton secondaire (Vert)
.btn-secondary
background-color: #4CAF50;
min-height: 48px;
border-radius: 16px;

// Bouton outline
.btn-outline
border: 2px solid #FF9800;
background: transparent;
```

### Cards

```scss
.card
background: white;
border-radius: 16px;
padding: 24px;
box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
```

### Safe Areas (pour notch)

```scss
.safe-top      // padding-top avec safe-area-inset-top
.safe-bottom   // padding-bottom avec safe-area-inset-bottom
.safe-area     // padding sur tous les côtés
```

---

## Mode Sombre

Le système de design supporte le mode sombre avec la classe `.dark`.

### Backgrounds Mode Sombre

```scss
.dark {
  --bg-primary: #1A1A2E;      // Nuit africaine
  --bg-secondary: #25293C;    // Surfaces élevées
  --bg-surface: #2D3142;      // Cartes, modals
}
```

### Activation

```html
<!-- Ajouter la classe dark au body ou html -->
<html class="dark">
  <!-- Votre application -->
</html>
```

```typescript
// Avec JavaScript/TypeScript
document.documentElement.classList.add('dark');
document.documentElement.classList.remove('dark');
```

---

## Accessibilité

### Contraste

Toutes les couleurs respectent **WCAG 2.1 AA** :
- Texte normal : ratio 4.5:1 minimum
- Texte large : ratio 3:1 minimum

### Focus

```scss
*:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}
```

### Screen Reader

```scss
.sr-only  // Visible uniquement pour les screen readers
```

### Reduced Motion

Les utilisateurs qui préfèrent réduire les animations bénéficient automatiquement d'animations désactivées.

---

## Animations et Transitions

### Durées

```scss
--transition-fast: 150ms;   // Hover, focus
--transition: 200ms;        // Standard
--transition-slow: 300ms;   // Complexe
```

### Courbes d'Accélération

```scss
cubic-bezier(0.4, 0, 0.2, 1)  // Ease-in-out (standard)
```

### Animations Prédéfinies

```scss
.animate-fade-in     // Apparition en fondu
.animate-slide-up    // Glissement vers le haut
.animate-slide-down  // Glissement vers le bas
.animate-pulse       // Pulsation (chargement)
```

---

## Exemples d'Usage

### Bouton Principal

```html
<button class="btn btn-primary">
  Réserver une réparation
</button>
```

```html
<!-- Avec Tailwind -->
<button class="bg-primary-500 hover:bg-primary-700 text-white font-medium py-3 px-6 rounded-lg min-h-touch-android">
  Réserver une réparation
</button>
```

### Card avec Gradient

```html
<div class="card gradient-african text-white">
  <h3>Réparation Express</h3>
  <p>Votre téléphone réparé en 1 heure</p>
</div>
```

### Badge de Statut

```html
<span class="badge bg-secondary-500">En cours</span>
<span class="badge bg-gold-700">Premium</span>
<span class="badge bg-terracotta-500">Urgent</span>
```

### Layout Responsive

```html
<div class="container">
  <div class="section safe-area">
    <h1 class="text-4xl font-heading mb-6">
      RepairFone
    </h1>
    <p class="text-base text-secondary">
      Réparations de qualité à Abidjan
    </p>
  </div>
</div>
```

---

## Installation et Configuration

### 1. Installer Tailwind CSS

```bash
npm install -D tailwindcss postcss autoprefixer
```

### 2. Installer Angular Material

```bash
ng add @angular/material
```

Lors de l'installation, sélectionner :
- **Custom theme** : Oui
- **Typography** : Oui
- **Animations** : Oui

### 3. Vérifier les Imports

Le fichier `src/styles.scss` doit contenir :

```scss
@tailwind base;
@tailwind components;
@tailwind utilities;

@import 'styles/design-tokens.scss';
@import 'styles/themes/repairfone-theme.scss';
```

### 4. Configuration Angular

Dans `angular.json`, vérifier que `styles.scss` est bien référencé :

```json
{
  "styles": [
    "src/styles.scss"
  ]
}
```

---

## Guide de Contribution

### Ajout de Nouvelles Couleurs

1. Ajouter la couleur dans `design-tokens.scss`
2. Mettre à jour `tailwind.config.js`
3. Ajouter les variables CSS dans `repairfone-theme.scss`
4. Documenter dans ce fichier

### Modification des Tokens

1. Modifier uniquement dans `design-tokens.scss`
2. Les changements se propagent automatiquement
3. Tester en mode clair ET sombre
4. Vérifier l'accessibilité (contraste)

### Tests de Design

- Tester sur iOS Safari et Chrome Android
- Vérifier la zone tactile (minimum 48px)
- Valider les contrastes avec un outil WCAG
- Tester avec VoiceOver/TalkBack

---

## Ressources

### Outils Recommandés

- **Figma** : Design et prototypage
- **Coolors** : Génération de palettes
- **WebAIM Contrast Checker** : Vérification des contrastes
- **Lighthouse** : Audit d'accessibilité

### Documentation

- [Tailwind CSS](https://tailwindcss.com/docs)
- [Angular Material](https://material.angular.io)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Material Design](https://m3.material.io)

---

## Support

Pour toute question sur le système de design :
- Consulter ce document
- Vérifier les fichiers sources dans `src/styles/`
- Contacter l'équipe UX/UI

---

**Dernière mise à jour** : 2 janvier 2026
**Version** : 1.0.0
**Créé pour** : RepairFone - Côte d'Ivoire
