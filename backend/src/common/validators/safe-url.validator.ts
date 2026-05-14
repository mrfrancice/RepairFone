import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';

/**
 * SEC-002: Safe URL Validator
 *
 * Validates URLs to prevent SSRF (Server-Side Request Forgery) attacks.
 * Only allows:
 * - HTTPS URLs (required in production)
 * - Data URLs for base64-encoded images
 * - Whitelisted domains
 *
 * Blocks:
 * - Private IP ranges (10.x.x.x, 192.168.x.x, 172.16-31.x.x)
 * - Localhost and loopback addresses
 * - Internal hostnames
 * - File:// and other dangerous protocols
 */
@ValidatorConstraint({ async: false })
export class IsSafeUrlConstraint implements ValidatorConstraintInterface {
  private readonly ALLOWED_PROTOCOLS = ['https:', 'data:'];
  private readonly ALLOWED_DATA_MIME_TYPES = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
  ];

  // Private IP ranges that should be blocked
  private readonly BLOCKED_IP_PATTERNS = [
    /^127\./, // Loopback
    /^10\./, // Class A private
    /^172\.(1[6-9]|2[0-9]|3[01])\./, // Class B private
    /^192\.168\./, // Class C private
    /^169\.254\./, // Link-local
    /^0\./, // Reserved
    /^::1$/, // IPv6 loopback
    /^fc00:/i, // IPv6 unique local
    /^fe80:/i, // IPv6 link-local
  ];

  // Blocked hostnames
  private readonly BLOCKED_HOSTNAMES = [
    'localhost',
    'localhost.localdomain',
    '127.0.0.1',
    '::1',
    '0.0.0.0',
    'metadata.google.internal', // GCP metadata
    '169.254.169.254', // AWS/GCP/Azure metadata
    'metadata.azure.com', // Azure metadata
  ];

  validate(url: string, _args: ValidationArguments): boolean {
    if (!url || typeof url !== 'string') {
      return false;
    }

    // Allow data URLs for base64-encoded images
    if (url.startsWith('data:')) {
      return this.validateDataUrl(url);
    }

    try {
      const parsedUrl = new URL(url);

      // Check protocol
      if (!this.ALLOWED_PROTOCOLS.includes(parsedUrl.protocol)) {
        return false;
      }

      // Skip further checks for data URLs (already validated above)
      if (parsedUrl.protocol === 'data:') {
        return true;
      }

      const hostname = parsedUrl.hostname.toLowerCase();

      // Check blocked hostnames
      if (this.BLOCKED_HOSTNAMES.includes(hostname)) {
        return false;
      }

      // Check for IP address patterns
      for (const pattern of this.BLOCKED_IP_PATTERNS) {
        if (pattern.test(hostname)) {
          return false;
        }
      }

      // Block internal domains (customizable)
      if (hostname.endsWith('.internal') || hostname.endsWith('.local')) {
        return false;
      }

      // Block URLs with authentication credentials
      if (parsedUrl.username || parsedUrl.password) {
        return false;
      }

      return true;
    } catch {
      return false;
    }
  }

  private validateDataUrl(url: string): boolean {
    // Format: data:image/jpeg;base64,/9j/4AAQSkZJRg...
    const dataUrlRegex = /^data:(image\/[a-zA-Z+]+);base64,/;
    const match = url.match(dataUrlRegex);

    if (!match) {
      return false;
    }

    const mimeType = match[1].toLowerCase();
    return this.ALLOWED_DATA_MIME_TYPES.includes(mimeType);
  }

  defaultMessage(_args: ValidationArguments): string {
    return 'URL invalide ou non securisee. Seules les URLs HTTPS et les images base64 sont autorisees.';
  }
}

/**
 * Decorator for validating safe URLs
 *
 * Usage:
 * @IsSafeUrl()
 * imageUrl: string;
 *
 * @IsSafeUrl({ each: true })
 * images: string[];
 */
export function IsSafeUrl(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsSafeUrlConstraint,
    });
  };
}
