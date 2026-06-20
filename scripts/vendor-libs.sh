#!/usr/bin/env bash
# Vendors Kingsreach's runtime dependencies into ./vendor so the game no longer
# depends on a CDN — making it fully self-contained and reliably offline.
#
# Run this on a machine WITH internet (the CDN must be reachable):
#     bash scripts/vendor-libs.sh
# then review `git diff` and commit ./vendor + index.html + sw.js.
#
# Idempotent: re-running re-downloads the files and leaves index.html/sw.js
# already-rewritten edits untouched.
set -euo pipefail

THREE_VER="0.169.0"
OT_VER="1.3.4"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

THREE_URL="https://cdn.jsdelivr.net/npm/three@${THREE_VER}/build/three.module.js"
JSM_URL="https://cdn.jsdelivr.net/npm/three@${THREE_VER}/examples/jsm/"
OT_URL="https://cdn.jsdelivr.net/npm/opentype.js@${OT_VER}/dist/opentype.min.js"

# Three's bloom dependency tree at this version (loaded lazily on the High tier).
# If a future Three version adds a dep, bloom degrades gracefully — the core
# game (which only needs three.module.js) keeps working.
ADDONS=(
  "postprocessing/EffectComposer.js"
  "postprocessing/RenderPass.js"
  "postprocessing/UnrealBloomPass.js"
  "postprocessing/OutputPass.js"
  "postprocessing/Pass.js"
  "postprocessing/ShaderPass.js"
  "postprocessing/MaskPass.js"
  "shaders/CopyShader.js"
  "shaders/LuminosityHighPassShader.js"
  "shaders/OutputShader.js"
)

echo "Vendoring three@${THREE_VER} + opentype.js@${OT_VER} into ./vendor ..."
mkdir -p vendor/three/addons/postprocessing vendor/three/addons/shaders

curl -fsSL "$THREE_URL" -o vendor/three/three.module.js && echo "  vendor/three/three.module.js"
curl -fsSL "$OT_URL"    -o vendor/opentype.min.js       && echo "  vendor/opentype.min.js"
for f in "${ADDONS[@]}"; do
  curl -fsSL "${JSM_URL}${f}" -o "vendor/three/addons/${f}" && echo "  vendor/three/addons/${f}"
done

echo "Rewriting index.html to load from ./vendor ..."
sed \
  -e "s|${OT_URL}|vendor/opentype.min.js|g" \
  -e "s|\"three\": \"${THREE_URL}\"|\"three\": \"./vendor/three/three.module.js\"|g" \
  -e "s|\"three/addons/\": \"${JSM_URL}\"|\"three/addons/\": \"./vendor/three/addons/\"|g" \
  -e "s|import \* as THREE from '${THREE_URL}';|import * as THREE from 'three';|g" \
  -e "s|const base='${JSM_URL}';|const base='three/addons/';|g" \
  index.html > index.html.tmp && mv index.html.tmp index.html

# Precache the always-loaded libs in the service worker (idempotent).
if ! grep -q "./vendor/three/three.module.js" sw.js; then
  echo "Adding vendored libs to the service-worker precache ..."
  awk 'BEGIN{q=sprintf("%c",39)}
       {print}
       /const SHELL = \[/{
         print "  " q "./vendor/opentype.min.js" q ",";
         print "  " q "./vendor/three/three.module.js" q ",";
       }' sw.js > sw.js.tmp && mv sw.js.tmp sw.js
fi

if grep -q "cdn.jsdelivr.net" index.html; then
  echo "WARNING: index.html still references cdn.jsdelivr.net — check it manually:" >&2
  grep -n "cdn.jsdelivr.net" index.html >&2 || true
else
  echo "OK: index.html no longer references any CDN."
fi

echo
echo "Done. Next:"
echo "  1. node scripts/check-syntax.mjs   # confirm the module still parses"
echo "  2. python3 serve.py                # play-test locally, then go offline and reload"
echo "  3. git add vendor index.html sw.js && git commit"
