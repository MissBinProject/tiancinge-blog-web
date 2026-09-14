#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
REFERENCE_DIR="$ROOT_DIR/03_UI設計圖/01_首頁設計圖"
BASELINE_DIR="$ROOT_DIR/02_規劃書/project/visual-baseline"

command -v ffmpeg >/dev/null 2>&1 || {
  echo "ffmpeg is required to generate visual overlays" >&2
  exit 1
}

for index in 01 02 03 04 05; do
  reference="$REFERENCE_DIR/首頁_${index}.png"
  current="$BASELINE_DIR/current-${index}.png"
  overlay="$BASELINE_DIR/overlay-${index}.png"
  difference="$BASELINE_DIR/difference-${index}.png"

  if [[ ! -f "$reference" || ! -f "$current" ]]; then
    echo "Missing reference or current screenshot for ${index}" >&2
    exit 1
  fi

  ffmpeg -hide_banner -loglevel error -y \
    -i "$reference" -i "$current" \
    -filter_complex "[0:v][1:v]blend=all_expr='A*0.5+B*0.5'" \
    -frames:v 1 "$overlay"
  ffmpeg -hide_banner -loglevel error -y \
    -i "$reference" -i "$current" \
    -filter_complex "[0:v][1:v]blend=all_mode=difference" \
    -frames:v 1 "$difference"
done

echo "Visual overlays and difference images written to $BASELINE_DIR"
