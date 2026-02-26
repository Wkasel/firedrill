/**
 * Send pipeline — orchestrates the full broadcast workflow.
 *
 * Flow: resolve contacts → normalize phones → render templates →
 *       rate-limit → send (or dry-run) → log results.
 *
 * Supports graceful SIGINT: Ctrl+C during broadcast stops sending,
 * prints a partial summary, and writes the log.
 */

import type { Contact } from "../models/contact.js";
import type { SendResult } from "../core/imessage.js";
import { sendIMessage } from "../core/imessage.js";
import { renderTemplate } from "../core/template-engine.js";
import { ensureCountryCode } from "../util/phone.js";
import { createRateLimiter } from "../core/rate-limiter.js";
import {
  printProgress,
  printSummary,
  writeLog,
  type SendLog,
} from "../util/logger.js";

export interface PipelineOptions {
  contacts: Contact[];
  message: string;
  delayMs: number;
  maxPerHour: number;
  serviceName: string;
  dryRun: boolean;
}

/**
 * Execute the send pipeline for a list of contacts.
 *
 * Each contact's first phone number is used as the recipient. The message
 * template is rendered per-contact with {{firstName}}, {{lastName}}, etc.
 *
 * @returns The send log with results for every attempted recipient.
 */
export async function runSendPipeline(
  options: PipelineOptions,
): Promise<SendLog> {
  const { contacts, message, delayMs, maxPerHour, serviceName, dryRun } =
    options;
  const rateLimiter = createRateLimiter(delayMs, maxPerHour);
  const results: SendResult[] = [];
  const startedAt = new Date().toISOString();
  let aborted = false;

  // Graceful SIGINT handler — stop sending, still write the log
  const onSigint = () => {
    aborted = true;
    console.log("\n\nInterrupted — finishing up...");
  };
  process.on("SIGINT", onSigint);

  try {
    console.log(
      `\n${dryRun ? "[DRY RUN] " : ""}Sending to ${contacts.length} contact(s)...\n`,
    );

    for (let i = 0; i < contacts.length && !aborted; i++) {
      const contact = contacts[i];
      const phone = ensureCountryCode(contact.phones[0]);

      // Build template variables from contact fields
      const vars: Record<string, string> = {
        firstName: contact.firstName,
        lastName: contact.lastName,
        phone,
        email: contact.email ?? "",
        fullName: `${contact.firstName} ${contact.lastName}`.trim(),
      };
      const rendered = renderTemplate(message, vars);

      if (dryRun) {
        const result: SendResult = {
          phone,
          success: true,
          timestamp: new Date(),
        };
        results.push(result);
        console.log(`  [${i + 1}/${contacts.length}] → ${phone}: ${rendered}`);
      } else {
        await rateLimiter.waitForSlot();
        const result = await sendIMessage(phone, rendered, serviceName);
        results.push(result);
        printProgress(i + 1, contacts.length, result);
      }
    }

    if (aborted) {
      console.log(
        `Stopped after ${results.length}/${contacts.length} messages.`,
      );
    }
  } finally {
    process.off("SIGINT", onSigint);
  }

  const log: SendLog = {
    startedAt,
    completedAt: new Date().toISOString(),
    total: contacts.length,
    sent: results.filter((r) => r.success).length,
    failed: results.filter((r) => !r.success).length,
    dryRun,
    results,
  };

  printSummary(log);

  // Write log file unless it's a dry run with no failures
  if (!dryRun || log.failed > 0) {
    const logPath = await writeLog(log);
    console.log(`\n  Log written to: ${logPath}`);
  }

  return log;
}
