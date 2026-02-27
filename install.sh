#!/usr/bin/env bash
# FireDrill installer
# Usage: curl -fsSL https://raw.githubusercontent.com/wkasel/firedrill/main/install.sh | bash

set -euo pipefail

REPO_URL="https://github.com/wkasel/firedrill.git"
INSTALL_DIR="$HOME/.firedrill-src"

echo "==> FireDrill installer"
echo ""

# --- Check macOS ---
if [[ "$(uname -s)" != "Darwin" ]]; then
  echo "Error: FireDrill requires macOS (uses AppleScript + Messages.app)."
  exit 1
fi

# --- Check / install Homebrew ---
if ! command -v brew &>/dev/null; then
  # Homebrew requires the user to be an admin
  if ! dseditgroup -o checkmember -m "$(whoami)" admin &>/dev/null; then
    echo "Error: Homebrew requires an admin account to install."
    echo "Either log in as an admin user, or ask an admin to run:"
    echo "  sudo dseditgroup -o edit -a $(whoami) -t user admin"
    echo "Then re-run this installer."
    exit 1
  fi
  echo "==> Homebrew not found — installing (you will be prompted for your password)..."
  # Redirect stdin from /dev/tty so the Homebrew installer can prompt for
  # the sudo password even when this script is piped via curl | bash.
  /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)" < /dev/tty

  # Add brew to PATH for the rest of this script (Apple Silicon vs Intel)
  if [[ -f /opt/homebrew/bin/brew ]]; then
    eval "$(/opt/homebrew/bin/brew shellenv)"
  elif [[ -f /usr/local/bin/brew ]]; then
    eval "$(/usr/local/bin/brew shellenv)"
  fi
fi
echo "    Homebrew $(brew --version | head -1 | awk '{print $2}') ✓"

# --- Check / install Node.js 20+ ---
NEED_NODE=0
if ! command -v node &>/dev/null; then
  NEED_NODE=1
else
  NODE_MAJOR=$(node -e "process.stdout.write(String(process.versions.node.split('.')[0]))")
  if (( NODE_MAJOR < 20 )); then
    NEED_NODE=2
  fi
fi

if (( NEED_NODE == 1 )); then
  echo "==> Node.js not found — installing via Homebrew..."
  brew install node
elif (( NEED_NODE == 2 )); then
  echo "==> Node.js $(node -v) is too old (need 20+) — upgrading via Homebrew..."
  brew upgrade node
fi
echo "    Node.js v$(node -v | tr -d 'v') ✓"

# --- Check npm ---
if ! command -v npm &>/dev/null; then
  echo "Error: npm is required but not found (should have been installed with Node)."
  exit 1
fi
echo "    npm v$(npm -v) ✓"

# --- Determine source directory ---
# If we're already in a firedrill repo (has package.json with name "firedrill"), use it
if [[ -f "package.json" ]] && python3 -c "import json; exit(0 if json.load(open('package.json')).get('name')=='firedrill' else 1)" 2>/dev/null; then
  echo "==> Using current directory as source"
  SRC_DIR="$(pwd)"
else
  echo "==> Cloning firedrill..."
  if [[ -d "$INSTALL_DIR" ]]; then
    echo "    Updating existing clone..."
    git -C "$INSTALL_DIR" pull --ff-only
  else
    git clone "$REPO_URL" "$INSTALL_DIR"
  fi
  SRC_DIR="$INSTALL_DIR"
fi

# --- Install, build, link ---
echo "==> Installing dependencies..."
cd "$SRC_DIR"
npm install

echo "==> Building..."
npm run build

echo "==> Linking globally..."
npm link

echo ""
echo "==> FireDrill installed successfully!"
echo ""
echo "Quick start:"
echo "  firedrill contacts list                     # list your contacts"
echo "  firedrill contacts groups                   # list contact groups"
echo "  firedrill send -t \"+15551234567\" -m \"Hi!\"   # send a message"
echo "  firedrill send -g \"Family\" -m \"Hello {{firstName}}!\" --dry-run"
echo ""
echo "Run 'firedrill --help' for full usage."
