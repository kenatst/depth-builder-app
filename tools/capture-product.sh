#!/bin/bash
# Captures Today / session states for a given device.
# Usage: capture-product.sh <device-name> <output-dir>
set -euo pipefail

DEVICE="${1:?device name}"
OUT="${2:?output dir}"
BUNDLE=com.kenatst.reboot
APP="/tmp/reboot-dd3/Build/Products/Debug-iphonesimulator/REBOOT.app"
STATE_DIR="$(cd "$(dirname "$0")/.." && pwd)/qa/state"

mkdir -p "$OUT"

capture_seed() {
  local seed="$1"
  xcrun simctl terminate "$DEVICE" "$BUNDLE" 2>/dev/null || true
  sleep 0.8
  xcrun simctl launch "$DEVICE" "$BUNDLE" \
    -qaState "$STATE_DIR/today.json" \
    -qaSeed "$seed" >/dev/null
  for attempt in 1 2 3 4 5; do
    sleep 1.5
    xcrun simctl io "$DEVICE" screenshot "$OUT/.tmp-$seed.png" >/dev/null 2>&1
    if python3 - "$OUT/.tmp-$seed.png" <<'PYEOF'
import sys
from PIL import Image
im = Image.open(sys.argv[1]).convert("RGB").resize((20, 44))
px = list(im.getdata())
white = sum(1 for (r,g,b) in px if r > 235 and g > 235 and b > 235) / len(px)
avg_r = sum(p[0] for p in px) / len(px)
avg_b = sum(p[2] for p in px) / len(px)
import sys as s
s.exit(0 if white < 0.7 and avg_r > 200 and avg_r >= avg_b else 1)
PYEOF
    then
      mv "$OUT/.tmp-$seed.png" "$OUT/$seed.png"
      echo "captured $seed @ $OUT"
      break
    fi
  done
  rm -f "$OUT/.tmp-$seed.png"
}

xcrun simctl install "$DEVICE" "$APP"
for seed in day1 stay recall rest running done; do
  capture_seed "$seed"
done
echo "done: $OUT"
