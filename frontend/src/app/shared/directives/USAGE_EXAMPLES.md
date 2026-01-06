# Mobile Gesture Features - Usage Examples

This guide demonstrates how to use the mobile gesture features in your Angular components.

## Table of Contents
1. [Biometric Authentication Service](#biometric-authentication-service)
2. [Haptic Feedback Service](#haptic-feedback-service)
3. [Pull-to-Refresh Directive](#pull-to-refresh-directive)
4. [Swipe Gesture Directive](#swipe-gesture-directive)

---

## Biometric Authentication Service

### Basic Setup

```typescript
import { Component, inject } from '@angular/core';
import { BiometricService } from '@app/core';

@Component({
  selector: 'app-login',
  template: `
    <div class="login-container">
      @if (biometric.isSupported()) {
        <button
          (click)="loginWithBiometric()"
          [disabled]="!biometric.isEnabled()">
          Login with Biometrics
        </button>

        <button (click)="enableBiometric()">
          Enable Biometric Login
        </button>
      }
    </div>
  `
})
export class LoginComponent {
  biometric = inject(BiometricService);

  async enableBiometric() {
    const success = await this.biometric.enable('user-123', 'john@example.com');
    if (success) {
      console.log('Biometric authentication enabled');
    }
  }

  async loginWithBiometric() {
    const authenticated = await this.biometric.authenticate();
    if (authenticated) {
      // Proceed with login
      console.log('Biometric authentication successful');
    }
  }
}
```

### Register New Credential

```typescript
async registerBiometric(userId: string, userName: string) {
  if (!this.biometric.isSupported()) {
    console.warn('Biometric authentication not supported');
    return;
  }

  const registered = await this.biometric.register(userId, userName);
  if (registered) {
    console.log('Biometric credential registered successfully');
  }
}
```

### Disable and Clear Credentials

```typescript
disableBiometric() {
  this.biometric.disable();
}

clearBiometricData() {
  this.biometric.clearCredentials();
}
```

---

## Haptic Feedback Service

### Basic Usage

```typescript
import { Component, inject } from '@angular/core';
import { HapticService } from '@app/core';

@Component({
  selector: 'app-button-demo',
  template: `
    <button (click)="handleClick()">Click Me</button>
    <button (click)="toggleHaptic()">
      {{ haptic.isEnabled() ? 'Disable' : 'Enable' }} Haptic
    </button>
  `
})
export class ButtonDemoComponent {
  haptic = inject(HapticService);

  handleClick() {
    this.haptic.light(); // Light tap feedback
  }

  toggleHaptic() {
    this.haptic.toggle();
  }
}
```

### Different Intensity Levels

```typescript
// Light haptic (10ms) - For subtle interactions
onToggle() {
  this.haptic.light();
}

// Medium haptic (20ms) - For confirmations
onSelect() {
  this.haptic.medium();
}

// Heavy haptic (30ms-10ms-30ms) - For important actions
onDelete() {
  this.haptic.heavy();
}
```

### Contextual Feedback Patterns

```typescript
// Success feedback
async saveData() {
  const result = await this.api.save();
  if (result.success) {
    this.haptic.success(); // Two quick pulses
  }
}

// Error feedback
async deleteItem() {
  try {
    await this.api.delete();
  } catch (error) {
    this.haptic.error(); // Three strong pulses
  }
}

// Warning feedback
validateInput() {
  if (!this.isValid) {
    this.haptic.warning(); // Two medium pulses
  }
}

// Notification feedback
onNewMessage() {
  this.haptic.notification(); // Three quick pulses
}
```

### Custom Patterns

```typescript
customVibration() {
  // Vibrate for 100ms, pause 50ms, vibrate 200ms
  this.haptic.custom([100, 50, 200]);

  // Single vibration for 500ms
  this.haptic.custom(500);
}
```

---

## Pull-to-Refresh Directive

### Basic Implementation

```typescript
import { Component } from '@angular/core';
import { PullToRefreshDirective } from '@app/shared';

@Component({
  selector: 'app-feed',
  standalone: true,
  imports: [PullToRefreshDirective],
  template: `
    <div
      class="feed-container"
      appPullToRefresh
      [threshold]="80"
      [enabled]="true"
      (refresh)="handleRefresh()">

      @for (item of items; track item.id) {
        <div class="feed-item">{{ item.title }}</div>
      }
    </div>
  `,
  styles: [`
    .feed-container {
      height: 100vh;
      overflow-y: auto;
    }
  `]
})
export class FeedComponent {
  items = [];

  async handleRefresh() {
    // Fetch new data
    const newItems = await this.fetchData();
    this.items = [...newItems, ...this.items];
  }
}
```

### Advanced Configuration

```typescript
@Component({
  template: `
    <div
      #refreshContainer
      appPullToRefresh
      [threshold]="100"
      [maxPullDistance]="150"
      [resistance]="0.6"
      [enabled]="!isLoading"
      [indicatorColor]="'#10b981'"
      [indicatorSize]="45"
      (refresh)="handleRefresh()"
      (pullStateChange)="onPullStateChange($event)">

      <div class="content">
        <!-- Your content here -->
      </div>
    </div>
  `
})
export class AdvancedRefreshComponent {
  @ViewChild('refreshContainer') refreshContainer!: ElementRef;
  isLoading = false;

  async handleRefresh() {
    this.isLoading = true;

    try {
      await this.loadData();
    } finally {
      this.isLoading = false;
      // Complete the refresh animation
      const directive = this.refreshContainer.nativeElement;
      if (directive.completeRefresh) {
        directive.completeRefresh();
      }
    }
  }

  onPullStateChange(state: { isPulling: boolean; distance: number; canRefresh: boolean }) {
    console.log('Pull state:', state);
    // You can use this to show custom UI feedback
  }
}
```

### With Haptic Feedback

```typescript
import { Component, inject } from '@angular/core';
import { HapticService } from '@app/core';
import { PullToRefreshDirective } from '@app/shared';

@Component({
  imports: [PullToRefreshDirective],
  template: `
    <div
      appPullToRefresh
      (refresh)="handleRefresh()"
      (pullStateChange)="onPullStateChange($event)">
      <!-- Content -->
    </div>
  `
})
export class HapticRefreshComponent {
  private haptic = inject(HapticService);
  private lastHapticTriggered = false;

  onPullStateChange(state: { canRefresh: boolean }) {
    if (state.canRefresh && !this.lastHapticTriggered) {
      this.haptic.light();
      this.lastHapticTriggered = true;
    } else if (!state.canRefresh) {
      this.lastHapticTriggered = false;
    }
  }

  async handleRefresh() {
    this.haptic.medium();
    await this.loadData();
  }
}
```

---

## Swipe Gesture Directive

### Basic Horizontal Swipe

```typescript
import { Component } from '@angular/core';
import { SwipeDirective, SwipeEvent } from '@app/shared';

@Component({
  selector: 'app-card-stack',
  standalone: true,
  imports: [SwipeDirective],
  template: `
    <div
      class="card"
      appSwipe
      [minDistance]="50"
      [detectHorizontal]="true"
      (swipeLeft)="onSwipeLeft($event)"
      (swipeRight)="onSwipeRight($event)">

      <h2>Swipe me!</h2>
    </div>
  `
})
export class CardStackComponent {
  onSwipeLeft(event: SwipeEvent) {
    console.log('Swiped left', event);
    // Reject or dismiss action
  }

  onSwipeRight(event: SwipeEvent) {
    console.log('Swiped right', event);
    // Accept or like action
  }
}
```

### Navigation with Swipe

```typescript
import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { SwipeDirective, SwipeEvent } from '@app/shared';

@Component({
  imports: [SwipeDirective],
  template: `
    <div
      class="page-container"
      appSwipe
      [minDistance]="80"
      [minVelocity]="0.5"
      (swipeLeft)="navigateNext()"
      (swipeRight)="navigatePrevious()">

      <router-outlet></router-outlet>
    </div>
  `
})
export class SwipeNavigationComponent {
  private router = inject(Router);

  navigateNext() {
    this.router.navigate(['/next-page']);
  }

  navigatePrevious() {
    this.router.navigate(['/previous-page']);
  }
}
```

### Vertical Swipe (Dismiss Modal)

```typescript
@Component({
  imports: [SwipeDirective],
  template: `
    <div
      class="modal"
      appSwipe
      [detectVertical]="true"
      [detectHorizontal]="false"
      [minDistance]="100"
      (swipeDown)="dismissModal()">

      <div class="modal-content">
        <!-- Modal content -->
      </div>
    </div>
  `
})
export class ModalComponent {
  dismissModal() {
    // Close modal with animation
    console.log('Modal dismissed');
  }
}
```

### Advanced: Card Swipe with Visual Feedback

```typescript
import { Component, inject } from '@angular/core';
import { HapticService } from '@app/core';
import { SwipeDirective, SwipeEvent } from '@app/shared';

@Component({
  imports: [SwipeDirective],
  template: `
    <div
      class="swipeable-card"
      appSwipe
      [minDistance]="60"
      [maxTime]="400"
      (swipe)="onSwipe($event)">

      <div class="card-content">
        {{ currentCard.title }}
      </div>
    </div>
  `
})
export class SwipeableCardComponent {
  private haptic = inject(HapticService);
  currentCard = { title: 'Card 1' };

  onSwipe(event: SwipeEvent) {
    console.log('Swipe detected:', event.direction, event.velocity);

    // Provide haptic feedback based on swipe velocity
    if (event.velocity > 1) {
      this.haptic.heavy();
    } else {
      this.haptic.medium();
    }

    // Handle different directions
    switch (event.direction) {
      case 'left':
        this.handleReject();
        break;
      case 'right':
        this.handleAccept();
        break;
      case 'up':
        this.handleBookmark();
        break;
      case 'down':
        this.handleSkip();
        break;
    }
  }

  handleReject() {
    console.log('Card rejected');
  }

  handleAccept() {
    console.log('Card accepted');
  }

  handleBookmark() {
    console.log('Card bookmarked');
  }

  handleSkip() {
    console.log('Card skipped');
  }
}
```

### Image Gallery Swipe

```typescript
@Component({
  imports: [SwipeDirective],
  template: `
    <div
      class="gallery"
      appSwipe
      [minDistance]="50"
      (swipeLeft)="nextImage()"
      (swipeRight)="previousImage()">

      <img [src]="images[currentIndex]" alt="Gallery image">

      <div class="indicators">
        @for (image of images; track $index) {
          <span [class.active]="$index === currentIndex"></span>
        }
      </div>
    </div>
  `
})
export class ImageGalleryComponent {
  images = ['image1.jpg', 'image2.jpg', 'image3.jpg'];
  currentIndex = 0;

  nextImage() {
    this.currentIndex = (this.currentIndex + 1) % this.images.length;
  }

  previousImage() {
    this.currentIndex =
      (this.currentIndex - 1 + this.images.length) % this.images.length;
  }
}
```

---

## Combining All Features

### Example: Complete Mobile-Optimized List

```typescript
import { Component, inject, ViewChild, ElementRef } from '@angular/core';
import { BiometricService, HapticService } from '@app/core';
import { PullToRefreshDirective, SwipeDirective, SwipeEvent } from '@app/shared';

@Component({
  selector: 'app-mobile-list',
  standalone: true,
  imports: [PullToRefreshDirective, SwipeDirective],
  template: `
    <div
      #container
      class="list-container"
      appPullToRefresh
      [enabled]="!isLoading"
      (refresh)="handleRefresh()">

      @for (item of items; track item.id) {
        <div
          class="list-item"
          appSwipe
          [minDistance]="80"
          (swipeLeft)="deleteItem(item)"
          (swipeRight)="archiveItem(item)">

          <div class="item-content">
            {{ item.title }}
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .list-container {
      height: 100vh;
      overflow-y: auto;
    }

    .list-item {
      padding: 1rem;
      border-bottom: 1px solid #e5e7eb;
    }
  `]
})
export class MobileListComponent {
  private haptic = inject(HapticService);
  private biometric = inject(BiometricService);

  @ViewChild('container') container!: ElementRef;

  items = [];
  isLoading = false;

  async handleRefresh() {
    this.haptic.light();
    this.isLoading = true;

    try {
      this.items = await this.fetchItems();
      this.haptic.success();
    } catch (error) {
      this.haptic.error();
    } finally {
      this.isLoading = false;
    }
  }

  async deleteItem(item: any) {
    this.haptic.warning();

    // Require biometric auth for deletion
    if (this.biometric.isEnabled()) {
      const authenticated = await this.biometric.authenticate();
      if (!authenticated) {
        this.haptic.error();
        return;
      }
    }

    await this.performDelete(item);
    this.haptic.success();
  }

  async archiveItem(item: any) {
    this.haptic.light();
    await this.performArchive(item);
  }

  private async fetchItems() {
    // API call
    return [];
  }

  private async performDelete(item: any) {
    // Delete logic
  }

  private async performArchive(item: any) {
    // Archive logic
  }
}
```

---

## Browser Compatibility Notes

### Biometric Service (WebAuthn)
- Chrome 67+
- Firefox 60+
- Safari 13+
- Edge 18+

### Haptic Service (Vibration API)
- Chrome for Android
- Firefox for Android
- Samsung Internet
- Not supported on iOS (Safari)

### Touch Events (Directives)
- All modern mobile browsers
- Desktop browsers with touch screens

## Best Practices

1. **Always check feature support** before using:
   ```typescript
   if (this.biometric.isSupported()) {
     // Use biometric features
   }
   ```

2. **Provide fallbacks** for unsupported features:
   ```typescript
   if (!this.haptic.isSupported()) {
     // Use visual feedback instead
   }
   ```

3. **Respect user preferences**:
   ```typescript
   if (this.haptic.isEnabled()) {
     this.haptic.light();
   }
   ```

4. **Use appropriate haptic intensities**:
   - Light: Subtle interactions (taps, toggles)
   - Medium: Confirmations, selections
   - Heavy: Important actions, errors

5. **Set reasonable gesture thresholds**:
   - Pull-to-refresh: 80-100px threshold
   - Swipe: 50-80px minimum distance
   - Adjust based on user testing

6. **Combine features thoughtfully**:
   - Use haptic feedback with pull-to-refresh
   - Add haptic feedback to swipe actions
   - Require biometric auth for sensitive swipes
