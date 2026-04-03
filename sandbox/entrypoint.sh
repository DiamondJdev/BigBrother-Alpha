#!/bin/bash
set -e

# Wait for installer to appear in /sandbox for up to 30 seconds
WAIT_SECONDS=30
SLEPT=0
while [ ! -f /sandbox/installer.exe ] && [ "$SLEPT" -lt "$WAIT_SECONDS" ]; do
  echo "[Sandbox] Waiting for installer to be copied into container... ($SLEPT/$WAIT_SECONDS)"
  sleep 1
  SLEPT=$((SLEPT+1))
done

if [ -f /sandbox/installer.exe ]; then
  echo "[Sandbox] Found installer, simulating install..."
  mkdir -p /installed
  cp /sandbox/installer.exe /installed/ || true
  echo "installed at $(date -u +%Y-%m-%dT%H:%M:%SZ)" > /installed/INSTALL_MARKER.txt
  echo "[Sandbox] Install simulated successfully"
  exit 0
else
  echo "[Sandbox] No installer found after waiting ${WAIT_SECONDS}s"
  exit 1
fi
