# FireDrill

A CLI tool for broadcasting iMessages via macOS Messages.app. Load contacts from Contacts.app, vCard files, or CSVs, personalize messages with templates, and send with built-in rate limiting.

**macOS only** — uses AppleScript to control Messages.app and Contacts.app.

## Install

```bash
git clone https://github.com/yourusername/firedrill.git
cd firedrill
npm install
npm run build
npm link  # makes `firedrill` available globally
```

Or run directly without installing:

```bash
npm run dev -- <command>
```

## Quick Start

```bash
# Send a single message
firedrill send --to "+15551234567" --message "Hey, this is a test!"

# Send to a Contacts.app group with personalization
firedrill send --group "Book Club" --message "Hi {{firstName}}, meeting moved to Thursday."

# Preview without sending
firedrill send --group "Team" --message "Reminder: standup at 9am" --dry-run

# Send to contacts from a file
firedrill send --import contacts.csv --message "Hello {{firstName}}!"
```

## Commands

### `firedrill send`

Send iMessage(s) to one or more recipients.

| Flag | Description |
|------|-------------|
| `-m, --message <text>` | **Required.** Message body. Supports `{{var}}` templates. |
| `-t, --to <phone>` | Send to a single phone number. |
| `-g, --group <name>` | Send to all contacts in a Contacts.app group. |
| `-i, --import <path>` | Send to contacts from a `.vcf` or `.csv` file. |
| `-d, --delay <ms>` | Delay between messages in ms (default: 4000). |
| `--max-per-hour <n>` | Hard cap on messages per hour (default: 150). |
| `--dry-run` | Preview messages without sending. |
| `-y, --confirm` | Skip the Y/N confirmation prompt. |

#### Template Variables

Use `{{variableName}}` in your message to personalize per-recipient:

| Variable | Description |
|----------|-------------|
| `{{firstName}}` | Contact's first name |
| `{{lastName}}` | Contact's last name |
| `{{fullName}}` | First + last name |
| `{{phone}}` | Recipient phone number |
| `{{email}}` | Contact's email address |

### `firedrill contacts list`

List contacts with phone numbers.

| Flag | Description |
|------|-------------|
| `-s, --search <term>` | Filter contacts by name. |
| `-g, --group <name>` | List contacts in a specific group. |
| `-i, --import <file>` | Load contacts from a `.vcf` or `.csv` file. |
| `--json` | Output as JSON. |

### `firedrill contacts groups`

List all groups in Contacts.app.

## Configuration

FireDrill works with zero configuration. Optionally create `~/.firedrill/config.json` to change defaults:

```json
{
  "delayMs": 4000,
  "maxPerHour": 150,
  "serviceName": "iMessage"
}
```

CLI flags always override config file values.

## Rate Limiting

Default settings are conservative to stay well under Apple's iMessage throttling thresholds:

- **4-second delay** between messages
- **150 messages per hour** hard cap

If the hourly cap is hit, FireDrill pauses automatically until the rolling window allows more sends. Adjust with `--delay` and `--max-per-hour` at your own risk.

## CSV Format

FireDrill auto-detects common column names (case-insensitive):

- **First name:** `First Name`, `firstname`, `Given Name`
- **Last name:** `Last Name`, `lastname`, `Family Name`, `Surname`
- **Phone:** `Phone`, `Mobile`, `Cell`, `Telephone`
- **Email:** `Email`, `E-Mail`, `Email Address`

Multiple phone columns (e.g. `Phone` and `Mobile`) are all collected. Contacts without any phone number are skipped.

## Logging

Every send operation writes a JSON log to `~/.firedrill/logs/`. Logs include timestamps, per-recipient success/failure, and summary counts — useful for auditing broadcasts.

## Requirements

- macOS (uses AppleScript)
- Node.js 20+
- Messages.app signed into iMessage

## Development

```bash
npm install
npm test          # run unit tests
npm run test:watch # watch mode
npm run dev -- <command>  # run without building
```

## License

MIT
