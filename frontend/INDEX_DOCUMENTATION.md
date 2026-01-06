# Index de la Documentation - Système de Design RepairFone

## Bienvenue

Cette documentation complète vous guide dans l'utilisation du système de design RepairFone, spécialement conçu pour le marché ivoirien avec des couleurs inspirées de l'Afrique.

---

## Fichiers de Documentation

### 1. README_DESIGN_SYSTEM.md
**Vue d'ensemble et démarrage rapide**

- Introduction au système de design
- Caractéristiques principales
- Démarrage rapide en 4 étapes
- Palette de couleurs principales
- Classes utilitaires essentielles
- Mode sombre
- Exemples rapides
- Bonnes pratiques

**À lire en premier** pour comprendre le système global.

**Chemin** : `E:\angular_project\RepairFone\frontend\README_DESIGN_SYSTEM.md`

---

### 2. DESIGN_SYSTEM.md
**Documentation technique complète**

- Philosophie et inspiration du design
- Palette de couleurs détaillée avec codes hex
- Système typographique complet
- Espacements et zones tactiles
- Bordures, rayons et ombres
- Breakpoints responsive
- Classes utilitaires personnalisées
- Gradients africains
- Mode sombre (light/dark)
- Accessibilité WCAG 2.1
- Animations et transitions
- Exemples d'usage concrets

**À consulter** pour les détails techniques et les spécifications exactes.

**Chemin** : `E:\angular_project\RepairFone\frontend\DESIGN_SYSTEM.md`

---

### 3. COLOR_PALETTE.md
**Guide de référence des couleurs**

- Palette primaire (Orange, Vert)
- Couleurs tertiaires (Or, Bleu Océan)
- Couleurs d'accent (Terre Cuite, Jaune Moutarde)
- Couleurs neutres (Gris chauds)
- Couleurs sémantiques (Succès, Warning, Error, Info)
- Backgrounds mode clair/sombre
- Gradients spéciaux
- Ratios de contraste WCAG
- Combinaisons recommandées
- Tableau de référence rapide

**À consulter** quand vous avez besoin de codes couleur précis.

**Chemin** : `E:\angular_project\RepairFone\frontend\COLOR_PALETTE.md`

---

### 4. INSTALLATION.md
**Guide d'installation étape par étape**

- Prérequis (Node.js, Angular CLI)
- Installation de Tailwind CSS
- Installation d'Angular Material
- Vérification de la configuration
- Installation des polices Google Fonts
- Configuration post-installation (mode sombre, Material Icons)
- Import des modules Material
- Tests de vérification
- Dépannage des erreurs courantes
- Structure finale des fichiers

**À suivre** lors de la première configuration du projet.

**Chemin** : `E:\angular_project\RepairFone\frontend\INSTALLATION.md`

---

### 5. COMPOSANTS_EXEMPLES.md
**Bibliothèque de composants réutilisables**

- Boutons (primaire, secondaire, outline, FAB, avec icônes)
- Cards (simple, image, gradient, Material, métier)
- Formulaires (inputs, contact, recherche)
- Navigation (header mobile, bottom nav, sidebar desktop)
- Badges et labels
- Listes (services, commandes)
- Modals (simple, succès)
- Notifications (toast success/error)
- Layouts (container, grid)
- Composants métier (cards service, status commande)

**À consulter** pour copier-coller des exemples de code prêts à l'emploi.

**Chemin** : `E:\angular_project\RepairFone\frontend\COMPOSANTS_EXEMPLES.md`

---

## Fichiers de Configuration

### 6. tailwind.config.js
**Configuration Tailwind CSS**

- Palette de couleurs africaines complète
- Extensions de thème (fonts, spacing, shadows)
- Breakpoints responsive mobile-first
- Plugins personnalisés (touch targets, safe areas, gradients)
- Variantes tactiles

**Chemin** : `E:\angular_project\RepairFone\frontend\tailwind.config.js`

---

### 7. src/styles.scss
**Styles globaux et imports**

- Imports Tailwind (@tailwind base, components, utilities)
- Imports design tokens
- Imports thème Angular Material
- Imports Google Fonts
- Variables CSS globales
- Reset et styles de base
- Typographie (h1-h6, p, a)
- Classes utilitaires personnalisées
- Scroll optimisé mobile
- Animations keyframes
- Accessibilité (focus, sr-only, reduced motion)
- Print styles
- Responsive helpers

**Chemin** : `E:\angular_project\RepairFone\frontend\src\styles.scss`

---

### 8. src/styles/design-tokens.scss
**Tokens de design documentés**

- Couleurs (primary, secondary, tertiaires, accents, neutres)
- Backgrounds mode clair/sombre
- Couleurs sémantiques
- Typographie (familles, tailles, poids, line-height, letter-spacing)
- Espacements (système 4px)
- Touch targets (iOS/Android)
- Safe areas
- Bordures et rayons
- Ombres (clair/sombre)
- Transitions et animations
- Z-index
- Breakpoints
- Largeurs max de contenu
- Opacité

**Chemin** : `E:\angular_project\RepairFone\frontend\src\styles\design-tokens.scss`

---

### 9. src/styles/themes/repairfone-theme.scss
**Thème Angular Material personnalisé**

- Palettes de couleurs Material
- Définition des thèmes clair/sombre
- Application des thèmes
- Variables CSS personnalisées
- Personnalisations des composants Material
- Optimisation mobile
- Accessibilité

**Chemin** : `E:\angular_project\RepairFone\frontend\src\styles\themes\repairfone-theme.scss`

---

## Comment Naviguer dans cette Documentation

