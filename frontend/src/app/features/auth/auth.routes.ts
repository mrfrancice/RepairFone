import { Routes } from '@angular/router';

export const AUTH_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./components/login/login.component').then((m) => m.LoginComponent),
    title: 'Connexion - RepairFone',
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./components/register/register.component').then((m) => m.RegisterComponent),
    title: 'Inscription - RepairFone',
  },
  {
    path: 'verify-otp',
    loadComponent: () =>
      import('./components/verify-otp/verify-otp.component').then((m) => m.VerifyOtpComponent),
    title: 'Vérification OTP - RepairFone',
  },
  {
    path: 'forgot-password',
    loadComponent: () =>
      import('./components/forgot-password/forgot-password.component').then((m) => m.ForgotPasswordComponent),
    title: 'Mot de passe oublié - RepairFone',
  },
  {
    path: 'reset-password',
    loadComponent: () =>
      import('./components/reset-password/reset-password.component').then((m) => m.ResetPasswordComponent),
    title: 'Nouveau mot de passe - RepairFone',
  },
  {
    path: 'verify-email',
    loadComponent: () =>
      import('./components/verify-email/verify-email.component').then((m) => m.VerifyEmailComponent),
    title: 'Vérification email - RepairFone',
  },
];
