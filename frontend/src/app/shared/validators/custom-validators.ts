import { AbstractControl, ValidationErrors, ValidatorFn, FormGroup } from '@angular/forms';

/**
 * Custom validators for RepairFone forms
 */
export class CustomValidators {

  /**
   * Validates Ivorian phone numbers
   * Formats: 07XXXXXXXX, +22507XXXXXXXX, 00225 07XXXXXXXX
   */
  static phoneNumber(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;

      // Remove spaces and dashes
      const phone = control.value.replace(/[\s-]/g, '');

      // Ivorian phone patterns
      const patterns = [
        /^0[157]\d{8}$/,                    // 0X XX XX XX XX (local)
        /^\+225[0157]\d{8}$/,               // +225 X XX XX XX XX
        /^00225[0157]\d{8}$/,               // 00225 X XX XX XX XX
        /^225[0157]\d{8}$/,                 // 225 X XX XX XX XX
      ];

      const isValid = patterns.some(pattern => pattern.test(phone));

      return isValid ? null : { phoneNumber: { value: control.value, message: 'Numéro de téléphone invalide' } };
    };
  }

  /**
   * Validates password strength
   * Requirements: min 8 chars, 1 uppercase, 1 lowercase, 1 number
   */
  static strongPassword(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;

      const password = control.value;
      const errors: string[] = [];

      if (password.length < 8) {
        errors.push('minimum 8 caractères');
      }
      if (!/[A-Z]/.test(password)) {
        errors.push('une majuscule');
      }
      if (!/[a-z]/.test(password)) {
        errors.push('une minuscule');
      }
      if (!/\d/.test(password)) {
        errors.push('un chiffre');
      }

      if (errors.length > 0) {
        return {
          strongPassword: {
            value: control.value,
            requirements: errors,
            message: `Le mot de passe doit contenir: ${errors.join(', ')}`
          }
        };
      }

      return null;
    };
  }

  /**
   * Validates that password and confirm password match
   */
  static passwordMatch(passwordKey: string, confirmPasswordKey: string): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const formGroup = control as FormGroup;
      const password = formGroup.get(passwordKey);
      const confirmPassword = formGroup.get(confirmPasswordKey);

      if (!password || !confirmPassword) return null;
      if (!confirmPassword.value) return null;

      if (password.value !== confirmPassword.value) {
        confirmPassword.setErrors({ passwordMatch: true });
        return { passwordMatch: { message: 'Les mots de passe ne correspondent pas' } };
      }

      // Clear the error if passwords now match
      const errors = confirmPassword.errors;
      if (errors) {
        delete errors['passwordMatch'];
        if (Object.keys(errors).length === 0) {
          confirmPassword.setErrors(null);
        }
      }

      return null;
    };
  }

  /**
   * Validates OTP code format (6 digits)
   */
  static otpCode(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;

      const code = control.value.toString().replace(/\s/g, '');
      const isValid = /^\d{6}$/.test(code);

      return isValid ? null : { otpCode: { value: control.value, message: 'Le code doit contenir 6 chiffres' } };
    };
  }

  /**
   * Validates email format
   */
  static email(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;

      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      const isValid = emailRegex.test(control.value);

      return isValid ? null : { email: { value: control.value, message: 'Email invalide' } };
    };
  }

  /**
   * Validates minimum word count
   */
  static minWords(min: number): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;

      const wordCount = control.value.trim().split(/\s+/).filter(Boolean).length;

      if (wordCount < min) {
        return {
          minWords: {
            value: control.value,
            requiredWords: min,
            actualWords: wordCount,
            message: `Minimum ${min} mots requis`
          }
        };
      }

      return null;
    };
  }

  /**
   * Validates that a date is in the future
   */
  static futureDate(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;

      const selectedDate = new Date(control.value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (selectedDate < today) {
        return {
          futureDate: {
            value: control.value,
            message: 'La date doit être dans le futur'
          }
        };
      }

      return null;
    };
  }

  /**
   * Validates rating is between 1 and 5
   */
  static rating(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;

      const rating = Number(control.value);

      if (isNaN(rating) || rating < 1 || rating > 5) {
        return {
          rating: {
            value: control.value,
            message: 'La note doit être entre 1 et 5'
          }
        };
      }

      return null;
    };
  }

  /**
   * Validates price format (positive number)
   */
  static price(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;

      const price = Number(control.value);

      if (isNaN(price) || price < 0) {
        return {
          price: {
            value: control.value,
            message: 'Le prix doit être un nombre positif'
          }
        };
      }

      return null;
    };
  }

  /**
   * Trims whitespace and validates not empty
   */
  static requiredTrimmed(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value || control.value.trim().length === 0) {
        return { required: { message: 'Ce champ est requis' } };
      }
      return null;
    };
  }

  /**
   * Validates file size (in MB)
   */
  static maxFileSize(maxSizeMB: number): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;

      const file = control.value as File;
      if (!file.size) return null;

      const maxSizeBytes = maxSizeMB * 1024 * 1024;

      if (file.size > maxSizeBytes) {
        return {
          maxFileSize: {
            value: file.size,
            maxSize: maxSizeMB,
            message: `Le fichier ne doit pas dépasser ${maxSizeMB} MB`
          }
        };
      }

      return null;
    };
  }

  /**
   * Validates file type
   */
  static fileType(allowedTypes: string[]): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;

      const file = control.value as File;
      if (!file.type) return null;

      const isAllowed = allowedTypes.some(type => {
        if (type.endsWith('/*')) {
          const baseType = type.slice(0, -2);
          return file.type.startsWith(baseType);
        }
        return file.type === type;
      });

      if (!isAllowed) {
        return {
          fileType: {
            value: file.type,
            allowedTypes,
            message: `Type de fichier non autorisé. Types acceptés: ${allowedTypes.join(', ')}`
          }
        };
      }

      return null;
    };
  }
}

/**
 * Helper to get error message from form control
 */
export function getErrorMessage(control: AbstractControl): string | null {
  if (!control.errors) return null;

  const errorKeys = Object.keys(control.errors);
  if (errorKeys.length === 0) return null;

  const error = control.errors[errorKeys[0]];

  // Check for custom message in error object
  if (error && typeof error === 'object' && 'message' in error) {
    return error.message;
  }

  // Default messages for standard validators
  const defaultMessages: Record<string, string> = {
    required: 'Ce champ est requis',
    minlength: `Minimum ${error?.requiredLength} caractères requis`,
    maxlength: `Maximum ${error?.requiredLength} caractères autorisés`,
    min: `La valeur minimale est ${error?.min}`,
    max: `La valeur maximale est ${error?.max}`,
    email: 'Email invalide',
    pattern: 'Format invalide',
    phoneNumber: 'Numéro de téléphone invalide',
    strongPassword: 'Mot de passe trop faible',
    passwordMatch: 'Les mots de passe ne correspondent pas',
    otpCode: 'Code invalide',
    futureDate: 'La date doit être dans le futur',
    rating: 'Note invalide',
    price: 'Prix invalide',
  };

  return defaultMessages[errorKeys[0]] || 'Valeur invalide';
}
