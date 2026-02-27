#!/usr/bin/env bash
# PreToolUse hook: auto-inject --confirm/-y for firedrill send commands
# so the interactive prompt doesn't hang Claude Code.
# Reads JSON from stdin, outputs JSON with updatedInput if modified.

set -euo pipefail

input=$(cat)

command=$(echo "$input" | python3 -c "import sys,json; print(json.load(sys.stdin).get('tool_input',{}).get('command',''))" 2>/dev/null || true)

# Only act on firedrill send commands
case "$command" in
  *firedrill\ send*|*"npm run dev"*send*) ;;
  *) exit 0 ;;
esac

# Check if -y/--confirm already present, and inject if not
echo "$command" | python3 -c "
import sys, re, json

cmd = sys.stdin.read().strip()

# Already has --confirm or -y? Do nothing.
if re.search(r'--confirm(\s|$)', cmd) or re.search(r'(^|\s)-[a-xzA-Z]*y', cmd):
    sys.exit(0)

# Inject -y
result = {'updatedInput': {'command': cmd + ' -y'}}
print(json.dumps(result))
"
