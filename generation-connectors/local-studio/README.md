# Local Studio

A self-hosted image/video generation connector for Character OS. Every
model runs on your own GPU via [diffusers](https://github.com/huggingface/diffusers) —
there is no cloud API call at inference time, and no hosted content-policy
layer sitting between your prompt and the model. You control moderation
(or the lack of it) yourself, same as running Automatic1111/ComfyUI locally.

Model weights are downloaded from Hugging Face on first use and cached
locally (`~/.cache/huggingface`) — after that, generation is fully offline.

**Responsible use:** these are open-weight models running under your own
control. That doesn't change the law — no CSAM, no non-consensual sexual
content of real people, no using someone's likeness without consent. You
are responsible for what you generate and how you use it.

## What's included

- **Image**: text-to-image via SDXL (`stabilityai/stable-diffusion-xl-base-1.0`
  by default — swap via `LOCAL_STUDIO_IMAGE_MODEL`).
- **Video — text2vid**: [AnimateDiff](https://github.com/guoyww/AnimateDiff)
  (SD1.5 base + motion adapter).
- **Video — img2vid**: [Stable Video Diffusion](https://huggingface.co/stabilityai/stable-video-diffusion-img2vid-xt),
  animates a still image (upload one, or let it auto-generate a starting
  frame from a prompt).

A FastAPI backend runs a single-worker job queue (GPU work is sequential
anyway) and a minimal one-page frontend for submitting prompts and
watching jobs complete.

## Requirements

- NVIDIA GPU with 8GB+ VRAM (fp16 + CPU offload keeps SDXL/SVD/AnimateDiff
  within that budget, but 8GB is the floor, not a comfortable margin — if
  you hit CUDA out-of-memory errors, lower image `width`/`height` or
  `num_frames`, or switch `LOCAL_STUDIO_IMAGE_MODEL` to a SD1.5 checkpoint).
- **~25GB free disk space**, on top of whatever the venv + CUDA build of
  torch takes (another ~5-6GB): SDXL (~7GB) + SD1.5 for AnimateDiff (~4GB)
  + motion adapter (~2GB) + Stable Video Diffusion (~10GB), all cached
  under `~/.cache/huggingface` (`%USERPROFILE%\.cache\huggingface` on
  Windows). Check free space before the first run — a mid-download
  failure from a full disk leaves a partial, unusable cache entry.
- Python 3.10+
- A CUDA build of PyTorch matching your driver (see
  https://pytorch.org/get-started/locally/) — installed separately from
  `requirements.txt` because the right wheel depends on your CUDA version:

  ```bash
  pip install torch --index-url https://download.pytorch.org/whl/cu121
  ```

## Run it

**Linux / macOS:**

```bash
cd generation-connectors/local-studio
pip install torch --index-url https://download.pytorch.org/whl/cu121  # once, see Requirements
./run.sh
```

**Windows (PowerShell):**

```powershell
cd generation-connectors\local-studio
pip install torch --index-url https://download.pytorch.org/whl/cu121  # once, see Requirements
.\run.ps1
```

If `run.ps1` is blocked from running, allow local scripts for the current
session first: `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass`.

Either script creates a venv, installs the rest of the dependencies, and
starts the server at `http://127.0.0.1:8000`. Open that URL for the UI.

First run will download several GB of model weights per pipeline the
first time it's used — expect the first generation of each type to be
slow.

## Configuration

All via environment variables, see `backend/config.py`:

| Variable | Default | Purpose |
|---|---|---|
| `LOCAL_STUDIO_IMAGE_MODEL` | `stabilityai/stable-diffusion-xl-base-1.0` | text-to-image checkpoint |
| `LOCAL_STUDIO_VIDEO_BASE_MODEL` | `stable-diffusion-v1-5/stable-diffusion-v1-5` | AnimateDiff base checkpoint |
| `LOCAL_STUDIO_MOTION_ADAPTER` | `guoyww/animatediff-motion-adapter-v1-5-2` | AnimateDiff motion module |
| `LOCAL_STUDIO_IMG2VID_MODEL` | `stabilityai/stable-video-diffusion-img2vid-xt` | image-to-video checkpoint |
| `LOCAL_STUDIO_OUTPUT_DIR` | `./outputs` | generated files |
| `LOCAL_STUDIO_UPLOAD_DIR` | `./uploads` | uploaded starting images |
| `LOCAL_STUDIO_HOST` / `LOCAL_STUDIO_PORT` | `127.0.0.1` / `8000` | server bind address |

## API

- `POST /api/generate/image` — `{prompt, negative_prompt, steps, guidance_scale, width, height, seed}` → `{id, status}`
- `POST /api/generate/video` — `{mode: "text2vid"|"img2vid", prompt, negative_prompt, steps, guidance_scale, num_frames, fps, seed, source_upload_id}` → `{id, status}`
- `POST /api/upload` — multipart file upload, returns `{upload_id}` for use as `source_upload_id`
- `GET /api/jobs/{id}` — `{id, status, url?, error?}`

Any other tool in Character OS (kernel, SDK) can call this connector the
same way the frontend does — it's a plain local HTTP API, no different
from an adapter to a hosted backend, just pointed at `localhost` instead.

## Swapping models

Any diffusers-compatible checkpoint works — point the relevant env var at
a different Hugging Face repo id (or a local path). Community fine-tunes
(realistic, anime, etc.) are commonly published as SDXL/SD1.5-compatible
checkpoints and drop in without code changes.
