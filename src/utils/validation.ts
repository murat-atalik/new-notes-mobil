import { strings } from '../strings/tr';

export type ValidationResult = { valid: true } | { valid: false; message: string };

export function validateRequired(value: string, message: string): ValidationResult {
  return value.trim() ? { valid: true } : { valid: false, message };
}

export function validatePassword(password: string): ValidationResult {
  return password.length >= 6
    ? { valid: true }
    : { valid: false, message: strings.auth.missingLogin };
}
