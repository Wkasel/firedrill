/**
 * CLI command: `firedrill send`
 *
 * Send an iMessage to one or many recipients. Supports:
 * - Single recipient via --to
 * - Contacts.app group via --group
 * - File import via --import (.vcf / .csv)
 * - Template interpolation ({{firstName}}, {{lastName}}, etc.)
 * - Rate limiting (--delay, --max-per-hour)
 * - Dry-run mode (--dry-run)
 * - Confirmation prompt (skippable with --confirm)
 */

import { createInterface } from "node:readline";
import type { Command } from "commander";
import {
  fetchAllContacts,
  fetchContactsByGroup,
} from "../core/apple-contacts.js";
import { parseVCard } from "../import/vcard-parser.js";
import { parseCsv } from "../import/csv-parser.js";
import { loadConfig } from "../models/config.js";
import { extractVariables } from "../core/template-engine.js";
import { runSendPipeline } from "../pipeline/send-pipeline.js";
import type { Contact } from "../models/contact.js";

interface SendOptions {
  to?: string;
  group?: string;
  import?: string;
  message: string;
  delay?: string;
  maxPerHour?: string;
  dryRun?: boolean;
  confirm?: boolean;
}

/**
 * Register the `send` command on the program.
 */
export function registerSendCommand(program: Command): void {
  program
    .command("send")
    .description("Send iMessage(s) to one or more recipients")
    .requiredOption("-m, --message <text>", "Message body (supports {{var}} templates)")
    .option("-t, --to <phone>", "Single recipient phone number")
    .option("-g, --group <name>", "Send to all contacts in a Contacts.app group")
    .option("-i, --import <path>", "Send to contacts from a .vcf or .csv file")
    .option("-d, --delay <ms>", "Delay between messages in ms")
    .option("--max-per-hour <n>", "Maximum messages per hour")
    .option("--dry-run", "Preview messages without sending")
    .option("-y, --confirm", "Skip confirmation prompt")
    .action(async (opts: SendOptions) => {
      try {
        // Validate that at least one recipient source is specified
        if (!opts.to && !opts.group && !opts.import) {
          console.error(
            "Error: specify at least one recipient with --to, --group, or --import",
          );
          process.exit(1);
        }

        // Resolve contacts from the specified source
        const contacts = await resolveContacts(opts);
        if (contacts.length === 0) {
          console.log("No contacts with phone numbers found.");
          return;
        }

        // Load config (file + CLI flag overrides)
        const config = await loadConfig();
        const delayMs = opts.delay ? parseInt(opts.delay, 10) : config.delayMs;
        const maxPerHour = opts.maxPerHour
          ? parseInt(opts.maxPerHour, 10)
          : config.maxPerHour;

        // Show preview
        const templateVars = extractVariables(opts.message);
        console.log(`Recipients:    ${contacts.length}`);
        console.log(`Message:       ${opts.message}`);
        if (templateVars.length > 0) {
          console.log(`Template vars: ${templateVars.join(", ")}`);
        }
        console.log(`Delay:         ${delayMs}ms`);
        console.log(`Max/hour:      ${maxPerHour}`);
        if (opts.dryRun) {
          console.log(`Mode:          DRY RUN`);
        }

        // Confirmation prompt (unless --confirm or --dry-run)
        if (!opts.confirm && !opts.dryRun) {
          const confirmed = await promptConfirm(
            `\nSend ${contacts.length} message(s)? [y/N] `,
          );
          if (!confirmed) {
            console.log("Aborted.");
            return;
          }
        }

        // Run the pipeline
        await runSendPipeline({
          contacts,
          message: opts.message,
          delayMs,
          maxPerHour,
          serviceName: config.serviceName,
          dryRun: opts.dryRun ?? false,
        });
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
 * Resolve contacts from CLI options (--to, --group, or --import).
 */
async function resolveContacts(opts: SendOptions): Promise<Contact[]> {
  if (opts.to) {
    // Single recipient — create a synthetic contact
    return [
      {
        firstName: "",
        lastName: "",
        phones: [opts.to],
      },
    ];
  }

  if (opts.import) {
    const lower = opts.import.toLowerCase();
    if (lower.endsWith(".vcf")) return parseVCard(opts.import);
    if (lower.endsWith(".csv")) return parseCsv(opts.import);
    throw new Error(`Unsupported file format: ${opts.import}. Use .vcf or .csv.`);
  }

  if (opts.group) {
    return fetchContactsByGroup(opts.group);
  }

  return fetchAllContacts();
}

/**
 * Show a Y/N prompt and return true if the user confirms.
 */
function promptConfirm(question: string): Promise<boolean> {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim().toLowerCase() === "y");
    });
  });
}
