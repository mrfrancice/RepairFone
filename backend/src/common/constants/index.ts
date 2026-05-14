/**
 * Shared Constants for RepairFone Backend
 * CODE-009: Centralized constants for reuse across the application
 */

// =============================================================================
// PAGINATION DEFAULTS
// =============================================================================

export const PAGINATION = {
  /** Default number of items per page */
  DEFAULT_LIMIT: 20,
  /** Maximum allowed items per page */
  MAX_LIMIT: 100,
  /** Default page number */
  DEFAULT_PAGE: 1,
  /** Default limit for chat messages */
  CHAT_MESSAGE_LIMIT: 50,
  /** Default limit for audit logs */
  AUDIT_LOG_LIMIT: 50,
} as const;

// =============================================================================
// HTTP STATUS MESSAGES (French)
// =============================================================================

export const HTTP_MESSAGES = {
  // Success messages
  SUCCESS: 'Operation reussie',
  CREATED: 'Ressource creee avec succes',
  UPDATED: 'Mise a jour effectuee avec succes',
  DELETED: 'Suppression effectuee avec succes',

  // Error messages - Not Found
  NOT_FOUND: {
    USER: 'Utilisateur non trouve',
    REPAIRER: 'Reparateur non trouve',
    REPAIRER_PROFILE: 'Profil reparateur non trouve',
    REQUEST: 'Demande de reparation non trouvee',
    QUOTE: 'Devis non trouve',
    DEVICE: 'Appareil non trouve',
    SERVICE_TYPE: 'Type de service non trouve',
    NOTIFICATION: 'Notification non trouvee',
    DISPUTE: 'Litige non trouve',
    SESSION: 'Session non trouvee',
    CONVERSATION: 'Conversation non trouvee',
    EXPERT: 'Expert non trouve',
  },

  // Error messages - Conflict
  CONFLICT: {
    PHONE_EXISTS: 'Ce numero de telephone est deja utilise',
    EMAIL_EXISTS: 'Cette adresse email est deja utilisee',
    QUOTE_EXISTS: 'Un devis actif existe deja pour cette demande',
    DISPUTE_EXISTS: 'Un litige existe deja pour cette demande',
  },

  // Error messages - Forbidden
  FORBIDDEN: {
    ACCESS_DENIED: 'Acces non autorise',
    NOT_YOUR_REQUEST: "Vous n'avez pas acces a cette demande",
    NOT_YOUR_QUOTE: "Vous n'avez pas acces a ce devis",
    NOT_YOUR_DISPUTE: "Vous n'avez pas acces a ce litige",
    NOT_YOUR_SESSION: "Cette session n'est pas pour vous",
    NOT_YOUR_CONVERSATION: 'Acces non autorise a cette conversation',
    NOT_YOUR_PAYMENT: "Vous n'avez pas acces a ce paiement",
    NOT_YOUR_REVIEW: "Vous n'avez pas acces a cet avis",
    NOT_AN_EXPERT: "Vous n'etes pas un expert",
    NO_REPAIRER_ASSIGNED: "Cette demande n'a pas encore de reparateur assigne",
    CANNOT_MODIFY_ADMIN: 'Impossible de modifier un compte admin',
    CANNOT_DELETE_ADMIN: 'Impossible de supprimer un compte admin',
    CANNOT_CREATE_DISPUTE:
      'Vous ne pouvez pas creer un litige pour cette demande',
    CANNOT_ADD_EVIDENCE: 'Vous ne pouvez pas ajouter des preuves a ce litige',
    CANNOT_CANCEL_DISPUTE: 'Vous ne pouvez pas annuler ce litige',
    CANNOT_ACCEPT_QUOTE: 'Vous ne pouvez pas accepter ce devis',
    CANNOT_REJECT_QUOTE: 'Vous ne pouvez pas refuser ce devis',
    CANNOT_MODIFY_QUOTE: 'Vous ne pouvez pas modifier ce devis',
    CANNOT_ACCEPT_COUNTER:
      'Vous ne pouvez pas accepter cette contre-proposition',
    CANNOT_CANCEL_NEGOTIATION: 'Vous ne pouvez pas annuler cette negociation',
    CANNOT_RATE_SESSION: 'Vous ne pouvez pas noter cette session',
  },

  // Error messages - Bad Request
  BAD_REQUEST: {
    INVALID_OTP: 'Code OTP invalide ou expire',
    OTP_MAX_ATTEMPTS: 'Nombre maximum de tentatives atteint',
    INVALID_CREDENTIALS: 'Identifiants incorrects',
    REJECTION_REASON_REQUIRED: 'Le motif de rejet est obligatoire',
    ALREADY_VERIFIED: 'Ce reparateur est deja verifie',
    ALREADY_REJECTED: 'Ce reparateur est deja rejete',
    ALREADY_ACTIVE: 'Ce compte est deja actif',
    ALREADY_SUSPENDED: 'Ce compte est deja suspendu',
    NOT_SUSPENDED: "Ce reparateur n'est pas suspendu",
    QUOTE_EXPIRED: 'Ce devis a expire',
    QUOTE_CANNOT_BE_ACCEPTED: 'Ce devis ne peut plus etre accepte',
    QUOTE_CANNOT_BE_REJECTED: 'Ce devis ne peut plus etre refuse',
    QUOTE_CANNOT_BE_MODIFIED: 'Ce devis ne peut plus etre modifie',
    QUOTE_NOT_REJECTED: "Ce devis n'a pas ete refuse",
    QUOTE_ALREADY_ACCEPTED: 'Ce devis a deja ete accepte',
    NO_COUNTER_OFFER: 'Aucune contre-proposition de prix trouvee',
    DISPUTE_ALREADY_RESOLVED: 'Ce litige est deja resolu',
    DISPUTE_CANNOT_BE_CANCELLED: 'Ce litige ne peut plus etre annule',
    SESSION_CANNOT_BE_ACCEPTED: 'Cette session ne peut plus etre acceptee',
    SESSION_CANNOT_BE_STARTED: 'Cette session ne peut pas etre demarree',
    SESSION_CANNOT_BE_COMPLETED: 'Cette session ne peut pas etre terminee',
    SESSION_NOT_COMPLETED: "Cette session n'est pas terminee",
    SESSION_ALREADY_RATED: 'Cette session a deja ete notee',
    SESSION_NOT_ACTIVE: "Cette session n'est pas active",
    EXPERT_NOT_AVAILABLE: "Cet expert n'est pas disponible",
    EXPERT_NO_CONSEIL_TYPE: 'Cet expert ne propose pas ce type de conseil',
    EXPERT_NO_FORMAT: 'Cet expert ne propose pas ce format de conseil',
  },

  // Error messages - Unauthorized
  UNAUTHORIZED: {
    INVALID_CREDENTIALS: 'Identifiants incorrects',
    ACCOUNT_LOCKED: 'Compte temporairement verrouille',
    ACCOUNT_SUSPENDED: 'Votre compte est suspendu',
    PHONE_NOT_VERIFIED: "Veuillez d'abord verifier votre numero de telephone",
    INVALID_REFRESH_TOKEN: 'Token de rafraichissement invalide',
    USER_NOT_FOUND: 'Utilisateur non trouve',
  },
} as const;

