/**
 * Tests for phone number normalization and country code handling.
 */

import { describe, it, expect } from "vitest";
import { normalizePhone, ensureCountryCode } from "./phone.js";

describe("normalizePhone", () => {
  it("strips parentheses, spaces, and dashes", () => {
    expect(normalizePhone("(555) 123-4567")).toBe("5551234567");
  });

  it("preserves leading +", () => {
    expect(normalizePhone("+1-555-123-4567")).toBe("+15551234567");
  });

  it("strips dots", () => {
    expect(normalizePhone("555.123.4567")).toBe("5551234567");
  });

  it("handles already-clean numbers", () => {
    expect(normalizePhone("5551234567")).toBe("5551234567");
  });

  it("trims whitespace", () => {
    expect(normalizePhone("  +15551234567  ")).toBe("+15551234567");
  });
});

describe("ensureCountryCode", () => {
  it("adds +1 to a 10-digit US number", () => {
    expect(ensureCountryCode("5551234567")).toBe("+15551234567");
  });

  it("adds + to an 11-digit number starting with 1", () => {
    expect(ensureCountryCode("15551234567")).toBe("+15551234567");
  });

  it("preserves existing + prefix", () => {
    expect(ensureCountryCode("+15551234567")).toBe("+15551234567");
  });

  it("preserves non-US international numbers", () => {
    expect(ensureCountryCode("+447911123456")).toBe("+447911123456");
  });

  it("normalizes formatting before adding country code", () => {
    expect(ensureCountryCode("(555) 123-4567")).toBe("+15551234567");
  });
});
