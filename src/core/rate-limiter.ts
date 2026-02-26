/**
 * Rate limiter for iMessage sending.
 *
 * Enforces two constraints:
 * 1. A fixed delay between consecutive messages (default: 4 seconds).
 * 2. A hard cap on messages per rolling hour (default: 150).
 *
 * These conservative defaults are designed to stay well under Apple's
 * iMessage throttling thresholds, which can silently drop messages or
 * temporarily block sending if exceeded.
 */

/**
 * Creates a rate limiter that tracks send timestamps and enforces limits.
 *
 * @param delayMs    - Minimum ms between consecutive sends.
 * @param maxPerHour - Maximum sends allowed in any rolling 60-minute window.
 */
export function createRateLimiter(delayMs: number, maxPerHour: number) {
  const timestamps: number[] = [];
  let lastSendTime = 0;

  return {
    /**
     * Wait until it's safe to send the next message, then record the send.
     * Resolves when the caller is clear to proceed.
     */
    async waitForSlot(): Promise<void> {
      // Enforce per-message delay
      const now = Date.now();
      const elapsed = now - lastSendTime;
      if (elapsed < delayMs && lastSendTime > 0) {
        await sleep(delayMs - elapsed);
      }

      // Enforce hourly cap: prune timestamps older than 1 hour, then wait
      // if we've hit the ceiling
      const oneHourAgo = Date.now() - 60 * 60 * 1000;
      while (timestamps.length > 0 && timestamps[0] < oneHourAgo) {
        timestamps.shift();
      }

      if (timestamps.length >= maxPerHour) {
        // Wait until the oldest timestamp in the window expires
        const waitUntil = timestamps[0] + 60 * 60 * 1000;
        const waitMs = waitUntil - Date.now();
        if (waitMs > 0) {
          console.log(
            `Rate limit reached (${maxPerHour}/hr). Pausing for ${Math.ceil(waitMs / 1000)}s...`,
          );
          await sleep(waitMs);
        }
      }

      lastSendTime = Date.now();
      timestamps.push(lastSendTime);
    },

    /** Number of messages sent in the current rolling hour window. */
    get sentThisHour(): number {
      const oneHourAgo = Date.now() - 60 * 60 * 1000;
      return timestamps.filter((t) => t >= oneHourAgo).length;
    },
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
