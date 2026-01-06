import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthStore } from '../../../core/stores/auth.store';

export const repairerGuard: CanActivateFn = () => {
  const authStore = inject(AuthStore);
  const router = inject(Router);

  // Check if user is authenticated
  if (!authStore.isAuthenticated()) {
    router.navigate(['/auth/login']);
    return false;
  }

  // Check if user is a repairer
  const user = authStore.user();
  if (user?.role !== 'repairer') {
    router.navigate(['/home']);
    return false;
  }

  return true;
};

// Guard for profile setup - allows access even without complete profile
export const repairerSetupGuard: CanActivateFn = () => {
  const authStore = inject(AuthStore);
  const router = inject(Router);

  if (!authStore.isAuthenticated()) {
    router.navigate(['/auth/login']);
    return false;
  }

  const user = authStore.user();
  if (user?.role !== 'repairer') {
    router.navigate(['/home']);
    return false;
  }

  return true;
};
