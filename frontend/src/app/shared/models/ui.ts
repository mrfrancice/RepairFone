// ============================================
// SHARED — Helpers UI generiques (sans metier)
// ============================================

export interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

export interface TabItem {
  id: string;
  label: string;
  icon?: string;
  badge?: number;
}

export interface MenuItem {
  id: string;
  label: string;
  icon?: string;
  route?: string;
  action?: () => void;
  badge?: number;
  disabled?: boolean;
}

// OnboardingSlide : type d'affichage utilise uniquement par features/onboarding.
// Reste ici temporairement, sera deplace dans features/onboarding en Phase 3.
export interface OnboardingSlide {
  id: string;
  title: string;
  description: string;
  icon?: string;
  image?: string;
}
