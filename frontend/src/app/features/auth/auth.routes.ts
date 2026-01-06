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
    title: 'Connexion - FastRepair',
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./components/register/register.component').then((m) => m.RegisterComponent),
    title: 'Inscription - FastRepair',
  },
  {
    path: 'verify-otp',
    loadComponent: () =>
      import('./components/verify-otp/verify-otp.component').then((m) => m.VerifyOtpComponent),
    title: 'Vérification OTP - FastRepair',
  },
  {
    path: 'forgot-password',
    loadComponent: () =>
      import('./components/forgot-password/forgot-password.component').then((m) => m.ForgotPasswordComponent),
    title: 'Mot de passe oublié - FastRepair',
  },
];
