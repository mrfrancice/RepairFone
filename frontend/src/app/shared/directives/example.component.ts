/**
 * EXAMPLE COMPONENT - Mobile Gestures Integration
 *
 * This is a reference implementation showing how to use all mobile gesture features together.
 * Copy and adapt this code to your own components as needed.
 *
 * DO NOT import this component in your application - it's for reference only.
 */

import { Component, inject, signal, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BiometricService, HapticService } from '@app/core';
import { PullToRefreshDirective, SwipeDirective, SwipeEvent } from '@app/shared';

interface TodoItem {
  id: string;
  title: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
}

@Component({
  selector: 'app-mobile-gestures-example',
  standalone: true,
  imports: [CommonModule, PullToRefreshDirective, SwipeDirective],
  template: `
    <div class="mobile-container">
      <!-- Header with biometric settings -->
      <header class="header">
        <h1>Mobile Gestures Demo</h1>

        @if (biometric.isSupported()) {
          <button
            class="biometric-toggle"
            (click)="toggleBiometric()">
            {{ biometric.isEnabled() ? '🔓' : '🔒' }}
            {{ biometric.isEnabled() ? 'Biometric ON' : 'Biometric OFF' }}
          </button>
        }

        <button
          class="haptic-toggle"
          (click)="toggleHaptic()">
          {{ haptic.isEnabled() ? '📳' : '🔇' }}
          {{ haptic.isEnabled() ? 'Haptic ON' : 'Haptic OFF' }}
        </button>
      </header>

      <!-- Pull to refresh container -->
      <div
        #refreshContainer
        class="content"
        appPullToRefresh
        [threshold]="80"
        [enabled]="!isLoading()"
        [indicatorColor]="'#3b82f6'"
        (refresh)="handleRefresh()"
        (pullStateChange)="onPullStateChange($event)">

        <!-- Status message -->
        @if (statusMessage()) {
          <div class="status-message" [class.error]="isError()">
            {{ statusMessage() }}
          </div>
        }

        <!-- Loading indicator -->
        @if (isLoading()) {
          <div class="loading">Loading...</div>
        }

        <!-- Todo list with swipe gestures -->
        <div class="todo-list">
          @for (item of todos(); track item.id) {
            <div
              class="todo-item"
              [class.completed]="item.completed"
              [class.priority-high]="item.priority === 'high'"
              appSwipe
              [minDistance]="60"
              [detectHorizontal]="true"
              (swipeLeft)="deleteTodo(item)"
              (swipeRight)="completeTodo(item)"
              (swipe)="onSwipe($event)">

              <div class="swipe-actions">
                <span class="action-left">✓ Complete</span>
                <span class="action-right">✗ Delete</span>
              </div>

              <div class="todo-content">
                <span class="todo-title">{{ item.title }}</span>
                <span class="todo-priority">{{ item.priority }}</span>
              </div>
            </div>
          } @empty {
            <div class="empty-state">
              <p>No todos yet!</p>
              <p>Pull down to refresh</p>
            </div>
          }
        </div>

        <!-- Image gallery with swipe navigation -->
        <div class="gallery-section">
          <h2>Swipe Gallery</h2>

          <div
            class="gallery"
            appSwipe
            [minDistance]="50"
            (swipeLeft)="nextImage()"
            (swipeRight)="previousImage()">

            <div class="gallery-image">
              <div class="image-placeholder">
                Image {{ currentImageIndex() + 1 }}
              </div>
            </div>

            <div class="gallery-indicators">
              @for (index of [0, 1, 2, 3, 4]; track index) {
                <span
                  class="indicator"
                  [class.active]="index === currentImageIndex()">
                </span>
              }
            </div>
          </div>
        </div>

        <!-- Haptic test buttons -->
        <div class="haptic-test">
          <h2>Haptic Feedback Test</h2>

          <div class="button-grid">
            <button (click)="testHaptic('light')">Light</button>
            <button (click)="testHaptic('medium')">Medium</button>
            <button (click)="testHaptic('heavy')">Heavy</button>
            <button (click)="testHaptic('success')">Success</button>
            <button (click)="testHaptic('error')">Error</button>
            <button (click)="testHaptic('warning')">Warning</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .mobile-container {
      height: 100vh;
      display: flex;
      flex-direction: column;
      background: #f9fafb;
    }

    .header {
      padding: 1rem;
      background: white;
      border-bottom: 1px solid #e5e7eb;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    .header h1 {
      font-size: 1.25rem;
      font-weight: 600;
      margin: 0;
      flex: 1;
    }

    .biometric-toggle,
    .haptic-toggle {
      padding: 0.5rem 1rem;
      border: 1px solid #e5e7eb;
      border-radius: 0.5rem;
      background: white;
      cursor: pointer;
      font-size: 0.875rem;
    }

    .content {
      flex: 1;
      overflow-y: auto;
      padding: 1rem;
    }

    .status-message {
      padding: 1rem;
      margin-bottom: 1rem;
      border-radius: 0.5rem;
      background: #dbeafe;
      color: #1e40af;
      text-align: center;
    }

    .status-message.error {
      background: #fee2e2;
      color: #991b1b;
    }

    .loading {
      text-align: center;
      padding: 2rem;
      color: #6b7280;
    }

    .todo-list {
      margin-bottom: 2rem;
    }

    .todo-item {
      position: relative;
      background: white;
      margin-bottom: 0.5rem;
      border-radius: 0.5rem;
      overflow: hidden;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      cursor: pointer;
      user-select: none;
    }

    .todo-item.completed {
      opacity: 0.6;
    }

    .todo-item.priority-high {
      border-left: 4px solid #ef4444;
    }

    .swipe-actions {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0 1rem;
      pointer-events: none;
    }

    .action-left {
      color: #10b981;
      font-weight: 600;
    }

    .action-right {
      color: #ef4444;
      font-weight: 600;
    }

    .todo-content {
      position: relative;
      padding: 1rem;
      background: white;
      display: flex;
      justify-content: space-between;
      align-items: center;
      z-index: 1;
    }

    .todo-title {
      font-weight: 500;
    }

    .todo-priority {
      font-size: 0.75rem;
      padding: 0.25rem 0.5rem;
      border-radius: 0.25rem;
      background: #e5e7eb;
      color: #374151;
      text-transform: uppercase;
    }

    .empty-state {
      text-align: center;
      padding: 3rem 1rem;
      color: #6b7280;
    }

    .gallery-section {
      margin-bottom: 2rem;
    }

    .gallery-section h2 {
      font-size: 1.125rem;
      font-weight: 600;
      margin-bottom: 1rem;
    }

    .gallery {
      background: white;
      border-radius: 0.5rem;
      overflow: hidden;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .gallery-image {
      width: 100%;
      aspect-ratio: 16 / 9;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .image-placeholder {
      font-size: 2rem;
      color: #9ca3af;
    }

    .gallery-indicators {
      display: flex;
      justify-content: center;
      gap: 0.5rem;
      padding: 1rem;
      background: white;
    }

    .indicator {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #d1d5db;
      transition: background 0.2s;
    }

    .indicator.active {
      background: #3b82f6;
    }

    .haptic-test h2 {
      font-size: 1.125rem;
      font-weight: 600;
      margin-bottom: 1rem;
    }

    .button-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 0.5rem;
    }

    .button-grid button {
      padding: 1rem;
      border: 1px solid #e5e7eb;
      border-radius: 0.5rem;
      background: white;
      cursor: pointer;
      font-weight: 500;
      transition: all 0.2s;
    }

    .button-grid button:active {
      transform: scale(0.95);
      background: #f3f4f6;
    }
  `]
})
export class MobileGesturesExampleComponent {
  // Inject services
  biometric = inject(BiometricService);
  haptic = inject(HapticService);

