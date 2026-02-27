#!/usr/bin/env bash
# FireDrill installer — works on a fresh Mac with no dev tools
# Usage: curl -fsSL https://raw.githubusercontent.com/wkasel/firedrill/main/install.sh -o /tmp/firedrill-install.sh && bash /tmp/firedrill-install.sh

set -euo pipefail

REPO_TARBALL="https://github.com/wkasel/firedrill/archive/refs/heads/main.tar.gz"
INSTALL_DIR="$HOME/.firedrill-src"

echo "==> FireDrill installer"
echo ""

# --- Check macOS ---
if [[ "$(uname -s)" != "Darwin" ]]; then
  echo "Error: FireDrill requires macOS (uses AppleScript + Messages.app)."
  exit 1
fi

# --- Check / install Node.js 20+ via official .pkg ---
NEED_NODE=0
if ! command -v node &>/dev/null; then
  NEED_NODE=1
else
  NODE_MAJOR=$(node -e "process.stdout.write(String(process.versions.node.split('.')[0]))")
  if (( NODE_MAJOR < 20 )); then
    NEED_NODE=1
  fi
fi

if (( NEED_NODE )); then
  echo "==> Node.js 20+ not found — installing from nodejs.org..."
  echo "    (you will be prompted for your password)"

  # Resolve latest Node 22 LTS version
  NODE_VERSION=$(curl -fsSL https://nodejs.org/dist/latest-v22.x/SHASUMS256.txt \
    | grep -o 'node-v[0-9.]*' | head -1 | sed 's/node-//')
  PKG_URL="https://nodejs.org/dist/${NODE_VERSION}/node-${NODE_VERSION}.pkg"

  echo "    Downloading ${NODE_VERSION}..."
  curl -fL# "$PKG_URL" -o /tmp/node-latest.pkg

  echo "    Installing (requires admin password)..."
  sudo installer -pkg /tmp/node-latest.pkg -target /
  rm -f /tmp/node-latest.pkg
fi
echo "    Node.js $(node -v) ✓"

# --- Check npm ---
if ! command -v npm &>/dev/null; then
  echo "Error: npm not found (should have been installed with Node)."
  exit 1
fi
echo "    npm v$(npm -v) ✓"

# --- Download source ---
# If we're already in a firedrill repo (has package.json with name "firedrill"), use it
if [[ -f "package.json" ]] && python3 -c "import json; exit(0 if json.load(open('package.json')).get('name')=='firedrill' else 1)" 2>/dev/null; then
  echo "==> Using current directory as source"
  SRC_DIR="$(pwd)"
else
  echo "==> Downloading firedrill..."
  rm -rf "$INSTALL_DIR"
  mkdir -p "$INSTALL_DIR"
  curl -fsSL "$REPO_TARBALL" | tar xz --strip-components=1 -C "$INSTALL_DIR"
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
