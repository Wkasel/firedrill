/**
 * Minimal CSV parser for contact import.
 *
 * Expects a header row with recognizable column names. Supports common
 * export formats (Google Contacts, Apple Contacts export, generic CSVs).
 *
 * Column matching is case-insensitive and flexible:
 * - First name: "first name", "firstname", "first_name", "given name"
 * - Last name:  "last name", "lastname", "last_name", "family name", "surname"
 * - Phone:      "phone", "mobile", "cell", "telephone", "phone number"
 * - Email:      "email", "e-mail", "email address"
 */

import { readFile } from "node:fs/promises";
import type { Contact } from "../models/contact.js";

/**
 * Parse a CSV file and return contacts that have at least one phone number.
 */
export async function parseCsv(filePath: string): Promise<Contact[]> {
  const raw = await readFile(filePath, "utf-8");
  return parseCsvString(raw);
}

/**
 * Parse a CSV string. Exported for testing without file I/O.
 */
export function parseCsvString(raw: string): Contact[] {
  const lines = raw
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length < 2) return [];

  const headers = parseCsvLine(lines[0]).map((h) => h.toLowerCase().trim());

  // Map logical fields to column indices
  const firstNameIdx = findColumnIndex(headers, [
    "first name",
    "firstname",
    "first_name",
    "given name",
    "givenname",
  ]);
  const lastNameIdx = findColumnIndex(headers, [
    "last name",
    "lastname",
    "last_name",
    "family name",
    "familyname",
    "surname",
  ]);
  const phoneIndices = findAllColumnIndices(headers, [
    "phone",
    "mobile",
    "cell",
    "telephone",
    "phone number",
    "phone_number",
    "phone 1",
    "phone 2",
    "mobile phone",
  ]);
  const emailIdx = findColumnIndex(headers, [
    "email",
    "e-mail",
    "email address",
    "emailaddress",
    "email_address",
  ]);

  return lines
    .slice(1)
    .map((line) => {
      const cols = parseCsvLine(line);
      const phones = phoneIndices
        .map((i) => cols[i]?.trim())
        .filter(Boolean) as string[];

      return {
        firstName: firstNameIdx >= 0 ? (cols[firstNameIdx]?.trim() ?? "") : "",
        lastName: lastNameIdx >= 0 ? (cols[lastNameIdx]?.trim() ?? "") : "",
        phones,
        email:
          emailIdx >= 0 ? (cols[emailIdx]?.trim() || undefined) : undefined,
      } as Contact;
    })
    .filter((c) => c.phones.length > 0);
}

/**
 * Parse a single CSV line, respecting quoted fields.
 * Handles double-quote escaping per RFC 4180.
 */
function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        // Escaped quote ("") or end of quoted field
        if (line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ",") {
        fields.push(current);
        current = "";
      } else {
        current += ch;
      }
    }
  }
  fields.push(current);
  return fields;
}

/** Find the first column index matching any of the candidate names. */
function findColumnIndex(headers: string[], candidates: string[]): number {
  return headers.findIndex((h) => candidates.includes(h));
}

/** Find all column indices matching any of the candidate names. */
function findAllColumnIndices(headers: string[], candidates: string[]): number[] {
  return headers
    .map((h, i) => (candidates.includes(h) ? i : -1))
    .filter((i) => i >= 0);
}
