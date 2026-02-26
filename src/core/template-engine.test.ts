/**
 * Tests for the template engine.
 * Covers basic interpolation, missing variables, whitespace handling,
 * and variable extraction.
 */

import { describe, it, expect } from "vitest";
import { renderTemplate, extractVariables } from "./template-engine.js";

describe("renderTemplate", () => {
  it("replaces a single variable", () => {
    expect(renderTemplate("Hi {{firstName}}!", { firstName: "Alice" })).toBe(
      "Hi Alice!",
    );
  });

  it("replaces multiple variables", () => {
    const result = renderTemplate("{{firstName}} {{lastName}}", {
      firstName: "Alice",
      lastName: "Smith",
    });
    expect(result).toBe("Alice Smith");
  });

  it("leaves unknown variables as-is", () => {
    expect(renderTemplate("Hi {{unknown}}!", {})).toBe("Hi {{unknown}}!");
  });

  it("handles whitespace inside braces", () => {
    expect(renderTemplate("Hi {{ firstName }}!", { firstName: "Bob" })).toBe(
      "Hi Bob!",
    );
  });

  it("replaces the same variable multiple times", () => {
    expect(
      renderTemplate("{{name}} and {{name}}", { name: "X" }),
    ).toBe("X and X");
  });

  it("returns the template unchanged if no variables present", () => {
    expect(renderTemplate("Hello world!", {})).toBe("Hello world!");
  });

  it("handles empty variable values", () => {
    expect(renderTemplate("Hi {{name}}!", { name: "" })).toBe("Hi !");
  });
});

describe("extractVariables", () => {
  it("extracts variable names from a template", () => {
    const vars = extractVariables("Hi {{firstName}} {{lastName}}!");
    expect(vars).toEqual(["firstName", "lastName"]);
  });

  it("deduplicates variable names", () => {
    const vars = extractVariables("{{x}} and {{x}}");
    expect(vars).toEqual(["x"]);
  });

  it("returns empty array for no variables", () => {
    expect(extractVariables("Hello world!")).toEqual([]);
  });

  it("handles whitespace in braces", () => {
    const vars = extractVariables("{{ name }}");
    expect(vars).toEqual(["name"]);
  });
});
