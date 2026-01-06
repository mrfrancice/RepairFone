# Mobile Gestures Quick Reference

## Import Statements

```typescript
// Services
import { BiometricService, HapticService } from '@app/core';

// Directives
import { PullToRefreshDirective, SwipeDirective } from '@app/shared';

// Types
import type { SwipeEvent, SwipeDirection, PullToRefreshConfig } from '@app/shared';
```

---

## Biometric Service

### Quick Start
```typescript
biometric = inject(BiometricService);

// Check support
if (this.biometric.isSupported()) {
  // Enable
  await this.biometric.enable('user-id', 'user@email.com');

  // Authenticate
  const success = await this.biometric.authenticate();
}
```

### Methods
| Method | Returns | Description |
|--------|---------|-------------|
| `isSupported()` | `Signal<boolean>` | Check WebAuthn support |
| `isEnabled()` | `Signal<boolean>` | Check if enabled |
| `register(userId, userName)` | `Promise<boolean>` | Register credential |
| `authenticate()` | `Promise<boolean>` | Authenticate user |
| `enable(userId, userName)` | `Promise<boolean>` | Enable biometric |
| `disable()` | `void` | Disable biometric |
| `clearCredentials()` | `void` | Clear all credentials |

---

## Haptic Service

### Quick Start
```typescript
haptic = inject(HapticService);

// Basic usage
this.haptic.light();   // Tap feedback
this.haptic.medium();  // Confirmation
this.haptic.heavy();   // Important action
```

### Methods
| Method | Pattern | Use Case |
|--------|---------|----------|
| `light()` | 10ms | Button taps, toggles |
| `medium()` | 20ms | Confirmations, selections |
| `heavy()` | 30-10-30ms | Important actions |
| `success()` | 10-50-15ms | Success operations |
| `error()` | 30-50-30-50-30ms | Errors, failures |
| `warning()` | 20-50-20ms | Warnings |
| `notification()` | 10-50-10-50-10ms | Notifications, alerts |
| `custom(pattern)` | Custom | Custom vibration |
| `cancel()` | - | Stop vibration |

### State Management
```typescript
haptic.isSupported()  // Signal<boolean>
haptic.isEnabled()    // Signal<boolean>
haptic.enable()       // Enable haptic
haptic.disable()      // Disable haptic
haptic.toggle()       // Toggle state
```

---

## Pull-to-Refresh Directive

### Quick Start
```typescript
<div appPullToRefresh (refresh)="handleRefresh()">
  <!-- Content -->
</div>

async handleRefresh() {
  await this.loadData();
  // Refresh completes automatically
}
```

### Configuration
```typescript
<div appPullToRefresh
     [threshold]="80"
     [maxPullDistance]="150"
     [resistance]="0.5"
     [enabled]="true"
     [indicatorColor]="'#3b82f6'"
     [indicatorSize]="40"
     (refresh)="handleRefresh()"
     (pullStateChange)="onPullStateChange($event)">
```

### Inputs
| Input | Type | Default | Description |
|-------|------|---------|-------------|
| `threshold` | `number` | 80 | Trigger distance (px) |
| `maxPullDistance` | `number` | 150 | Max pull distance (px) |
| `resistance` | `number` | 0.5 | Pull resistance (0-1) |
| `enabled` | `boolean` | true | Enable/disable |
| `indicatorColor` | `string` | '#3b82f6' | Spinner color |
| `indicatorSize` | `number` | 40 | Spinner size (px) |

### Outputs
| Output | Type | Description |
|--------|------|-------------|
| `refresh` | `void` | Triggered on refresh |
| `pullStateChange` | `{isPulling, distance, canRefresh}` | Pull state updates |

---

## Swipe Directive

### Quick Start
```typescript
<div appSwipe
     (swipeLeft)="handleSwipeLeft($event)"
     (swipeRight)="handleSwipeRight($event)">
  <!-- Swipeable content -->
</div>

handleSwipeLeft(event: SwipeEvent) {
  console.log(event.direction, event.distance, event.velocity);
}
```

### Configuration
```typescript
<div appSwipe
     [swipeEnabled]="true"
     [minDistance]="50"
     [maxTime]="300"
     [minVelocity]="0.3"
     [detectVertical]="false"
     [detectHorizontal]="true"
     (swipeLeft)="onSwipeLeft($event)"
     (swipeRight)="onSwipeRight($event)"
     (swipeUp)="onSwipeUp($event)"
     (swipeDown)="onSwipeDown($event)"
     (swipe)="onAnySwipe($event)">
```

### Inputs
| Input | Type | Default | Description |
|-------|------|---------|-------------|
| `swipeEnabled` | `boolean` | true | Enable detection |
| `minDistance` | `number` | 50 | Min distance (px) |
| `maxTime` | `number` | 300 | Max duration (ms) |
| `minVelocity` | `number` | 0.3 | Min velocity (px/ms) |
| `detectVertical` | `boolean` | false | Detect up/down |
| `detectHorizontal` | `boolean` | true | Detect left/right |

