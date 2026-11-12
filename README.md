# Ruang Sipil — 3D render (GitHub Actions)

Render Three.js scenes to MP4 on GitHub's free runners (4 vCPU, 16 GB RAM)
because the VM that builds the videos has only ~1.5 CPU and ~600 MB free RAM.

## Layout

- `scenes/<name>/` — one Three.js scene per folder (`index.html`, `main.js`,
  `explode.js`, `vendor/` with the local three.js copy). A scene must set
  `window.__ready = true` when it is ready to record.
- `scripts/record.py`, `scripts/serve.py` — frame-exact recorder + static
  server, from [open-3d-skills](https://github.com/Moh4696/open-3d-skills)
  (MIT). Frames are piped straight into ffmpeg, so no PNG files pile up.
- `.github/workflows/render.yml` — the render workflow.
- `renders/` — rendered MP4s, committed back by the workflow so the VM can
  fetch them with plain curl (public repo, no auth needed).

## How to render

Push a scene change and the workflow renders it automatically with the
defaults (scene `dak`, 10s, 60fps, 720x1280):

```sh
# from the VM, via the GitHub connector snapshot push
```

Or trigger by hand in the repo's Actions tab (Run workflow) and pick the
scene, seconds, fps and size.

Fetch the result from the VM (no login needed):

```sh
./fetch-render.sh OWNER/REPO dak 10 ./out
```

That polls `renders/dak-10s.mp4` on the repo's main branch until it
appears, then downloads it.

## Rules

- ONLY render code in this repo. Never commit secrets, API keys, tokens,
  the hook library, skill files, or channel credentials.
- Artifacts are kept 7 days — the `renders/` copy is the durable one.
- No GPU here: WebGL renders on CPU (SwiftShader). Heavy scenes still
  belong on the Colab T4.
- Don't use this as a nonstop render farm; a couple of renders a day is
  the intended use.
