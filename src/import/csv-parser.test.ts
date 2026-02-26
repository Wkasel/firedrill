/**
 * Tests for the CSV parser.
 * Covers common header formats, quoted fields, multi-phone columns, and edge cases.
 */

import { describe, it, expect } from "vitest";
import { parseCsvString } from "./csv-parser.js";

describe("parseCsvString", () => {
  it("parses basic CSV with standard headers", () => {
    const csv = `First Name,Last Name,Phone,Email
Alice,Smith,+15551234567,alice@example.com
Bob,Jones,+15559876543,bob@example.com`;

    const contacts = parseCsvString(csv);
    expect(contacts).toHaveLength(2);
    expect(contacts[0].firstName).toBe("Alice");
    expect(contacts[0].lastName).toBe("Smith");
    expect(contacts[0].phones).toEqual(["+15551234567"]);
    expect(contacts[0].email).toBe("alice@example.com");
  });

  it("handles alternative header names (firstname, mobile)", () => {
    const csv = `firstname,lastname,mobile
Charlie,Brown,+15553333333`;

    const contacts = parseCsvString(csv);
    expect(contacts).toHaveLength(1);
    expect(contacts[0].firstName).toBe("Charlie");
    expect(contacts[0].phones).toEqual(["+15553333333"]);
  });

  it("collects phones from multiple phone columns", () => {
    const csv = `First Name,Last Name,Phone,Mobile
Alice,Smith,+15551111111,+15552222222`;

    const contacts = parseCsvString(csv);
    expect(contacts[0].phones).toEqual(["+15551111111", "+15552222222"]);
  });

  it("handles quoted fields with commas", () => {
    const csv = `First Name,Last Name,Phone
"Smith, Jr.",Alice,+15551234567`;

    const contacts = parseCsvString(csv);
    expect(contacts[0].firstName).toBe("Smith, Jr.");
  });

  it("handles escaped quotes in fields", () => {
    const csv = `First Name,Last Name,Phone
"She said ""hi""",Smith,+15551234567`;

    const contacts = parseCsvString(csv);
    expect(contacts[0].firstName).toBe('She said "hi"');
  });

  it("skips rows without phone numbers", () => {
    const csv = `First Name,Last Name,Phone,Email
Alice,Smith,,alice@example.com
Bob,Jones,+15559876543,`;

    const contacts = parseCsvString(csv);
    expect(contacts).toHaveLength(1);
    expect(contacts[0].firstName).toBe("Bob");
  });

  it("returns empty array for header-only CSV", () => {
    expect(parseCsvString("First Name,Last Name,Phone")).toEqual([]);
  });

  it("returns empty array for empty input", () => {
    expect(parseCsvString("")).toEqual([]);
  });

  it("handles Windows-style line endings", () => {
    const csv = "First Name,Last Name,Phone\r\nAlice,Smith,+15551234567\r\n";
    const contacts = parseCsvString(csv);
    expect(contacts).toHaveLength(1);
  });
});
