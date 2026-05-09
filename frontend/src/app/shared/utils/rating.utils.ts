/**
 * Rating/Stars utility functions for RepairFone
 */

export interface StarConfig {
  filled: boolean;
  half: boolean;
  empty: boolean;
}

/**
 * Generate star configuration array from rating
 * @param rating - Rating value (0-5)
 * @param maxStars - Maximum number of stars (default: 5)
 * @returns Array of star configurations
 */
export function generateStars(rating: number, maxStars = 5): StarConfig[] {
  const stars: StarConfig[] = [];
  const clampedRating = Math.min(Math.max(rating, 0), maxStars);

  for (let i = 1; i <= maxStars; i++) {
    if (i <= Math.floor(clampedRating)) {
      stars.push({ filled: true, half: false, empty: false });
    } else if (i - clampedRating < 1 && i - clampedRating > 0) {
      stars.push({ filled: false, half: true, empty: false });
    } else {
      stars.push({ filled: false, half: false, empty: true });
    }
  }

  return stars;
}

/**
 * Generate star display string (emoji-based)
 * @param rating - Rating value (0-5)
 * @returns String with star emojis
 */
export function getStarString(rating: number): string {
  const fullStars = Math.floor(rating);
  const hasHalf = rating - fullStars >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalf ? 1 : 0);

  return '★'.repeat(fullStars) +
         (hasHalf ? '½' : '') +
         '☆'.repeat(emptyStars);
}

/**
 * Get rating label in French
 * @param rating - Rating value (0-5)
 * @returns French label for the rating
 */
export function getRatingLabel(rating: number): string {
  if (rating >= 4.5) return 'Excellent';
  if (rating >= 4) return 'Très bien';
  if (rating >= 3.5) return 'Bien';
  if (rating >= 3) return 'Correct';
  if (rating >= 2) return 'Moyen';
  if (rating >= 1) return 'Insuffisant';
  return 'Non évalué';
}

/**
 * Get rating color based on value
 * @param rating - Rating value (0-5)
 * @returns CSS color string
 */
export function getRatingColor(rating: number): string {
  if (rating >= 4.5) return '#4CAF50'; // Green
  if (rating >= 4) return '#4CAF50';   // Light green
  if (rating >= 3.5) return '#84cc16'; // Lime
  if (rating >= 3) return '#eab308';   // Yellow
  if (rating >= 2) return '#f97316';   // Orange
  if (rating >= 1) return '#F44336';   // Red
  return '#9ca3af'; // Gray for unrated
}

/**
 * Format rating display (e.g., "4.5/5")
 * @param rating - Rating value
 * @param maxRating - Maximum rating value (default: 5)
 * @returns Formatted rating string
 */
export function formatRating(rating: number, maxRating = 5): string {
  return `${rating.toFixed(1)}/${maxRating}`;
}

/**
 * Calculate average rating from array of ratings
 * @param ratings - Array of rating values
 * @returns Average rating or 0 if empty
 */
export function calculateAverageRating(ratings: number[]): number {
  if (ratings.length === 0) return 0;

  const sum = ratings.reduce((acc, val) => acc + val, 0);
  return Math.round((sum / ratings.length) * 10) / 10;
}

/**
 * Get rating distribution (count per star level)
 * @param ratings - Array of rating values
 * @returns Object with counts per star level
 */
export function getRatingDistribution(ratings: number[]): Record<number, number> {
  const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

  ratings.forEach(rating => {
    const rounded = Math.round(rating);
    if (rounded >= 1 && rounded <= 5) {
      distribution[rounded]++;
    }
  });

  return distribution;
}

/**
 * Get percentage of ratings at each star level
 * @param ratings - Array of rating values
 * @returns Object with percentages per star level
 */
export function getRatingPercentages(ratings: number[]): Record<number, number> {
  const distribution = getRatingDistribution(ratings);
  const total = ratings.length || 1;

  return {
    1: Math.round((distribution[1] / total) * 100),
    2: Math.round((distribution[2] / total) * 100),
    3: Math.round((distribution[3] / total) * 100),
    4: Math.round((distribution[4] / total) * 100),
    5: Math.round((distribution[5] / total) * 100),
  };
}
