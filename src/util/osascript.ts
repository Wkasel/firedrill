/**
 * Thin wrapper around macOS `osascript` for executing AppleScript.
 *
 * All AppleScript interactions (Contacts.app, Messages.app) funnel through
 * this module so there's a single place to handle encoding, errors, and
 * timeouts.
 */

import { execFile } from "node:child_process";

/** Error thrown when an AppleScript execution fails. */
export class AppleScriptError extends Error {
  constructor(
    public readonly script: string,
    public readonly stderr: string,
    cause?: Error,
  ) {
    super(`AppleScript error: ${stderr.trim()}`);
    this.name = "AppleScriptError";
    if (cause) this.cause = cause;
  }
}

/**
 * Execute an AppleScript string and return its stdout.
 *
 * @param script  - The AppleScript source to run.
 * @param timeout - Max execution time in ms (default: 30 000).
 * @returns The trimmed stdout output from osascript.
 */
export function runAppleScript(
  script: string,
  timeout = 30_000,
): Promise<string> {
  return new Promise((resolve, reject) => {
    execFile(
      "/usr/bin/osascript",
      ["-e", script],
      { timeout, maxBuffer: 10 * 1024 * 1024 },
      (error, stdout, stderr) => {
        if (error) {
          reject(new AppleScriptError(script, stderr || error.message, error));
          return;
        }
        resolve(stdout.trim());
      },
    );
  });
}

/**
 * Escape a string for safe embedding inside an AppleScript quoted string.
 * Prevents AppleScript injection by escaping backslashes and double quotes.
 */
export function escapeAppleScript(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}
