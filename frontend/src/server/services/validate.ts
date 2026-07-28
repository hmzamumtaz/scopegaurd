const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidUUID(s: string): boolean {
  return UUID_REGEX.test(s);
}

export function isValidEmail(s: string): boolean {
  return EMAIL_REGEX.test(s);
}

export function sanitizeString(s: string, maxLength = 10000): string {
  return s.trim().slice(0, maxLength);
}
