/**
 * Tests for the vCard parser.
 * Covers single-contact, multi-contact, line unfolding, and edge cases.
 */

import { describe, it, expect } from "vitest";
import { parseVCardString } from "./vcard-parser.js";

describe("parseVCardString", () => {
  it("parses a basic vCard 3.0 contact", () => {
    const vcf = `BEGIN:VCARD
VERSION:3.0
N:Smith;Alice;;;
FN:Alice Smith
TEL;TYPE=CELL:+15551234567
EMAIL:alice@example.com
END:VCARD`;

    const contacts = parseVCardString(vcf);
    expect(contacts).toHaveLength(1);
    expect(contacts[0].firstName).toBe("Alice");
    expect(contacts[0].lastName).toBe("Smith");
    expect(contacts[0].phones).toEqual(["+15551234567"]);
    expect(contacts[0].email).toBe("alice@example.com");
  });

  it("parses multiple contacts in one file", () => {
    const vcf = `BEGIN:VCARD
VERSION:3.0
N:Smith;Alice;;;
TEL:+15551234567
END:VCARD
BEGIN:VCARD
VERSION:3.0
N:Jones;Bob;;;
TEL:+15559876543
END:VCARD`;

    const contacts = parseVCardString(vcf);
    expect(contacts).toHaveLength(2);
    expect(contacts[0].firstName).toBe("Alice");
    expect(contacts[1].firstName).toBe("Bob");
  });

  it("collects multiple phone numbers", () => {
    const vcf = `BEGIN:VCARD
VERSION:3.0
N:Doe;Jane;;;
TEL;TYPE=CELL:+15551111111
TEL;TYPE=HOME:+15552222222
END:VCARD`;

    const contacts = parseVCardString(vcf);
    expect(contacts[0].phones).toEqual(["+15551111111", "+15552222222"]);
  });

  it("skips contacts without phone numbers", () => {
    const vcf = `BEGIN:VCARD
VERSION:3.0
N:NoPhone;Person;;;
EMAIL:nophone@example.com
END:VCARD`;

    const contacts = parseVCardString(vcf);
    expect(contacts).toHaveLength(0);
  });

  it("falls back to FN when N is missing", () => {
    const vcf = `BEGIN:VCARD
VERSION:4.0
FN:Charlie Brown
TEL:+15553333333
END:VCARD`;

    const contacts = parseVCardString(vcf);
    expect(contacts[0].firstName).toBe("Charlie");
    expect(contacts[0].lastName).toBe("Brown");
  });

  it("handles line unfolding (continuation lines)", () => {
    const vcf = `BEGIN:VCARD\r\nVERSION:3.0\r\nN:Smith;Alice;;;\r\nTEL;TYPE=CEL\r\n L:+15551234567\r\nEND:VCARD`;

    const contacts = parseVCardString(vcf);
    expect(contacts).toHaveLength(1);
    expect(contacts[0].phones).toEqual(["+15551234567"]);
  });

  it("returns empty array for empty input", () => {
    expect(parseVCardString("")).toEqual([]);
    expect(parseVCardString("   ")).toEqual([]);
  });
});