  // Component state
  todos = signal<TodoItem[]>([
    { id: '1', title: 'Swipe right to complete', completed: false, priority: 'high' },
    { id: '2', title: 'Swipe left to delete', completed: false, priority: 'medium' },
    { id: '3', title: 'Pull down to refresh', completed: false, priority: 'low' },
  ]);

  isLoading = signal(false);
  statusMessage = signal('');
  isError = signal(false);
  currentImageIndex = signal(0);

  @ViewChild('refreshContainer') refreshContainer?: ElementRef;

  /**
   * Toggle biometric authentication
   */
  async toggleBiometric() {
    if (this.biometric.isEnabled()) {
      this.biometric.disable();
      this.haptic.light();
      this.showStatus('Biometric authentication disabled');
    } else {
      const enabled = await this.biometric.enable('demo-user', 'demo@repairfone.com');
      if (enabled) {
        this.haptic.success();
        this.showStatus('Biometric authentication enabled');
      } else {
        this.haptic.error();
        this.showStatus('Failed to enable biometric authentication', true);
      }
    }
  }

  /**
   * Toggle haptic feedback
   */
  toggleHaptic() {
    this.haptic.toggle();
    if (this.haptic.isEnabled()) {
      this.haptic.light();
      this.showStatus('Haptic feedback enabled');
    } else {
      this.showStatus('Haptic feedback disabled');
    }
  }

