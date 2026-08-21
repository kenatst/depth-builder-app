#!/bin/bash
# Captures every onboarding/diagnosis state on the given simulator device using a
# single app launch + runtime state switching (-qaWatch).
# Usage: capture-native.sh <device-name> <output-dir> [app-path]
set -euo pipefail

DEVICE="${1:?device name}"
OUT="${2:?output dir}"
APP="${3:-/tmp/reboot-dd2/Build/Products/Debug-iphonesimulator/REBOOT.app}"
BUNDLE=com.kenatst.reboot
STATE_DIR="$(cd "$(dirname "$0")/.." && pwd)/qa/state"
CURRENT="$STATE_DIR/current.json"

mkdir -p "$OUT"

set_state() {
  cp "$STATE_DIR/$1.json" "$CURRENT"
  sleep "${2:-1.4}"
}

capture() {
  local state="$1"
  local wait_ms="${2:-1.4}"
  set_state "$state" "$wait_ms"
  # Retry until the screen matches the expected family (launch screen / wallpaper
  # are never accepted).
  for attempt in 1 2 3 4 5; do
    xcrun simctl io "$DEVICE" screenshot "$OUT/.tmp-$state.png" >/dev/null 2>&1
    local expected
    case "$state" in
      cine-*|dissolve-*) expected=dark ;;
      *) expected=paper ;;
    esac
    local ok
    ok=$(EXPECT="$expected" python3 - "$OUT/.tmp-$state.png" <<'PYEOF' 2>/dev/null || echo 0
import sys
import os
from PIL import Image
im = Image.open(sys.argv[1]).convert("RGB").resize((20, 44))
px = list(im.getdata())
white = sum(1 for (r,g,b) in px if r > 235 and g > 235 and b > 235) / len(px)
avg_r = sum(p[0] for p in px) / len(px)
avg_g = sum(p[1] for p in px) / len(px)
avg_b = sum(p[2] for p in px) / len(px)
if white > 0.7:
    print(0)  # launch screen
elif os.environ.get("EXPECT") == "dark":
    print(1 if avg_r < 110 else 0)
else:
    print(1 if avg_r > 210 and avg_g > 200 and avg_r >= avg_b else 0)
PYEOF
)
    if [ "$ok" = "1" ]; then
      mv "$OUT/.tmp-$state.png" "$OUT/$state.png"
      break
    fi
    sleep 1.2
  done
  rm -f "$OUT/.tmp-$state.png"
  echo "captured $state @ $OUT"
}

# Single launch; the app then follows qa/state/current.json.
xcrun simctl terminate "$DEVICE" "$BUNDLE" 2>/dev/null || true
sleep 0.8
xcrun simctl launch "$DEVICE" "$BUNDLE" \
  -qaState "$STATE_DIR/cine-1.json" \
  -qaWatch "$STATE_DIR" \
  -qaDissolve 5 >/dev/null
sleep 2.8

capture "cine-1" 1.6
for i in 2 3 4 5 6; do
  capture "cine-$i" 1.4
done

capture "dissolve-collapse" 1.1
capture "dissolve-clarity" 1.8

for state in \
  d1-goals d1-goals-selected d2-primary d3-breaker d4-social_app \
  d5-phone_place d6-focus_window d7-work_break d8-reading d9-recall_target \
  d10-environment d11-energy d12-absorption d12-absorption-selected \
  d13-flow_exit d14-session_target; do
  capture "$state"
done

capture "report" 1.8
capture "report-unknowns" 1.8

rm -f "$CURRENT"
echo "done: $OUT"
