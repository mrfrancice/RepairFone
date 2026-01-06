import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthStore } from '../stores/auth.store';

export const authGuard: CanActivateFn = () => {
  const authStore = inject(AuthStore);
  const router = inject(Router);

  if (authStore.isAuthenticated()) {
    return true;
  }

  router.navigate(['/auth/login']);
  return false;
};

export const adminGuard: CanActivateFn = () => {
  const authStore = inject(AuthStore);
  const router = inject(Router);

  if (!authStore.isAuthenticated()) {
    router.navigate(['/auth/login']);
    return false;
  }

  if (authStore.isAdmin()) {
    return true;
  }

  // Redirect non-admin users to home
  router.navigate(['/home']);
  return false;
};

// Guard to block admins from accessing client/repairer pages
export const noAdminGuard: CanActivateFn = () => {
  const authStore = inject(AuthStore);
  const router = inject(Router);

  // If user is admin, redirect to admin dashboard
  if (authStore.isAdmin()) {
    router.navigate(['/admin']);
    return false;
  }

  return true;
};

// Guard to block repairers from accessing client-only pages (like search/create request)
export const clientOnlyGuard: CanActivateFn = () => {
  const authStore = inject(AuthStore);
  const router = inject(Router);

  // If user is a repairer, redirect to repairer dashboard
  if (authStore.isRepairer()) {
    router.navigate(['/repairer']);
    return false;
  }

  return true;
};