  /**
   * Handle pull-to-refresh
   */
  async handleRefresh() {
    this.haptic.light();
    this.isLoading.set(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Add new todo items
    const newTodos: TodoItem[] = [
      {
        id: Date.now().toString(),
        title: `New task ${this.todos().length + 1}`,
        completed: false,
        priority: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)] as any,
      },
    ];

    this.todos.update(items => [...newTodos, ...items]);
    this.isLoading.set(false);
    this.haptic.success();
    this.showStatus('Refreshed successfully!');

    // Complete the refresh animation
    if (this.refreshContainer) {
      const directive = (this.refreshContainer.nativeElement as any).__ngContext__?.[8];
      if (directive?.completeRefresh) {
        directive.completeRefresh();
      }
    }
  }

  /**
   * Handle pull state changes for haptic feedback
   */
  onPullStateChange(state: { isPulling: boolean; distance: number; canRefresh: boolean }) {
    // Provide haptic feedback when threshold is reached
    if (state.canRefresh && state.isPulling) {
      this.haptic.light();
    }
  }

  /**
   * Complete a todo item
   */
  async completeTodo(item: TodoItem) {
    this.haptic.medium();

    this.todos.update(items =>
      items.map(t => t.id === item.id ? { ...t, completed: !t.completed } : t)
    );

    this.showStatus(item.completed ? 'Todo uncompleted' : 'Todo completed');
  }

  /**
   * Delete a todo item (requires biometric auth if enabled)
   */
  async deleteTodo(item: TodoItem) {
    this.haptic.warning();

    // Require biometric authentication if enabled
    if (this.biometric.isEnabled()) {
      const authenticated = await this.biometric.authenticate();
      if (!authenticated) {
        this.haptic.error();
        this.showStatus('Authentication required to delete', true);
        return;
      }
    }

    this.todos.update(items => items.filter(t => t.id !== item.id));
    this.haptic.success();
    this.showStatus('Todo deleted');
  }

  /**
   * Handle swipe events
   */
  onSwipe(event: SwipeEvent) {
    console.log('Swipe detected:', event);
  }

  /**
   * Navigate to next image
   */
  nextImage() {
    this.haptic.light();
    this.currentImageIndex.update(index => (index + 1) % 5);
  }

  /**
   * Navigate to previous image
   */
  previousImage() {
    this.haptic.light();
    this.currentImageIndex.update(index => (index - 1 + 5) % 5);
  }

  /**
   * Test different haptic feedback types
   */
  testHaptic(type: string) {
    switch (type) {
      case 'light':
        this.haptic.light();
        break;
      case 'medium':
        this.haptic.medium();
        break;
      case 'heavy':
        this.haptic.heavy();
        break;
      case 'success':
        this.haptic.success();
        break;
      case 'error':
        this.haptic.error();
        break;
      case 'warning':
        this.haptic.warning();
        break;
    }
    this.showStatus(`${type} haptic triggered`);
  }

  /**
   * Show status message
   */
  private showStatus(message: string, isError = false) {
    this.statusMessage.set(message);
    this.isError.set(isError);

    setTimeout(() => {
      this.statusMessage.set('');
      this.isError.set(false);
    }, 3000);
  }
}
