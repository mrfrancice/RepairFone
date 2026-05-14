/**
 * Extrait un message d'erreur affichable d'une valeur de type `unknown`
 * (typage moderne des `catch`).
 *
 * Ordre de priorite :
 *   1. err.message si err est un Error standard
 *   2. err.error.message si err vient d'une HttpErrorResponse NestJS
 *   3. err.error si c'est une string (cas /api/* qui renvoie une string brute)
 *   4. fallback fourni par l'appelant
 *
 * Utilisez ce helper plutot que `catch (err: any)` + `err.message` pour
 * conserver la type-safety sur les blocs catch (CLAUDE.md interdit `any`).
 */
export function getErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error && err.message) return err.message;
  if (typeof err === 'object' && err !== null) {
    const e = err as { message?: unknown; error?: unknown };
    if (typeof e.message === 'string' && e.message) return e.message;
    if (typeof e.error === 'string' && e.error) return e.error;
    if (typeof e.error === 'object' && e.error !== null) {
      const inner = e.error as { message?: unknown };
      if (typeof inner.message === 'string' && inner.message) return inner.message;
    }
  }
  if (typeof err === 'string' && err) return err;
  return fallback;
}
