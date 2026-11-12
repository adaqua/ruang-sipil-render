# Dak beton — RuangSipil 3D test scene

Template for the channel's deterministic 3D style (SMECO visual language +
CADAnimation CAD look + open-3d-skills exploded-view). All geometry is built
from code in `main.js`; no model files. Next topics (pondasi/kolom/balok/atap)
copy this folder and replace the parts in `main.js` — the choreography,
labels, section, camera and recording hooks stay the same.

## Files
- `index.html` — import map (local three.js r169 in `vendor/`), canvas + labels overlay
- `main.js` — scene, parts, choreography (`applyState(t)`, 30 s timeline)
- `explode.js` — Exploder / Labels / Section from the exploded-view skill
- `vendor/` — three.module.js + examples/jsm (local copy; the VM's Playwright
  Chromium cannot reach the CDN through the proxy, so local files are required)
- `dak-test-10s.mp4` — rendered test (720x1280, 60 fps, 10 s, silent, no watermark)
- `dak-test-30s.mp4` — extended 30 s version (same scene, explode + reverse
  explode with green solution glow and DAK AMAN label); full render runs on
  GitHub Actions, not locally
- `render.json` — render settings for GitHub Actions auto-render on push
  (`{"seconds": 30, "fps": 60, "size": "720x1280"}`); without it the workflow
  defaults to 10 s / 60 fps / 720x1280

## Re-record
```bash
# from ~/workspace/3d-scenes
python3 ~/workspace/3d-skills/skills/frame-capture/scripts/serve.py . --port 8000
python3 ~/workspace/3d-skills/skills/frame-capture/scripts/record.py \
  "http://127.0.0.1:8000/dak/?record=1" dak-test-30s.mp4 \
  --seconds 30 --fps 60 --size 720x1280 --ready "window.__ready === true"
```
Timing pass first: `--fps 8` (240 frames, ~4 min on this VM). Full 60 fps
render takes ~25 min locally (SwiftShader software rendering, ~0.85 s/frame)
— prefer GitHub Actions (adaqua/ruang-sipil-render, ~5 min total for 10 s).
1080x1920 will be ~2.25x slower — budget ~20 min, or render on a machine
with a GPU.

## Timeline (30 s)
- 0–4 s: assembled slab, ponding water, slow dolly-in, DAK BETON label
- 4–12 s: staged explode (membrane lifts, rebar separates up/down, slab goes
  ghostly/X-ray, crack glows red, blue water flows to the drain), labels
  appear one by one following their stage
- 12–20 s: hold fully exploded, all 6 labels visible
- 20–26 s: reverse explode, membrane returns with a green glow (solution),
  DAK AMAN label fades in, clean water flows over the top to the drain
- 26–30 s: hold assembled, DAK AMAN label

## Known limitations (from the test)
- The 1.5% slope is visually imperceptible (0.86°); it is carried by the
  "KEMIRINGAN 1-2%" label, the blue slope arrows and the water flow.
- Concrete reads pale on the cut faces under the bright key light.
- Top ~25% and bottom ~20% of the frame are empty grid (fine for Shorts UI
  safe areas, but the frame could be tightened).
- Bottom rebar floats below the slab in the hold — normal for an exploded view.