### Je démarre un nouveau projet
1. Lire **README_DESIGN_SYSTEM.md** (vue d'ensemble)
2. Suivre **INSTALLATION.md** (installer les dépendances)
3. Consulter **COMPOSANTS_EXEMPLES.md** (exemples de code)

### Je cherche une couleur précise
1. Ouvrir **COLOR_PALETTE.md**
2. Trouver la couleur (Orange, Vert, Or, etc.)
3. Copier le code hex ou la classe Tailwind

### Je veux créer un bouton
1. Ouvrir **COMPOSANTS_EXEMPLES.md**
2. Aller à la section "Boutons"
3. Copier l'exemple qui correspond à vos besoins

### Je veux comprendre le système de spacing
1. Ouvrir **DESIGN_SYSTEM.md**
2. Aller à la section "Espacements"
3. Consulter l'échelle et les exemples

### Je veux personnaliser une couleur
1. Ouvrir **design-tokens.scss**
2. Modifier la valeur dans la palette
3. Mettre à jour **tailwind.config.js** si nécessaire

### J'ai une erreur lors de l'installation
1. Ouvrir **INSTALLATION.md**
2. Aller à la section "Dépannage"
3. Suivre les solutions proposées

---

## Structure Complète des Fichiers

```
E:\angular_project\RepairFone\frontend\
│
├── Documentation (5 fichiers MD)
│   ├── README_DESIGN_SYSTEM.md      ← Vue d'ensemble
│   ├── DESIGN_SYSTEM.md             ← Documentation complète
│   ├── COLOR_PALETTE.md             ← Référence couleurs
│   ├── INSTALLATION.md              ← Guide installation
│   ├── COMPOSANTS_EXEMPLES.md       ← Exemples de code
│   └── INDEX_DOCUMENTATION.md       ← Ce fichier
│
├── Configuration
│   └── tailwind.config.js           ← Config Tailwind
│
└── src\
    ├── styles.scss                  ← Styles globaux
    └── styles\
        ├── design-tokens.scss       ← Tokens de design
        └── themes\
            └── repairfone-theme.scss ← Thème Material
```

---

## Commandes Utiles

### Installation
```bash
# Installer Tailwind
npm install -D tailwindcss postcss autoprefixer

# Installer Angular Material
ng add @angular/material
```

### Développement
```bash
# Démarrer le serveur
npm start

# Build de production
npm run build

# Tests
npm test
```

---

## Ressources Externes

### Documentation Officielle
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Angular Material](https://material.angular.io)
- [Angular](https://angular.dev)
- [Material Design 3](https://m3.material.io)

### Outils Utiles
- [Material Icons](https://fonts.google.com/icons) - Bibliothèque d'icônes
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/) - Vérification contraste
- [Coolors](https://coolors.co) - Générateur de palettes
- [Figma](https://figma.com) - Design et prototypage

---

## Glossaire

### Termes Clés

**Mobile-First**
: Approche de design qui commence par l'expérience mobile, puis s'étend au desktop.

**Touch-Friendly**
: Design adapté aux interactions tactiles avec des zones de touche minimales de 48px.

**WCAG 2.1 AA**
: Standard d'accessibilité web garantissant un contraste minimal de 4.5:1 pour le texte normal.

**Design Tokens**
: Variables de design réutilisables (couleurs, espacements, etc.) qui garantissent la cohérence.

**Responsive Design**
: Approche qui adapte l'interface à différentes tailles d'écran.

**Safe Area**
: Zone sûre pour le contenu, excluant les notches et barres système.

**CTA (Call-to-Action)**
: Bouton ou lien principal qui incite à l'action (ex: "Réserver maintenant").

---

## FAQ (Questions Fréquentes)

### Comment changer la couleur primaire ?
Modifier la valeur dans `src/styles/design-tokens.scss` et `tailwind.config.js`.

### Comment activer le mode sombre ?
Ajouter la classe `dark` au tag `<html>` dans `index.html`.

### Comment utiliser les gradients africains ?
Utiliser les classes `.gradient-african`, `.gradient-sunset`, ou `.gradient-forest`.

### Quelles sont les tailles minimales pour les boutons ?
48px minimum (recommandation Android) pour être touch-friendly.

### Comment importer un composant Material ?
Importer le module correspondant dans votre composant ou module Angular.

### Les polices sont-elles chargées automatiquement ?
Oui, via CDN dans `styles.scss`. Vous pouvez aussi les installer localement.

---

## Support et Contribution

### Besoin d'Aide ?
1. Consulter cette documentation
2. Vérifier la section Dépannage dans `INSTALLATION.md`
3. Consulter la documentation officielle des outils utilisés

### Signaler un Problème
Si vous trouvez une erreur dans la documentation ou le code :
1. Noter le fichier concerné
2. Décrire le problème rencontré
3. Proposer une solution si possible

### Contribuer
Pour contribuer au système de design :
1. Lire `DESIGN_SYSTEM.md` pour comprendre les conventions
2. Respecter la palette de couleurs africaines
3. Tester en mode clair ET sombre
4. Vérifier l'accessibilité (contraste WCAG)
5. Documenter les changements

---

## Changelog

### Version 1.0.0 (2 janvier 2026)
- Création initiale du système de design
- Palette de couleurs africaines/ivoiriennes complète
- Configuration Tailwind CSS et Angular Material
- Documentation complète (5 fichiers MD)
- Exemples de composants réutilisables
- Support mode sombre
- Accessibilité WCAG 2.1 AA

---

## Licence

Ce système de design a été créé spécifiquement pour **RepairFone** - Côte d'Ivoire.

---

**Système de Design RepairFone v1.0.0**
*Créé avec passion pour le marché africain* 🌍

Pour toute question, consulter la documentation ou contacter l'équipe UX/UI.
