#!/usr/bin/env bash
# Patches the generated AndroidManifest.xml to add CAMERA permission.
# Run after `tauri android init` to apply.
set -euo pipefail

MANIFEST="gen/android/app/src/main/AndroidManifest.xml"

if [ ! -f "$MANIFEST" ]; then
  echo "ERROR: $MANIFEST not found. Run 'tauri android init' first." >&2
  exit 1
fi

if grep -q 'android.permission.CAMERA' "$MANIFEST"; then
  echo "CAMERA permission already present in AndroidManifest.xml"
  exit 0
fi

echo "Adding CAMERA permission to AndroidManifest.xml..."
sed -i 's|<uses-permission android:name="android.permission.INTERNET" />|<uses-permission android:name="android.permission.INTERNET" />\n    <uses-permission android:name="android.permission.CAMERA" />\n    <uses-feature android:name="android.hardware.camera" android:required="false" />\n    <uses-feature android:name="android.hardware.camera.autofocus" android:required="false" />|' "$MANIFEST"
echo "Done."
