import { Injectable, signal, computed } from '@angular/core';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  title?: string;
  duration?: number;
  dismissible?: boolean;
}

interface ToastOptions {
  title?: string;
  duration?: number;
  dismissible?: boolean;
}

const DEFAULT_DURATION = 4000;

@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly _toasts = signal<Toast[]>([]);

  readonly toasts = computed(() => this._toasts());

  private generateId(): string {
    return `toast-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  }

  private show(type: ToastType, message: string, options: ToastOptions = {}): string {
    const id = this.generateId();
    const duration = options.duration ?? DEFAULT_DURATION;

    const toast: Toast = {
      id,
      type,
      message,
      title: options.title,
      duration,
      dismissible: options.dismissible ?? true,
    };

    this._toasts.update(toasts => [...toasts, toast]);

    // Auto-dismiss if duration > 0
    if (duration > 0) {
      setTimeout(() => this.dismiss(id), duration);
    }

    return id;
  }

  success(message: string, options?: ToastOptions): string {
    return this.show('success', message, { title: 'Succès', ...options });
  }

  error(message: string, options?: ToastOptions): string {
    return this.show('error', message, { title: 'Erreur', duration: 6000, ...options });
  }

  warning(message: string, options?: ToastOptions): string {
    return this.show('warning', message, { title: 'Attention', ...options });
  }

  info(message: string, options?: ToastOptions): string {
    return this.show('info', message, { title: 'Information', ...options });
  }

  dismiss(id: string): void {
    this._toasts.update(toasts => toasts.filter(t => t.id !== id));
  }

  dismissAll(): void {
    this._toasts.set([]);
  }
}
