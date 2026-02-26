/**
 * Phone number normalization utilities.
 *
 * Strips formatting characters and normalizes to E.164-ish format for
 * consistent comparison and AppleScript addressing. This is intentionally
 * simple — a full E.164 library would be overkill for our use case of
 * passing numbers to Messages.app, which handles lookup internally.
 */

/**
 * Strip all non-digit characters except a leading '+'.
 *
 * @example
 *   normalizePhone("(555) 123-4567")  // => "5551234567"
 *   normalizePhone("+1-555-123-4567") // => "+15551234567"
 */
export function normalizePhone(phone: string): string {
  const trimmed = phone.trim();
  if (trimmed.startsWith("+")) {
    return "+" + trimmed.slice(1).replace(/\D/g, "");
  }
  return trimmed.replace(/\D/g, "");
}

/**
 * Ensure a US phone number has the +1 country code prefix.
 * Non-US numbers (already prefixed with +) are returned as-is.
 *
 * @example
 *   ensureCountryCode("5551234567")    // => "+15551234567"
 *   ensureCountryCode("+15551234567")  // => "+15551234567"
 *   ensureCountryCode("+447911123456") // => "+447911123456"
 */
export function ensureCountryCode(phone: string): string {
  const normalized = normalizePhone(phone);
  if (normalized.startsWith("+")) {
    return normalized;
  }
  // Assume US number if 10 digits without country code
  if (normalized.length === 10) {
    return "+1" + normalized;
  }
  // 11-digit number starting with 1 — add the +
  if (normalized.length === 11 && normalized.startsWith("1")) {
    return "+" + normalized;
  }
  // Return as-is for other formats; Messages.app may still resolve it
  return normalized;
}
