/**
 * CLI command: `firedrill contacts`
 *
 * Subcommands:
 *   list   — List contacts from Contacts.app or an imported file.
 *   groups — List all groups in Contacts.app.
 */

import type { Command } from "commander";
import {
  fetchAllContacts,
  fetchContactsByGroup,
  fetchGroups,
} from "../core/apple-contacts.js";
import { parseVCard } from "../import/vcard-parser.js";
import { parseCsv } from "../import/csv-parser.js";
import type { Contact } from "../models/contact.js";

/**
 * Register the `contacts` command and its subcommands on the program.
 */
export function registerContactsCommand(program: Command): void {
  const contacts = program
    .command("contacts")
    .description("Manage and view contacts");

  // --- firedrill contacts list ---
  contacts
    .command("list")
    .description("List contacts with phone numbers")
    .option("-g, --group <name>", "Filter by Contacts.app group")
    .option("-s, --search <term>", "Filter contacts by name")
    .option("-i, --import <file>", "Load contacts from .vcf or .csv file")
    .option("--json", "Output as JSON")
    .action(async (opts: {
      group?: string;
      search?: string;
      import?: string;
      json?: boolean;
    }) => {
      try {
        let contacts: Contact[];

        if (opts.import) {
          contacts = await loadFromFile(opts.import);
        } else if (opts.group) {
          contacts = await fetchContactsByGroup(opts.group);
        } else {
          contacts = await fetchAllContacts();
        }

        // Apply name search filter
        if (opts.search) {
          const term = opts.search.toLowerCase();
          contacts = contacts.filter(
            (c) =>
              c.firstName.toLowerCase().includes(term) ||
              c.lastName.toLowerCase().includes(term),
          );
        }

        if (opts.json) {
          console.log(JSON.stringify(contacts, null, 2));
        } else {
          if (contacts.length === 0) {
            console.log("No contacts found.");
            return;
          }
          console.log(`Found ${contacts.length} contact(s):\n`);
          for (const c of contacts) {
            const name = `${c.firstName} ${c.lastName}`.trim() || "(no name)";
            const phones = c.phones.join(", ");
            console.log(`  ${name}  ${phones}`);
          }
        }
      } catch (err) {
        console.error(
          "Error:",
          err instanceof Error ? err.message : String(err),
        );
        process.exit(1);
      }
    });

  // --- firedrill contacts groups ---
  contacts
    .command("groups")
    .description("List Contacts.app groups")
    .action(async () => {
      try {
        const groups = await fetchGroups();
        if (groups.length === 0) {
          console.log("No groups found in Contacts.app.");
          return;
        }
        console.log(`Found ${groups.length} group(s):\n`);
        for (const g of groups) {
          console.log(`  ${g}`);
        }
      } catch (err) {
        console.error(
          "Error:",
          err instanceof Error ? err.message : String(err),
        );
        process.exit(1);
      }
    });
}

/**
 * Load contacts from a .vcf or .csv file based on extension.
 */
async function loadFromFile(filePath: string): Promise<Contact[]> {
  const lower = filePath.toLowerCase();
  if (lower.endsWith(".vcf")) {
    return parseVCard(filePath);
  }
  if (lower.endsWith(".csv")) {
    return parseCsv(filePath);
  }
  throw new Error(
    `Unsupported file format: ${filePath}. Use .vcf or .csv files.`,
  );
}
