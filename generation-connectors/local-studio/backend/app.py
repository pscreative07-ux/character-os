import uuid
from pathlib import Path

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from PIL import Image
from pydantic import BaseModel

from . import config
from .jobs import Job, manager
from .pipelines import image as image_pipeline
from .pipelines import video as video_pipeline

app = FastAPI(title="Character OS - Local Studio")
app.mount("/outputs", StaticFiles(directory=str(config.OUTPUT_DIR)), name="outputs")


class ImageRequest(BaseModel):
    prompt: str
    negative_prompt: str = ""
    steps: int = 30
    guidance_scale: float = 7.0
    width: int = 1024
    height: int = 1024
    seed: int | None = None


class VideoRequest(BaseModel):
    mode: str  # "text2vid" | "img2vid"
    prompt: str = ""
    negative_prompt: str = ""
    steps: int = 25
    guidance_scale: float = 7.5
    num_frames: int = 16
    fps: int = 8
    seed: int | None = None
    source_upload_id: str | None = None  # required for img2vid unless prompt given


def _job_view(job: Job) -> dict:
    view = {"id": job.id, "kind": job.kind, "status": job.status}
    if job.status == "done" and job.result_path:
        view["url"] = f"/outputs/{Path(job.result_path).name}"
    if job.status == "failed":
        view["error"] = job.error
    return view


@app.get("/")
def index():
    frontend_path = Path(__file__).resolve().parent.parent / "frontend" / "index.html"
    return FileResponse(frontend_path)


@app.post("/api/upload")
async def upload(file: UploadFile = File(...)):
    upload_id = uuid.uuid4().hex[:12]
    dest = config.UPLOAD_DIR / f"{upload_id}_{file.filename}"
    dest.write_bytes(await file.read())
    return {"upload_id": upload_id, "path": str(dest)}


def _resolve_upload_path(upload_id: str) -> Path:
    matches = list(config.UPLOAD_DIR.glob(f"{upload_id}_*"))
    if not matches:
        raise HTTPException(status_code=404, detail="upload not found")
    return matches[0]


@app.post("/api/generate/image")
def generate_image(req: ImageRequest):
    def work():
        img = image_pipeline.generate_image(
            prompt=req.prompt,
            negative_prompt=req.negative_prompt,
            steps=req.steps,
            guidance_scale=req.guidance_scale,
            width=req.width,
            height=req.height,
            seed=req.seed,
        )
        out_path = config.OUTPUT_DIR / f"{job.id}.png"
        img.save(out_path)
        return str(out_path)

    job = manager.submit("image", work)
    return _job_view(job)


@app.post("/api/generate/video")
def generate_video(req: VideoRequest):
    if req.mode not in ("text2vid", "img2vid"):
        raise HTTPException(status_code=400, detail="mode must be text2vid or img2vid")
    if req.mode == "img2vid" and not req.source_upload_id and not req.prompt:
        raise HTTPException(
            status_code=400,
            detail="img2vid requires either source_upload_id or a prompt to auto-generate a starting frame",
        )

    def work():
        out_path = config.OUTPUT_DIR / f"{job.id}.mp4"
        if req.mode == "text2vid":
            video_pipeline.generate_text2vid(
                prompt=req.prompt,
                output_path=str(out_path),
                negative_prompt=req.negative_prompt,
                steps=req.steps,
                guidance_scale=req.guidance_scale,
                num_frames=req.num_frames,
                fps=req.fps,
                seed=req.seed,
            )
        else:
            if req.source_upload_id:
                src = _resolve_upload_path(req.source_upload_id)
                start_image = Image.open(src)
            else:
                start_image = image_pipeline.generate_image(
                    prompt=req.prompt,
                    negative_prompt=req.negative_prompt,
                    seed=req.seed,
                )
            video_pipeline.generate_img2vid(
                image=start_image,
                output_path=str(out_path),
                num_frames=req.num_frames or 25,
                fps=req.fps or 7,
                seed=req.seed,
            )
        return str(out_path)

    job = manager.submit("video", work)
    return _job_view(job)


@app.get("/api/jobs/{job_id}")
def get_job(job_id: str):
    job = manager.get(job_id)
    if job is None:
        raise HTTPException(status_code=404, detail="job not found")
    return _job_view(job)
