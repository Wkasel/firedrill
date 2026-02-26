/**
 * Core contact data model used throughout the application.
 *
 * Contacts can originate from macOS Contacts.app, vCard files, or CSV files.
 * The `phones` array holds all known phone numbers for a contact; the first
 * entry is treated as the primary number when a single recipient is needed.
 */
export interface Contact {
  firstName: string;
  lastName: string;
  phones: string[];
  email?: string;
  /** Contacts.app group name, if the contact was loaded from a group query. */
  group?: string;
}
