import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';

@ValidatorConstraint({ async: false })
export class IsStrongPasswordConstraint implements ValidatorConstraintInterface {
  validate(password: string, args: ValidationArguments): boolean {
    if (!password || typeof password !== 'string') {
      return false;
    }

    // Minimum 8 characters
    if (password.length < 8) {
      return false;
    }

    // At least one uppercase letter
    if (!/[A-Z]/.test(password)) {
      return false;
    }

    // At least one lowercase letter
    if (!/[a-z]/.test(password)) {
      return false;
    }

    // At least one digit
    if (!/[0-9]/.test(password)) {
      return false;
    }

    // At least one special character
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      return false;
    }

    return true;
  }

  defaultMessage(args: ValidationArguments): string {
    const password = args.value as string;

    if (!password || typeof password !== 'string') {
      return 'Le mot de passe est requis';
    }

    if (password.length < 8) {
      return 'Le mot de passe doit contenir au moins 8 caractères';
    }

    if (!/[A-Z]/.test(password)) {
      return 'Le mot de passe doit contenir au moins une lettre majuscule';
    }

    if (!/[a-z]/.test(password)) {
      return 'Le mot de passe doit contenir au moins une lettre minuscule';
    }

    if (!/[0-9]/.test(password)) {
      return 'Le mot de passe doit contenir au moins un chiffre';
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      return 'Le mot de passe doit contenir au moins un caractère spécial (!@#$%^&*(),.?":{}|<>)';
    }

    return 'Le mot de passe ne respecte pas les critères de sécurité';
  }
}

export function IsStrongPassword(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsStrongPasswordConstraint,
    });
  };
}
