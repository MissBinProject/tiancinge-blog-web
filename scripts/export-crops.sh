#!/usr/bin/env bash
set -euo pipefail

# Rebuild non-destructive card crops from the supplied design screenshots.
# The source screenshots are never modified.

project_root="$(cd "$(dirname "$0")/.." && pwd)"
source_dir="$project_root/03_UI設計圖/01_首頁設計圖"
target_dir="$project_root/apps/web/public/assets/crops"
mkdir -p "$target_dir"

crop() {
  local source="$1" y="$2" x="$3" height="$4" width="$5" target="$6"
  sips --cropToHeightWidth "$height" "$width" --cropOffset "$y" "$x" "$source" --out "$target_dir/$target" >/dev/null
}

source="$source_dir/首頁_01.png"
crop "$source" 620 88 125 285 service-1.png
crop "$source" 620 392 125 285 service-2.png
crop "$source" 620 696 125 285 service-3.png
crop "$source" 620 1000 125 285 service-4.png
crop "$source" 620 1304 125 285 service-5.png

source="$source_dir/首頁_03.png"
crop "$source" 270 300 175 410 news-1.png
crop "$source" 270 730 175 410 news-2.png
crop "$source" 270 1175 175 410 news-3.png

source="$source_dir/首頁_04.png"
crop "$source" 275 288 180 320 blog-1.png
crop "$source" 275 620 180 320 blog-2.png
crop "$source" 275 955 180 320 blog-3.png
crop "$source" 275 1290 180 320 blog-4.png

echo "Card crops exported to $target_dir"