// =============================================================================
// VALIDATION MESSAGES (French)
// =============================================================================

export const VALIDATION_MESSAGES = {
  // Password validation
  PASSWORD: {
    REQUIRED: 'Le mot de passe est requis',
    MIN_LENGTH: 'Le mot de passe doit contenir au moins 8 caracteres',
    UPPERCASE: 'Le mot de passe doit contenir au moins une lettre majuscule',
    LOWERCASE: 'Le mot de passe doit contenir au moins une lettre minuscule',
    DIGIT: 'Le mot de passe doit contenir au moins un chiffre',
    SPECIAL_CHAR:
      'Le mot de passe doit contenir au moins un caractere special (!@#$%^&*(),.?":{}|<>)',
    INVALID: 'Le mot de passe ne respecte pas les criteres de securite',
    FULL_REQUIREMENTS:
      'Le mot de passe doit contenir au moins 8 caracteres, une majuscule, une minuscule, un chiffre et un caractere special',
  },

  // Phone validation
  PHONE: {
    REQUIRED: 'Le numero de telephone est requis',
    INVALID: 'Le numero de telephone est invalide',
    FORMAT: 'Le format du numero de telephone est invalide',
  },

  // Email validation
  EMAIL: {
    REQUIRED: "L'adresse email est requise",
    INVALID: "L'adresse email est invalide",
  },

  // Generic validation
  REQUIRED: 'Ce champ est requis',
  INVALID: 'La valeur fournie est invalide',
  TOO_SHORT: 'La valeur est trop courte',
  TOO_LONG: 'La valeur est trop longue',
  MUST_BE_NUMBER: 'La valeur doit etre un nombre',
  MUST_BE_POSITIVE: 'La valeur doit etre positive',
} as const;

// =============================================================================
// COMMON REGEX PATTERNS
// =============================================================================

