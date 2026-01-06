import { SetMetadata } from '@nestjs/common';

export enum UserRole {
  CLIENT = 'client',
  REPAIRER = 'repairer',
  ADMIN = 'admin',
}

export const ROLES_KEY = 'roles';
export const Roles = (...roles: (UserRole | string)[]) => SetMetadata(ROLES_KEY, roles);
