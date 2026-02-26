/**
 * Logging utilities for send operations.
 *
 * Provides two output channels:
 * 1. Console progress — real-time status during broadcast (sent/failed counts).
 * 2. JSON file log — machine-readable record of every send attempt, written
 *    to ~/.firedrill/logs/ with timestamped filenames.
 */

import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { homedir } from "node:os";
import type { SendResult } from "../core/imessage.js";

export interface SendLog {
  startedAt: string;
  completedAt: string;
  total: number;
  sent: number;
  failed: number;
  dryRun: boolean;
  results: SendResult[];
}

/**
 * Write a send log to ~/.firedrill/logs/<timestamp>.json.
 * Creates the directory if it doesn't exist.
 */
export async function writeLog(log: SendLog): Promise<string> {
  const logDir = join(homedir(), ".firedrill", "logs");
  await mkdir(logDir, { recursive: true });

  const filename = `send-${log.startedAt.replace(/[:.]/g, "-")}.json`;
  const logPath = join(logDir, filename);
  await writeFile(logPath, JSON.stringify(log, null, 2));
  return logPath;
}

/**
 * Print a real-time progress line to stderr (so it doesn't pollute stdout
 * for piped output). Uses carriage return for in-place updates.
 */
export function printProgress(current: number, total: number, lastResult?: SendResult): void {
  const status = lastResult
    ? lastResult.success
      ? `✓ ${lastResult.phone}`
      : `✗ ${lastResult.phone}: ${lastResult.error}`
    : "starting...";

  process.stderr.write(`\r  [${current}/${total}] ${status}`.padEnd(80));

  // Move to a new line after the last message
  if (current === total) {
    process.stderr.write("\n");
  }
}

/**
 * Print the final summary of a broadcast operation.
 */
export function printSummary(log: SendLog): void {
  console.log("\n--- Send Summary ---");
  console.log(`  Total:  ${log.total}`);
  console.log(`  Sent:   ${log.sent}`);
  console.log(`  Failed: ${log.failed}`);
  if (log.dryRun) {
    console.log("  (dry run — no messages were actually sent)");
  }

  // Show failed recipients if any
  const failures = log.results.filter((r) => !r.success);
  if (failures.length > 0) {
    console.log("\n  Failed recipients:");
    for (const f of failures) {
      console.log(`    ${f.phone}: ${f.error}`);
    }
  }
}
