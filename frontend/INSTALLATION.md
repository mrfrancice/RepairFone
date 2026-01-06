# Installation du Système de Design RepairFone

## Prérequis

- Node.js 18+ et npm installés
- Angular CLI 20+ installé globalement
- Projet Angular 20 initialisé

---

## Étapes d'Installation

### 1. Installer Tailwind CSS

```bash
# Dans le dossier E:\angular_project\RepairFone\frontend

# Installer Tailwind CSS et ses dépendances
npm install -D tailwindcss@latest postcss@latest autoprefixer@latest

# Générer les fichiers de configuration (si nécessaire)
# NOTE: tailwind.config.js est déjà créé avec la palette africaine
npx tailwindcss init
```

### 2. Installer Angular Material

```bash
# Installer Angular Material
ng add @angular/material

# Lors de l'installation, choisir :
# 1. Custom theme? → Oui (ou sélectionner un thème de base)
# 2. Set up global Angular Material typography styles? → Oui
# 3. Include the Angular animations module? → Oui
```

**Note** : Le thème personnalisé RepairFone est déjà créé dans `src/styles/themes/repairfone-theme.scss`

### 3. Vérifier la Configuration Angular

Ouvrir `angular.json` et vérifier que la section `styles` contient bien :

```json
{
  "projects": {
    "frontend": {
      "architect": {
        "build": {
          "options": {
            "styles": [
              "src/styles.scss"
            ]
          }
        }
      }
    }
  }
}
```

### 4. Vérifier les Imports dans styles.scss

Le fichier `src/styles.scss` doit contenir (déjà configuré) :

```scss
@tailwind base;
@tailwind components;
@tailwind utilities;

@import 'styles/design-tokens.scss';
@import 'styles/themes/repairfone-theme.scss';
```

### 5. Installer les Polices Google Fonts (Optionnel)

Les polices sont chargées via CDN dans `styles.scss`, mais vous pouvez les installer localement :

```bash
npm install @fontsource/inter @fontsource/poppins @fontsource/jetbrains-mono
```

Puis dans `styles.scss`, remplacer les imports URL par :

```scss
@import '@fontsource/inter/300.css';
@import '@fontsource/inter/400.css';
@import '@fontsource/inter/500.css';
@import '@fontsource/inter/600.css';
@import '@fontsource/inter/700.css';
@import '@fontsource/inter/800.css';

@import '@fontsource/poppins/400.css';
@import '@fontsource/poppins/500.css';
@import '@fontsource/poppins/600.css';
@import '@fontsource/poppins/700.css';
@import '@fontsource/poppins/800.css';

@import '@fontsource/jetbrains-mono/400.css';
@import '@fontsource/jetbrains-mono/500.css';
@import '@fontsource/jetbrains-mono/600.css';
@import '@fontsource/jetbrains-mono/700.css';
```

---

## Commandes d'Installation Complètes

Voici toutes les commandes à exécuter dans l'ordre :

```bash
# 1. Naviguer vers le dossier frontend
cd E:\angular_project\RepairFone\frontend

# 2. Installer Tailwind CSS
npm install -D tailwindcss@latest postcss@latest autoprefixer@latest

# 3. Installer Angular Material
ng add @angular/material

# 4. (Optionnel) Installer les polices localement
npm install @fontsource/inter @fontsource/poppins @fontsource/jetbrains-mono

# 5. Installer les dépendances (si nécessaire)
npm install
```

---

## Configuration Post-Installation

### 1. Activer le Mode Sombre (Optionnel)

Dans `src/index.html`, ajouter la classe `dark` au tag `<html>` :

```html
<!doctype html>
<html lang="fr" class="dark">
  <!-- ... -->
</html>
```

Ou créer un service pour basculer dynamiquement :

```typescript
// src/app/services/theme.service.ts
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private isDark = false;

  toggleDarkMode() {
    this.isDark = !this.isDark;
    if (this.isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }

  setDarkMode(isDark: boolean) {
    this.isDark = isDark;
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }

  isDarkMode(): boolean {
    return this.isDark;
  }
}
```

### 2. Configurer Material Icons

Les Material Icons sont déjà importées via CDN dans `styles.scss`. Pour les utiliser :

```html
<mat-icon>home</mat-icon>
<mat-icon>phone</mat-icon>
<mat-icon>build</mat-icon>
```

### 3. Importer les Modules Material Nécessaires

