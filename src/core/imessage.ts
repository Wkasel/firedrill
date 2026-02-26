/**
 * AppleScript bridge for sending iMessages via Messages.app.
 *
 * Uses the `participant` keyword to address arbitrary phone numbers without
 * requiring them to be in the buddy list. The `send` command targets a
 * specific service ("iMessage") and creates/finds a chat with the recipient.
 */

import { escapeAppleScript, runAppleScript } from "../util/osascript.js";

export interface SendResult {
  phone: string;
  success: boolean;
  error?: string;
  /** Timestamp when the send was attempted. */
  timestamp: Date;
}

/**
 * Send a single iMessage to a phone number.
 *
 * @param phone       - The recipient phone number (e.g. "+15551234567").
 * @param message     - The message body to send.
 * @param serviceName - Messages.app service name (default: "iMessage").
 * @returns A result indicating success or failure.
 */
export async function sendIMessage(
  phone: string,
  message: string,
  serviceName = "iMessage",
): Promise<SendResult> {
  const safePhone = escapeAppleScript(phone);
  const safeMessage = escapeAppleScript(message);
  const safeService = escapeAppleScript(serviceName);

  const script = `
    tell application "Messages"
      set targetService to 1st account whose service type = iMessage
      set targetBuddy to participant "${safePhone}" of targetService
      send "${safeMessage}" to targetBuddy
    end tell
  `;

  try {
    await runAppleScript(script);
    return { phone, success: true, timestamp: new Date() };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    return { phone, success: false, error: errorMessage, timestamp: new Date() };
  }
}
