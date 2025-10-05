#!/usr/bin/env bash
set -euo pipefail

# setup-rhubarb.sh
# Download and install Rhubarb Lip-Sync executable into apps/backend/bin
# Works on Linux and macOS (x86_64 and arm64) releases

WORKDIR=$(pwd)
DEST_DIR="$WORKDIR/apps/backend/bin"
mkdir -p "$DEST_DIR"

echo "Detecting OS and architecture..."
UNAME=$(uname -s)
ARCH=$(uname -m)

# Determine expected asset name pattern
ASSET_NAME=""
DOWNLOAD_URL=""

if [[ "$UNAME" == "Linux" ]]; then
  if [[ "$ARCH" == "x86_64" || "$ARCH" == "amd64" ]]; then
    ASSET_NAME="rhubarb_linux_x86_64.zip"
  elif [[ "$ARCH" == "aarch64" || "$ARCH" == "arm64" ]]; then
    ASSET_NAME="rhubarb_linux_arm64.zip"
  fi
elif [[ "$UNAME" == "Darwin" ]]; then
  if [[ "$ARCH" == "x86_64" ]]; then
    ASSET_NAME="rhubarb_mac_x86_64.zip"
  elif [[ "$ARCH" == "arm64" ]]; then
    ASSET_NAME="rhubarb_mac_arm64.zip"
  fi
fi

if [[ -z "$ASSET_NAME" ]]; then
  echo "Unsupported OS/ARCH: $UNAME / $ARCH" >&2
  exit 1
fi

echo "Looking up latest Rhubarb Lip-Sync release..."
API_URL="https://api.github.com/repos/DanielSWolf/rhubarb-lip-sync/releases/latest"

# Allow overriding asset URL via env var (useful if automatic detection fails)
if [[ -n "${RHUBARB_URL:-}" ]]; then
  echo "Using RHUBARB_URL from environment"
  ASSET_URL="$RHUBARB_URL"
fi

# Check required tools
for cmd in curl unzip; do
  if ! command -v "$cmd" >/dev/null 2>&1; then
    echo "Required command '$cmd' not found. Please install it and re-run the script. e.g. on Debian/Ubuntu: sudo apt install $cmd" >&2
    exit 1
  fi
done

# Use curl to get release metadata and find the asset download URL.
# We'll try in order: exact asset name, best OS+arch match, then any asset containing 'rhubarb'.
ASSETS_JSON=$(curl -s "$API_URL")
ASSET_URL=""

if [[ -n "$ASSET_NAME" ]]; then
  ASSET_URL=$(echo "$ASSETS_JSON" | grep -E "browser_download_url.*$ASSET_NAME" | head -n1 | cut -d '"' -f4 || true)
fi

if [[ -z "$ASSET_URL" ]]; then
  # Extract all asset urls
  ASSET_LIST=$(echo "$ASSETS_JSON" | grep -o '"browser_download_url": *"[^"]\+"' | cut -d '"' -f4)

  # Try OS+arch match
  OS_TOKEN="linux"
  if [[ "$UNAME" == "Darwin" ]]; then
    OS_TOKEN="mac"
  fi
  ARCH_TOKEN=""
  if [[ "$ARCH" == "x86_64" || "$ARCH" == "amd64" ]]; then
    ARCH_TOKEN="x86_64|amd64"
  elif [[ "$ARCH" == "aarch64" || "$ARCH" == "arm64" ]]; then
    ARCH_TOKEN="arm64|aarch64"
  fi

  if [[ -n "$ARCH_TOKEN" ]]; then
    ASSET_URL=$(echo "$ASSET_LIST" | grep -i 'rhubarb' | grep -iE "$OS_TOKEN" | grep -iE "$ARCH_TOKEN" | head -n1 || true)
  fi

  # Fallback: any asset containing 'rhubarb'
  if [[ -z "$ASSET_URL" ]]; then
    ASSET_URL=$(echo "$ASSET_LIST" | grep -i 'rhubarb' | head -n1 || true)
  fi

fi

if [[ -z "$ASSET_URL" ]]; then
  echo "Could not find a suitable rhubarb release asset. Please download and place the executable manually: https://github.com/DanielSWolf/rhubarb-lip-sync/releases" >&2
  exit 1
fi

TMP_DIR=$(mktemp -d)
ZIP_FILE="$TMP_DIR/rhubarb.zip"

echo "Downloading $ASSET_URL"
curl -L -o "$ZIP_FILE" "$ASSET_URL"

echo "Extracting..."
unzip -o "$ZIP_FILE" -d "$TMP_DIR"

# Find the executable inside the extracted folder
RHUBARB_EXE=$(find "$TMP_DIR" -type f -name rhubarb -print -quit || true)
if [[ -z "$RHUBARB_EXE" ]]; then
  echo "Could not find 'rhubarb' executable inside the downloaded archive." >&2
  ls -la "$TMP_DIR"
  exit 1
fi

# Prefer copying the entire extracted tree so included resource folders (res/) are preserved.
EXTRACT_ROOT="$TMP_DIR"
FIRST_SUBDIR=$(find "$TMP_DIR" -mindepth 1 -maxdepth 1 -type d | head -n1 || true)
if [[ -n "$FIRST_SUBDIR" ]]; then
  EXTRACT_ROOT="$FIRST_SUBDIR"
fi

echo "Copying extracted files from $EXTRACT_ROOT to $DEST_DIR"
cp -R "$EXTRACT_ROOT"/* "$DEST_DIR"/

# Ensure an executable is present at $DEST_DIR/rhubarb
if [[ ! -f "$DEST_DIR/rhubarb" ]]; then
  FOUND=$(find "$DEST_DIR" -type f -name rhubarb -print -quit || true)
  if [[ -n "$FOUND" ]]; then
    mv "$FOUND" "$DEST_DIR/rhubarb" || true
  fi
fi

if [[ -f "$DEST_DIR/rhubarb" ]]; then
  chmod +x "$DEST_DIR/rhubarb"
else
  echo "Failed to locate rhubarb executable after extraction." >&2
  ls -la "$DEST_DIR"
  exit 1
fi

rm -rf "$TMP_DIR"

echo "Rhubarb installed to $DEST_DIR/rhubarb"

echo "You can set RHUBARB_PATH to that executable if desired, or leave it and the server will use apps/backend/bin/rhubarb by default." 

exit 0
