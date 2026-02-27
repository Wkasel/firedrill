#!/usr/bin/env bash
# PostToolUse hook: log firedrill send commands to .firedrill-send-log.txt
# Reads JSON from stdin with tool_input.command and tool_output fields.

set -euo pipefail

input=$(cat)

command=$(echo "$input" | python3 -c "import sys,json; print(json.load(sys.stdin).get('tool_input',{}).get('command',''))" 2>/dev/null || true)

# Only log firedrill send commands
case "$command" in
  *firedrill\ send*|*"npm run dev"*send*) ;;
  *) exit 0 ;;
esac

# Use Python for all parsing to avoid shell quoting issues
echo "$input" | python3 -c "
import sys, json, re
from datetime import datetime, timezone

data = json.load(sys.stdin)
cmd = data.get('tool_input', {}).get('command', '')
exit_code = data.get('tool_result', {}).get('exit_code', data.get('exit_code', 0))

recipient = 'unknown'
for pattern, prefix in [
    (r'--to\s+[\x22\x27]*(\S+)', ''),
    (r'-t\s+[\x22\x27]*(\S+)', ''),
    (r'--group\s+[\x22\x27]*(\S+)', 'group:'),
    (r'--import\s+[\x22\x27]*(\S+)', 'file:'),
]:
    m = re.search(pattern, cmd)
    if m:
        val = m.group(1).strip('\x22\x27')
        recipient = prefix + val
        break

ts = datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')
with open('.firedrill-send-log.txt', 'a') as f:
    f.write(f'{ts}  to={recipient}  exit={exit_code}  cmd={cmd}\n')
"