Dans `app.config.ts` ou vos modules :

```typescript
import { provideAnimations } from '@angular/platform-browser/animations';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
// ... autres modules selon besoins

export const appConfig: ApplicationConfig = {
  providers: [
    provideAnimations(),
    // ... autres providers
  ]
};
```

---

## Vérification de l'Installation

### 1. Démarrer le Serveur de Développement

```bash
npm start
# ou
ng serve
```

L'application devrait démarrer sur `http://localhost:4200`

### 2. Tester les Styles

Créer un composant de test :

```bash
ng generate component test-design
```

Dans le template :

```html
<div class="container section">
  <!-- Test Gradient Africain -->
  <div class="card gradient-african text-white mb-8">
    <h2 class="text-3xl font-heading mb-4">RepairFone</h2>
    <p>Système de design avec couleurs africaines</p>
  </div>

  <!-- Test Boutons -->
  <div class="flex gap-4 mb-8">
    <button class="btn btn-primary">Bouton Primary</button>
    <button class="btn btn-secondary">Bouton Secondary</button>
    <button class="btn btn-outline">Bouton Outline</button>
  </div>

  <!-- Test Material -->
  <mat-card class="mb-8">
    <mat-card-header>
      <mat-icon>build</mat-icon>
      <mat-card-title>Réparation Express</mat-card-title>
    </mat-card-header>
    <mat-card-content>
      <p>Votre téléphone réparé en 1 heure</p>
    </mat-card-content>
    <mat-card-actions>
      <button mat-raised-button color="primary">Réserver</button>
    </mat-card-actions>
  </mat-card>

  <!-- Test Tailwind -->
  <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
    <div class="bg-primary-500 text-white p-6 rounded-lg">
      <h3 class="text-xl font-semibold mb-2">Orange</h3>
      <p>Couleur primaire</p>
    </div>
    <div class="bg-secondary-500 text-white p-6 rounded-lg">
      <h3 class="text-xl font-semibold mb-2">Vert</h3>
      <p>Couleur secondaire</p>
    </div>
    <div class="bg-gold-700 text-white p-6 rounded-lg">
      <h3 class="text-xl font-semibold mb-2">Or</h3>
      <p>Couleur accent</p>
    </div>
  </div>
</div>
```

### 3. Vérifier la Compilation

Si vous voyez les couleurs africaines et les styles appliqués, l'installation est réussie !

---

## Dépannage

### Erreur : "Module not found: Error: Can't resolve '@angular/material'"

**Solution** :
```bash
npm install @angular/material @angular/cdk @angular/animations
```

### Erreur : Tailwind classes ne fonctionnent pas

**Solution** :
1. Vérifier que `tailwind.config.js` existe à la racine
2. Vérifier les imports dans `styles.scss`
3. Redémarrer le serveur de développement

### Styles Angular Material ne s'appliquent pas

**Solution** :
1. Vérifier l'import du thème dans `styles.scss`
2. S'assurer que `provideAnimations()` est dans `app.config.ts`
3. Importer les modules Material nécessaires

### Polices ne se chargent pas

**Solution** :
1. Vérifier la connexion Internet (si CDN)
2. Ou installer les polices localement avec `@fontsource`
3. Vérifier les imports dans `styles.scss`

---

## Structure Finale des Fichiers

Après installation, votre structure devrait ressembler à :

```
frontend/
├── node_modules/
│   ├── @angular/material/
│   ├── tailwindcss/
│   └── ...
├── src/
│   ├── app/
│   ├── styles/
│   │   ├── design-tokens.scss
│   │   └── themes/
│   │       └── repairfone-theme.scss
│   ├── styles.scss
│   └── index.html
├── tailwind.config.js
├── package.json
├── DESIGN_SYSTEM.md
└── INSTALLATION.md
```

---

## Prochaines Étapes

1. Lire `DESIGN_SYSTEM.md` pour comprendre l'utilisation
2. Créer vos premiers composants avec le système de design
3. Tester sur mobile (responsive design)
4. Implémenter le toggle dark/light mode
5. Créer une page de documentation des composants

---

## Support

Pour toute question :
- Consulter `DESIGN_SYSTEM.md`
- Vérifier la documentation officielle :
  - [Tailwind CSS](https://tailwindcss.com/docs)
  - [Angular Material](https://material.angular.io)
  - [Angular](https://angular.dev)

---

**Bonne utilisation du système de design RepairFone !**
