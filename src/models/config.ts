/**
 * Application configuration with sensible defaults.
 *
 * Config is resolved in order: defaults → ~/.firedrill/config.json → CLI flags.
 * Each layer overrides the previous, so the tool works with zero configuration.
 */

import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { homedir } from "node:os";

export interface FiredrillConfig {
  /** Delay in ms between individual messages (default: 4000). */
  delayMs: number;
  /** Maximum messages allowed per rolling hour (default: 150). */
  maxPerHour: number;
  /** iMessage service name used in AppleScript (default: "iMessage"). */
  serviceName: string;
}

/** Conservative defaults that stay well under Apple's throttling thresholds. */
export const DEFAULT_CONFIG: FiredrillConfig = {
  delayMs: 4000,
  maxPerHour: 150,
  serviceName: "iMessage",
};

/**
 * Load optional config from ~/.firedrill/config.json.
 * Returns defaults merged with any file-based overrides.
 * Silently falls back to defaults if the file doesn't exist.
 */
export async function loadConfig(): Promise<FiredrillConfig> {
  const configPath = join(homedir(), ".firedrill", "config.json");
  try {
    const raw = await readFile(configPath, "utf-8");
    const parsed = JSON.parse(raw) as Partial<FiredrillConfig>;
    return { ...DEFAULT_CONFIG, ...parsed };
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}
