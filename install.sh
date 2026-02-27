#!/usr/bin/env bash
# FireDrill installer
# Usage: curl -fsSL https://raw.githubusercontent.com/yourusername/firedrill/main/install.sh | bash

set -euo pipefail

REPO_URL="https://github.com/yourusername/firedrill.git"
INSTALL_DIR="$HOME/.firedrill-src"

echo "==> FireDrill installer"
echo ""

# --- Check macOS ---
if [[ "$(uname -s)" != "Darwin" ]]; then
  echo "Error: FireDrill requires macOS (uses AppleScript + Messages.app)."
  exit 1
fi

# --- Check Node.js ---
if ! command -v node &>/dev/null; then
  echo "Error: Node.js is required but not installed."
  echo "Install it from https://nodejs.org/ or via: brew install node"
  exit 1
fi

NODE_MAJOR=$(node -e "process.stdout.write(String(process.versions.node.split('.')[0]))")
if (( NODE_MAJOR < 20 )); then
  echo "Error: Node.js >= 20 required (found v$(node -v))."
  echo "Update via: brew upgrade node"
  exit 1
fi
echo "    Node.js v$(node -v | tr -d 'v') ✓"

# --- Check npm ---
if ! command -v npm &>/dev/null; then
  echo "Error: npm is required but not installed."
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