### Outputs
| Output | Type | Description |
|--------|------|-------------|
| `swipeLeft` | `SwipeEvent` | Left swipe |
| `swipeRight` | `SwipeEvent` | Right swipe |
| `swipeUp` | `SwipeEvent` | Up swipe |
| `swipeDown` | `SwipeEvent` | Down swipe |
| `swipe` | `SwipeEvent` | Any swipe |

### SwipeEvent Interface
```typescript
interface SwipeEvent {
  direction: 'left' | 'right' | 'up' | 'down';
  distance: number;    // Swipe distance in pixels
  velocity: number;    // Swipe velocity in px/ms
  duration: number;    // Swipe duration in ms
}
```

---

## Common Patterns

### Pattern 1: Authenticated Delete
```typescript
async deleteItem(item: any) {
  this.haptic.warning();

  if (this.biometric.isEnabled()) {
    const auth = await this.biometric.authenticate();
    if (!auth) {
      this.haptic.error();
      return;
    }
  }

  await this.performDelete(item);
  this.haptic.success();
}
```

### Pattern 2: Swipe with Haptic
```typescript
<div appSwipe (swipe)="onSwipe($event)">

onSwipe(event: SwipeEvent) {
  if (event.velocity > 1) {
    this.haptic.heavy();
  } else {
    this.haptic.light();
  }

  // Handle swipe...
}
```

### Pattern 3: Pull-to-Refresh with Haptic
```typescript
<div appPullToRefresh
     (refresh)="refresh()"
     (pullStateChange)="onPull($event)">

onPull(state: { canRefresh: boolean }) {
  if (state.canRefresh) {
    this.haptic.light();
  }
}

async refresh() {
  this.haptic.medium();
  await this.loadData();
  this.haptic.success();
}
```

### Pattern 4: Combined Mobile Experience
```typescript
@Component({
  imports: [PullToRefreshDirective, SwipeDirective],
  template: `
    <div appPullToRefresh (refresh)="refresh()">
      @for (item of items; track item.id) {
        <div appSwipe
             (swipeLeft)="delete(item)"
             (swipeRight)="complete(item)">
          {{ item.title }}
        </div>
      }
    </div>
  `
})
```

---

## Browser Support

| Feature | Chrome | Firefox | Safari | Edge | Notes |
|---------|--------|---------|--------|------|-------|
| Biometric (WebAuthn) | 67+ | 60+ | 13+ | 18+ | Full support |
| Haptic (Vibration) | Android | Android | ❌ | Android | iOS unsupported |
| Touch Events | ✅ | ✅ | ✅ | ✅ | Universal |

---

## Testing Checklist

- [ ] Test on actual mobile devices (not just emulator)
- [ ] Verify haptic feedback on Android devices
- [ ] Test biometric auth with fingerprint/face ID
- [ ] Check pull-to-refresh threshold sensitivity
- [ ] Verify swipe gesture accuracy
- [ ] Test with haptic disabled
- [ ] Test with biometric unavailable
- [ ] Check accessibility (screen readers)
- [ ] Verify touch event performance
- [ ] Test in both portrait and landscape

---

## Performance Tips

1. **Debounce rapid gestures** - Prevent multiple triggers
2. **Use haptic sparingly** - Too much is annoying
3. **Check support first** - Avoid unnecessary processing
4. **Clean up listeners** - Directives auto-cleanup
5. **Optimize touch handlers** - Use passive listeners when possible
6. **Test on low-end devices** - Ensure smooth performance

---

## Troubleshooting

### Biometric not working
- Check `isSupported()` signal
- Verify HTTPS connection (required for WebAuthn)
- Ensure user has enrolled biometrics on device
- Check browser console for errors

### Haptic not working
- Check `isSupported()` signal
- Verify on Android device (iOS unsupported)
- Check user hasn't disabled in settings
- Ensure device isn't in silent mode

### Pull-to-refresh not triggering
- Verify container is scrollable
- Check `enabled` input is true
- Ensure scroll position is at top
- Verify threshold configuration

### Swipe not detecting
- Check touch events are not prevented elsewhere
- Verify `minDistance` isn't too large
- Ensure `detectHorizontal` or `detectVertical` is true
- Check `swipeEnabled` input

---

## Additional Resources

- Full examples: `USAGE_EXAMPLES.md`
- Implementation details: `MOBILE_GESTURES_IMPLEMENTATION.md`
- Example component: `example.component.ts`
- MDN WebAuthn: https://developer.mozilla.org/en-US/docs/Web/API/Web_Authentication_API
- MDN Vibration: https://developer.mozilla.org/en-US/docs/Web/API/Vibration_API
