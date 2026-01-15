import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { SecureStorageService } from '../../../core/services/secure-storage.service';

/**
 * Guard that checks if onboarding has been completed.
 * If completed, redirects to /home.
 * If not completed, allows access to onboarding.
 */
export const onboardingGuard: CanActivateFn = async () => {
  const router = inject(Router);
  const storage = inject(SecureStorageService);

  try {
    const onboardingCompleted = await storage.get<boolean>('rf_onboarding_completed');

    if (onboardingCompleted) {
      // User has already seen onboarding, redirect to home
      router.navigate(['/home']);
      return false;
    }

    // User hasn't completed onboarding, allow access
    return true;
  } catch {
    // On error, allow access to onboarding
    return true;
  }
};
