#!/bin/sh
# Fetch a rendered MP4 from the repo's renders/ folder (public repo, no auth).
# Usage: ./fetch-render.sh OWNER/REPO SCENE SECONDS [OUTDIR] [BRANCH]
#   Example: ./fetch-render.sh adaqua/ruang-sipil-render dak 10 ./out
# Polls until renders/<scene>-<seconds>s.mp4 appears (max ~40 min).
set -e

REPO="$1"
SCENE="$2"
SECONDS="$3"
OUTDIR="${4:-.}"
BRANCH="${5:-main}"

if [ -z "$REPO" ] || [ -z "$SCENE" ] || [ -z "$SECONDS" ]; then
  echo "Usage: $0 OWNER/REPO SCENE SECONDS [OUTDIR] [BRANCH]"
  exit 2
fi

URL="https://raw.githubusercontent.com/${REPO}/${BRANCH}/renders/${SCENE}-${SECONDS}s.mp4"
echo "Waiting for $URL ..."
for i in $(seq 1 80); do
  CODE=$(curl -s -o /dev/null -w "%{http_code}" -L "$URL" || echo "000")
  echo "  check $i: HTTP $CODE"
  if [ "$CODE" = "200" ]; then
    mkdir -p "$OUTDIR"
    curl -s -L "$URL" -o "$OUTDIR/${SCENE}-${SECONDS}s.mp4"
    ls -la "$OUTDIR/${SCENE}-${SECONDS}s.mp4"
    ffprobe -v error -show_entries format=duration -of csv=p=0 \
      "$OUTDIR/${SCENE}-${SECONDS}s.mp4"
    exit 0
  fi
  sleep 30
done
echo "Timed out waiting for $URL"
exit 1
