/**
 * Lightweight template engine for message personalization.
 *
 * Supports `{{variableName}}` placeholders that are replaced with values
 * from a context object. Unknown variables are left as-is so the user
 * can see what failed to interpolate.
 *
 * @example
 *   renderTemplate("Hi {{firstName}}!", { firstName: "Alice" })
 *   // => "Hi Alice!"
 */

/**
 * Replace all `{{key}}` placeholders in `template` with values from `vars`.
 * Whitespace inside braces is trimmed: `{{ firstName }}` works the same as
 * `{{firstName}}`.
 *
 * @param template - The message template string.
 * @param vars     - Key/value map of template variables.
 * @returns The rendered string with placeholders replaced.
 */
export function renderTemplate(
  template: string,
  vars: Record<string, string>,
): string {
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (match, key: string) => {
    return key in vars ? vars[key] : match;
  });
}

/**
 * Extract the list of variable names from a template string.
 * Useful for validation and dry-run previews.
 *
 * @param template - The message template string.
 * @returns Array of unique variable names found in the template.
 */
export function extractVariables(template: string): string[] {
  const matches = template.matchAll(/\{\{\s*(\w+)\s*\}\}/g);
  const names = new Set<string>();
  for (const m of matches) {
    names.add(m[1]);
  }
  return [...names];
}