export const REGEX_PATTERNS = {
  /**
   * Phone number pattern for Ivory Coast
   * Supports formats: +225 XX XX XX XX XX or 0X XX XX XX XX
   * Allows optional spaces
   */
  PHONE_CI: /^(\+225|00225)?[0-9]{10}$/,

  /**
   * International phone pattern (E.164 format)
   * Supports formats: +XXXXXXXXXXXX (10-15 digits)
   */
  PHONE_INTERNATIONAL: /^\+?[1-9]\d{9,14}$/,

  /**
   * Basic email validation pattern
   */
  EMAIL: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,

  /**
   * Password pattern: min 8 chars, 1 uppercase, 1 lowercase, 1 digit, 1 special char
   */
  STRONG_PASSWORD:
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])[A-Za-z\d!@#$%^&*(),.?":{}|<>]{8,}$/,

  /**
   * UUID v4 pattern
   */
  UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,

  /**
   * Alphanumeric pattern (letters and numbers only)
   */
  ALPHANUMERIC: /^[a-zA-Z0-9]+$/,

  /**
   * Slug pattern (lowercase letters, numbers, hyphens)
   */
  SLUG: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
} as const;

// =============================================================================
// AUTHENTICATION CONSTANTS
// =============================================================================

export const AUTH = {
  /** Maximum failed login attempts before lockout */
  MAX_FAILED_ATTEMPTS: 5,
  /** Account lockout duration in minutes */
  LOCKOUT_DURATION_MINUTES: 30,
  /** Default OTP expiration in minutes */
  OTP_EXPIRATION_MINUTES: 5,
  /** Maximum OTP verification attempts */
  OTP_MAX_ATTEMPTS: 3,
  /** Access token expiration in seconds (15 minutes) */
  ACCESS_TOKEN_EXPIRY: 900,
  /** Refresh token expiration in days */
  REFRESH_TOKEN_EXPIRY_DAYS: 7,
  /** Password salt rounds for bcrypt */
  PASSWORD_SALT_ROUNDS: 12,
  /** Refresh token salt rounds for bcrypt */
  REFRESH_TOKEN_SALT_ROUNDS: 10,
} as const;

// =============================================================================
// FILE UPLOAD CONSTANTS
// =============================================================================

export const FILE_UPLOAD = {
  /** Maximum file size in bytes (5MB) */
  MAX_SIZE: 5 * 1024 * 1024,
  /** Allowed image MIME types */
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  /** Allowed document MIME types */
  ALLOWED_DOCUMENT_TYPES: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ],
} as const;

// =============================================================================
// SUCCESS MESSAGES (French)
// =============================================================================

export const SUCCESS_MESSAGES = {
  // Account management
  ACCOUNT_CREATED:
    'Compte cree. Veuillez verifier votre telephone avec le code OTP envoye.',
  ACCOUNT_ACTIVATED: 'Compte active avec succes',
  ACCOUNT_SUSPENDED: 'Compte suspendu avec succes',
  ACCOUNT_DELETED: 'Compte supprime avec succes',
  OTP_SENT: 'Code OTP envoye',

  // Repairer verification
  REPAIRER_VERIFIED: 'Reparateur verifie avec succes',
  REPAIRER_REJECTED: 'Demande rejetee',
  REPAIRER_SUSPENDED: 'Reparateur suspendu',
  REPAIRER_REACTIVATED: 'Reparateur reactive',
  STATUS_UNDER_REVIEW: 'Statut mis a jour: en cours de revision',

  // Generic
  UPDATE_SUCCESS: 'Mise a jour effectuee avec succes',
  DELETE_SUCCESS: 'Suppression effectuee avec succes',
} as const;

// =============================================================================
// WEBSOCKET CONSTANTS
// =============================================================================

export const WEBSOCKET = {
  /** Ping interval in milliseconds (30 seconds) */
  PING_INTERVAL_MS: 30000,
  /** Maximum reconnect attempts */
  MAX_RECONNECT_ATTEMPTS: 5,
  /** Maximum reconnect delay in milliseconds (30 seconds) */
  MAX_RECONNECT_DELAY_MS: 30000,
} as const;

// =============================================================================
// BUSINESS RULES
// =============================================================================

export const BUSINESS = {
  /** Platform fee percentage */
  PLATFORM_FEE_PERCENT: 10,
  /** Deposit percentage for partial payments */
  DEPOSIT_PERCENT: 30,
  /** Default home service radius in kilometers */
  DEFAULT_HOME_SERVICE_RADIUS_KM: 10,
  /** Default city */
  DEFAULT_CITY: 'Abidjan',
} as const;
