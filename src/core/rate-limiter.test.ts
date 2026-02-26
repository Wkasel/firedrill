/**
 * Tests for the rate limiter.
 * Covers per-message delay enforcement and the rolling hourly cap counter.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createRateLimiter } from "./rate-limiter.js";

describe("createRateLimiter", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("allows the first message immediately", async () => {
    const limiter = createRateLimiter(1000, 100);
    // Should resolve without delay
    const promise = limiter.waitForSlot();
    await vi.runAllTimersAsync();
    await promise;
    expect(limiter.sentThisHour).toBe(1);
  });

  it("enforces delay between consecutive messages", async () => {
    const limiter = createRateLimiter(1000, 100);

    // First message — immediate
    await limiter.waitForSlot();

    // Second message — should wait ~1000ms
    const start = Date.now();
    const promise = limiter.waitForSlot();
    await vi.runAllTimersAsync();
    await promise;

    // With fake timers, at least 1000ms should have "elapsed"
    expect(Date.now() - start).toBeGreaterThanOrEqual(1000);
    expect(limiter.sentThisHour).toBe(2);
  });

  it("tracks sentThisHour correctly", async () => {
    const limiter = createRateLimiter(0, 100);

    await limiter.waitForSlot();
    await limiter.waitForSlot();
    await limiter.waitForSlot();

    expect(limiter.sentThisHour).toBe(3);
  });

  it("expires old timestamps from the hourly window", async () => {
    const limiter = createRateLimiter(0, 100);

    await limiter.waitForSlot();
    expect(limiter.sentThisHour).toBe(1);

    // Advance past the 1-hour window
    vi.advanceTimersByTime(61 * 60 * 1000);

    // The old send should have expired
    expect(limiter.sentThisHour).toBe(0);
  });
});
