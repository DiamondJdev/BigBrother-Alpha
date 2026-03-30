#!/bin/bash
set -e

# Simple fake installer runner: if /sandbox/installer.exe exists, "install" it by
# copying to /installed and creating a marker file.

if [ -f /sandbox/installer.exe ]; then
  echo "[Sandbox] Found installer, simulating install..."
  mkdir -p /installed
  cp /sandbox/installer.exe /installed/
  echo "installed at $(date -u +%Y-%m-%dT%H:%M:%SZ)" > /installed/INSTALL_MARKER.txt
  echo "[Sandbox] Install simulated successfully"
  exit 0
else
  echo "[Sandbox] No installer found"
  exit 1
fi
