/**
 * Authentication-related constants
 *
 * Centralized configuration for authentication parameters
 * to avoid magic numbers scattered across the codebase.
 */
export const AUTH_CONSTANTS = {
  /**
   * Password hashing
   */
  PASSWORD_SALT_ROUNDS: 12,

  /**
   * Brute force protection
   */
  MAX_FAILED_LOGIN_ATTEMPTS: 5,
  ACCOUNT_LOCKOUT_DURATION_MINUTES: 30,

  /**
   * OTP (One-Time Password) settings
   * Note: These can be overridden by environment variables
   */
  OTP_DEFAULT_EXPIRATION_MINUTES: 5,
  OTP_DEFAULT_MAX_ATTEMPTS: 3,
  OTP_CODE_LENGTH: 6,

  /**
   * JWT Token expiration
   */
  ACCESS_TOKEN_EXPIRATION_SECONDS: 900, // 15 minutes
  REFRESH_TOKEN_EXPIRATION_SECONDS: 604800, // 7 days
  REFRESH_TOKEN_EXPIRATION_DAYS: 7,

  /**
   * Rate limiting
   */
  RATE_LIMIT: {
    REGISTER: { limit: 3, ttl: 60000 }, // 3 requests per minute
    LOGIN: { limit: 5, ttl: 60000 }, // 5 requests per minute
    SEND_OTP: { limit: 3, ttl: 60000 }, // 3 requests per minute
    VERIFY_OTP: { limit: 5, ttl: 60000 }, // 5 requests per minute
    REFRESH_TOKEN: { limit: 10, ttl: 60000 }, // 10 requests per minute
  },
} as const;

/**
 * Quote-related constants
 */
export const QUOTE_CONSTANTS = {
  /**
   * Quote validity period
   */
  DEFAULT_VALIDITY_DAYS: 7,

  /**
   * Pagination defaults
   */
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
} as const;

/**
 * Request-related constants
 */
export const REQUEST_CONSTANTS = {
  /**
   * Pagination defaults
   */
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,

  /**
   * Request number prefix
   */
  REQUEST_NUMBER_PREFIX: 'RF',
} as const;

/**
 * Notification-related constants
 */
export const NOTIFICATION_CONSTANTS = {
  /**
   * Pagination defaults
   */
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
} as const;
