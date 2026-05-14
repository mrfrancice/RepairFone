/**
 * Formatting utility functions for RepairFone
 */

/**
 * Format price in FCFA
 */
export function formatPrice(price: number, currency = 'FCFA'): string {
  const formatted = new Intl.NumberFormat('fr-FR').format(price);
  return `${formatted} ${currency}`;
}

/**
 * Format phone number for display
 * @param phone - Phone number string
 * @returns Formatted phone number (XX XX XX XX XX)
 */
export function formatPhoneNumber(phone: string): string {
  // Remove all non-digit characters
  let clean = phone.replace(/\D/g, '');

  // Remove country code if present
  if (clean.startsWith('225')) {
    clean = clean.slice(3);
  } else if (clean.startsWith('00225')) {
    clean = clean.slice(5);
  }

  // Format as XX XX XX XX XX
  const parts = [];
  for (let i = 0; i < clean.length && i < 10; i += 2) {
    parts.push(clean.slice(i, i + 2));
  }

  return parts.join(' ');
}

/**
 * Format phone number with country code
 */
export function formatPhoneWithCountryCode(phone: string): string {
  const formatted = formatPhoneNumber(phone);
  return `+225 ${formatted}`;
}

/**
 * Format une distance exprimee en kilometres pour l'affichage.
 * - < 1 km : arrondi au metre ("450 m")
 * - < 10 km : 1 decimale ("3.4 km")
 * - >= 10 km : entier ("12 km")
 *
 * NB : le backend renvoie les distances en km (Haversine / 1000), c'est
 * pour ca que l'unite d'entree est km et non m.
 */
export function formatDistanceKm(km: number): string {
  if (km < 1) {
    return `${Math.round(km * 1000)} m`;
  }
  if (km < 10) {
    return `${km.toFixed(1)} km`;
  }
  return `${Math.round(km)} km`;
}

/**
 * Truncate text with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }

  return text.slice(0, maxLength - 3) + '...';
}

/**
 * Capitalize first letter
 */
export function capitalize(text: string): string {
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

/**
 * Title case (capitalize each word)
 */
export function titleCase(text: string): string {
  return text.toLowerCase().replace(/\b\w/g, char => char.toUpperCase());
}

/**
 * Format full name
 */
export function formatFullName(firstName?: string, lastName?: string): string {
  const parts = [firstName, lastName].filter(Boolean);
  return parts.join(' ') || 'Utilisateur';
}

/**
 * Get initials from name
 */
export function getInitials(firstName?: string, lastName?: string): string {
  const f = firstName?.charAt(0)?.toUpperCase() || '';
  const l = lastName?.charAt(0)?.toUpperCase() || '';

  return f + l || '?';
}

/**
 * Format file size
 */
export function formatFileSize(bytes: number): string {
  const units = ['o', 'Ko', 'Mo', 'Go'];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(unitIndex > 0 ? 1 : 0)} ${units[unitIndex]}`;
}

/**
 * Format percentage
 */
export function formatPercentage(value: number, decimals = 0): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Format count with unit
 */
export function formatCount(count: number, singular: string, plural?: string): string {
  const pluralForm = plural || singular + 's';
  return `${count} ${count <= 1 ? singular : pluralForm}`;
}

/**
 * Mask sensitive data (like phone or email)
 */
export function maskSensitive(text: string, visibleStart = 2, visibleEnd = 2): string {
  if (text.length <= visibleStart + visibleEnd) {
    return '*'.repeat(text.length);
  }

  const start = text.slice(0, visibleStart);
  const end = text.slice(-visibleEnd);
  const masked = '*'.repeat(text.length - visibleStart - visibleEnd);

  return start + masked + end;
}

/**
 * Clean phone number for API (digits only with country code)
 */
export function cleanPhoneNumber(phone: string): string {
  let clean = phone.replace(/\D/g, '');

  // Add country code if not present
  if (!clean.startsWith('225')) {
    clean = '225' + clean;
  }

  return clean;
}

/**
 * Slugify text for URLs
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9]+/g, '-')     // Replace non-alphanumeric with dashes
    .replace(/^-+|-+$/g, '');        // Remove leading/trailing dashes
}
