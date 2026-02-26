/**
 * Minimal vCard (.vcf) parser.
 *
 * Parses vCard 3.0/4.0 files into Contact objects. Only extracts the fields
 * we need (name, phone, email) — a full RFC 6350 implementation would be
 * overkill for this use case.
 *
 * Handles multi-contact .vcf files (multiple BEGIN:VCARD / END:VCARD blocks).
 */

import { readFile } from "node:fs/promises";
import type { Contact } from "../models/contact.js";

/**
 * Parse a .vcf file and return contacts that have at least one phone number.
 */
export async function parseVCard(filePath: string): Promise<Contact[]> {
  const raw = await readFile(filePath, "utf-8");
  return parseVCardString(raw);
}

/**
 * Parse a vCard string (may contain multiple vCards).
 * Exported for testing without file I/O.
 */
export function parseVCardString(raw: string): Contact[] {
  const blocks = raw.split(/(?=BEGIN:VCARD)/i).filter((b) => b.trim());

  return blocks
    .map((block) => {
      const lines = unfoldLines(block);

      let firstName = "";
      let lastName = "";
      const phones: string[] = [];
      let email: string | undefined;

      for (const line of lines) {
        // N field: family;given;additional;prefix;suffix
        if (/^N[;:]/i.test(line)) {
          const value = extractValue(line);
          const parts = value.split(";");
          lastName = parts[0] || "";
          firstName = parts[1] || "";
        }

        // FN (formatted name) as fallback if N is missing
        if (/^FN[;:]/i.test(line) && !firstName && !lastName) {
          const value = extractValue(line);
          const parts = value.split(" ");
          firstName = parts[0] || "";
          lastName = parts.slice(1).join(" ");
        }

        // TEL field
        if (/^TEL[;:]/i.test(line)) {
          const value = extractValue(line);
          if (value) phones.push(value);
        }

        // EMAIL field (take the first one)
        if (/^EMAIL[;:]/i.test(line) && !email) {
          email = extractValue(line) || undefined;
        }
      }

      return { firstName, lastName, phones, email } as Contact;
    })
    .filter((c) => c.phones.length > 0);
}

/**
 * vCard line unfolding: lines that start with a space or tab are
 * continuations of the previous line (RFC 6350 §3.2).
 */
function unfoldLines(block: string): string[] {
  return block.replace(/\r\n?/g, "\n").replace(/\n[ \t]/g, "").split("\n");
}

/**
 * Extract the value portion from a vCard property line.
 * Handles properties with parameters like `TEL;TYPE=CELL:+15551234567`.
 */
function extractValue(line: string): string {
  const colonIndex = line.indexOf(":");
  if (colonIndex === -1) return "";
  return line.slice(colonIndex + 1).trim();
}
