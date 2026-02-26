/**
 * AppleScript bridge for reading contacts from macOS Contacts.app.
 *
 * Key design: a single AppleScript call fetches *all* contacts (or all
 * contacts in a group) as a TSV string, which is then parsed in JS. This
 * avoids N+1 AppleScript round-trips that would be extremely slow for
 * large address books.
 *
 * TSV columns: firstName \t lastName \t phones (comma-separated) \t email
 */

import { escapeAppleScript, runAppleScript } from "../util/osascript.js";
import type { Contact } from "../models/contact.js";

/**
 * Fetch all contacts from Contacts.app.
 * Returns contacts with at least one phone number.
 *
 * Uses batch property access (name of every person) instead of looping,
 * which is orders of magnitude faster for large address books.
 */
export async function fetchAllContacts(): Promise<Contact[]> {
  const script = `
    tell application "Contacts"
      set fnList to first name of every person
      set lnList to last name of every person
      set pCount to count of fnList
      set output to ""
      repeat with i from 1 to pCount
        set fn to ""
        set ln to ""
        try
          set fn to item i of fnList as text
        end try
        try
          set ln to item i of lnList as text
        end try
        set p to person i
        set phoneList to ""
        repeat with ph in phones of p
          if phoneList is not "" then set phoneList to phoneList & ","
          set phoneList to phoneList & (value of ph as text)
        end repeat
        set em to ""
        try
          if (count of emails of p) > 0 then
            set em to value of first email of p as text
          end if
        end try
        if phoneList is not "" then
          set output to output & fn & "\t" & ln & "\t" & phoneList & "\t" & em & "\n"
        end if
      end repeat
      return output
    end tell
  `;

  const raw = await runAppleScript(script, 120_000);
  return parseTsv(raw);
}

/**
 * Search for contacts by name using Contacts.app's `whose` filter.
 * Much faster than fetching all contacts when you only need a few.
 */
export async function searchContacts(term: string): Promise<Contact[]> {
  const safeTerm = escapeAppleScript(term);

  const script = `
    tell application "Contacts"
      set matchedPeople to every person whose name contains "${safeTerm}"
      set output to ""
      repeat with p in matchedPeople
        set fn to ""
        set ln to ""
        try
          set fn to first name of p as text
        end try
        try
          set ln to last name of p as text
        end try
        set phoneList to ""
        repeat with ph in phones of p
          if phoneList is not "" then set phoneList to phoneList & ","
          set phoneList to phoneList & (value of ph as text)
        end repeat
        set em to ""
        try
          if (count of emails of p) > 0 then
            set em to value of first email of p as text
          end if
        end try
        if phoneList is not "" then
          set output to output & fn & "\t" & ln & "\t" & phoneList & "\t" & em & "\n"
        end if
      end repeat
      return output
    end tell
  `;

  const raw = await runAppleScript(script, 30_000);
  return parseTsv(raw);
}

/**
 * Fetch contacts that belong to a specific Contacts.app group.
 */
export async function fetchContactsByGroup(
  groupName: string,
): Promise<Contact[]> {
  const safeGroup = escapeAppleScript(groupName);

  const script = `
    tell application "Contacts"
      set g to first group whose name is "${safeGroup}"
      set output to ""
      repeat with p in people of g
        set fn to ""
        set ln to ""
        try
          set fn to first name of p as text
        end try
        try
          set ln to last name of p as text
        end try
        set phoneList to ""
        repeat with ph in phones of p
          if phoneList is not "" then set phoneList to phoneList & ","
          set phoneList to phoneList & (value of ph as text)
        end repeat
        set em to ""
        try
          if (count of emails of p) > 0 then
            set em to value of first email of p as text
          end if
        end try
        if phoneList is not "" then
          set output to output & fn & "\t" & ln & "\t" & phoneList & "\t" & em & "\n"
        end if
      end repeat
      return output
    end tell
  `;

  const raw = await runAppleScript(script, 120_000);
  return parseTsv(raw, groupName);
}

/**
 * List all group names from Contacts.app.
 */
export async function fetchGroups(): Promise<string[]> {
  const script = `
    tell application "Contacts"
      set groupNames to name of every group
      set output to ""
      repeat with g in groupNames
        set output to output & g & "\n"
      end repeat
      return output
    end tell
  `;

  const raw = await runAppleScript(script);
  return raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

/**
 * Parse the TSV string produced by our AppleScript into Contact objects.
 * Handles "missing value" placeholders that AppleScript returns for empty fields.
 */
function parseTsv(tsv: string, group?: string): Contact[] {
  if (!tsv.trim()) return [];

  return tsv
    .split("\n")
    .filter((line) => line.trim())
    .map((line) => {
      const [firstName = "", lastName = "", phones = "", email = ""] =
        line.split("\t");

      const cleanStr = (s: string) =>
        s.trim() === "missing value" ? "" : s.trim();

      return {
        firstName: cleanStr(firstName),
        lastName: cleanStr(lastName),
        phones: phones
          .split(",")
          .map((p) => p.trim())
          .filter(Boolean),
        email: cleanStr(email) || undefined,
        group,
      };
    })
    .filter((c) => c.phones.length > 0);
}
