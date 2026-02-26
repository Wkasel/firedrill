/**
 * Tests for AppleScript string escaping.
 * This is security-critical — ensures user input can't break out of
 * AppleScript string literals and execute arbitrary commands.
 */

import { describe, it, expect } from "vitest";
import { escapeAppleScript } from "./osascript.js";

describe("escapeAppleScript", () => {
  it("escapes double quotes", () => {
    expect(escapeAppleScript('say "hello"')).toBe('say \\"hello\\"');
  });

  it("escapes backslashes", () => {
    expect(escapeAppleScript("path\\to\\file")).toBe("path\\\\to\\\\file");
  });

  it("escapes both backslashes and quotes", () => {
    expect(escapeAppleScript('a\\"b')).toBe('a\\\\\\"b');
  });

  it("leaves safe strings unchanged", () => {
    expect(escapeAppleScript("Hello world")).toBe("Hello world");
  });

  it("handles empty string", () => {
    expect(escapeAppleScript("")).toBe("");
  });

  it("prevents AppleScript injection via quote breakout", () => {
    // If someone tried to inject: " & do shell script "rm -rf /"
    const malicious = '" & do shell script "rm -rf /';
    const escaped = escapeAppleScript(malicious);
    // Should not contain an unescaped quote
    expect(escaped).toBe('\\" & do shell script \\"rm -rf /');
    // The escaped string, when placed inside quotes, stays inside the string
    expect(escaped).not.toMatch(/(?<!\\)"/);
  });
});
