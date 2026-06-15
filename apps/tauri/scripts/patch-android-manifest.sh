#!/usr/bin/env bash
# Patches the generated AndroidManifest.xml with:
# 1. CAMERA permission
# 2. Deep link intent filter (zeavisedu:// scheme) for Google OAuth return
# Run after `tauri android init` to apply.
set -euo pipefail

MANIFEST="gen/android/app/src/main/AndroidManifest.xml"

if [ ! -f "$MANIFEST" ]; then
  echo "ERROR: $MANIFEST not found. Run 'tauri android init' first." >&2
  exit 1
fi

# ── CAMERA permission ──────────────────────────────────────────────────

if ! grep -q 'android.permission.CAMERA' "$MANIFEST"; then
  echo "Adding CAMERA permission to AndroidManifest.xml..."
  sed -i 's|<uses-permission android:name="android.permission.INTERNET" />|<uses-permission android:name="android.permission.INTERNET" />\n    <uses-permission android:name="android.permission.CAMERA" />\n    <uses-feature android:name="android.hardware.camera" android:required="false" />\n    <uses-feature android:name="android.hardware.camera.autofocus" android:required="false" />|' "$MANIFEST"
else
  echo "CAMERA permission already present."
fi

# ── Deep link intent filter ────────────────────────────────────────────
# Allows the app to receive zeavisedu:// scheme URLs from the system browser
# (used after Google OAuth completes in external browser on Android)

DEEP_LINK_FILTER='<!-- Deep link for Google OAuth return from system browser -->\
        <intent-filter android:autoVerify="true">\
            <action android:name="android.intent.action.VIEW" />\
            <category android:name="android.intent.category.DEFAULT" />\
            <category android:name="android.intent.category.BROWSABLE" />\
            <data android:scheme="zeavisedu" />\
        </intent-filter>'

if grep -q 'android:scheme="zeavisedu"' "$MANIFEST"; then
  echo "Deep link intent filter already present."
else
  echo "Adding deep link intent filter to AndroidManifest.xml..."
  # Insert before the closing </activity> tag of MainActivity
  sed -i "s|</activity>|${DEEP_LINK_FILTER}\n        </activity>|" "$MANIFEST"
  echo "Deep link intent filter added."
fi

echo "AndroidManifest patched successfully."
