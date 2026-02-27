# FireDrill

CLI tool for broadcasting iMessages via macOS Messages.app.

## Running

```bash
npm run dev -- <command>       # development (no build needed)
firedrill <command>            # after npm link
```

## Commands

| Command | Description |
|---------|-------------|
| `send` | Send iMessage(s) to one or more recipients |
| `contacts list` | List contacts with phone numbers |
| `contacts groups` | List all Contacts.app groups |

### `send` flags

| Flag | Description | Default |
|------|-------------|---------|
| `-m, --message <text>` | **Required.** Message body (supports `{{var}}` templates) | — |
| `-t, --to <phone>` | Single recipient phone number | — |
| `-g, --group <name>` | Send to a Contacts.app group | — |
| `-i, --import <path>` | Load recipients from `.vcf` or `.csv` | — |
| `-d, --delay <ms>` | Delay between messages | `4000` |
| `--max-per-hour <n>` | Hard cap on messages per hour | `150` |
| `--dry-run` | Preview messages without sending | — |
| `-y, --confirm` | Skip Y/N confirmation prompt | — |

### `contacts list` flags

| Flag | Description |
|------|-------------|
| `-s, --search <term>` | Filter by name |
| `-g, --group <name>` | List contacts in a group |
| `-i, --import <file>` | Load from `.vcf` or `.csv` |
| `--json` | Output as JSON |

## Template Variables

Use `{{variableName}}` in `--message`:

| Variable | Value |
|----------|-------|
| `{{firstName}}` | Contact's first name |
| `{{lastName}}` | Contact's last name |
| `{{fullName}}` | First + last name |
| `{{phone}}` | Recipient phone number |
| `{{email}}` | Contact's email address |

## Architecture

```
src/
  commands/     CLI handlers (contacts, send)
  core/         Business logic (apple-contacts, imessage, rate-limiter, template-engine)
  import/       File parsers (vcard, csv)
  models/       Data types (contact, config)
  pipeline/     Send orchestrator
  util/         Low-level utilities (osascript, phone, logger)
```

Config precedence: defaults → `~/.firedrill/config.json` → CLI flags.

## Testing

```bash
npm test              # 47 tests, all should pass
npm run test:watch    # watch mode
```

Tests cover template engine, rate limiter, phone normalization, CSV/vCard parsing, and AppleScript injection prevention. Uses vitest with fake timers for time-dependent tests.

## Constraints

- **macOS only** — uses AppleScript to drive Messages.app and Contacts.app
- **Messages.app must be signed into iMessage**
- Rate limiting defaults (4s delay, 150/hr) are conservative to avoid Apple throttling
- Single runtime dependency: `commander`
