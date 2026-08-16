import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
OUTPUT_DIR = Path(os.environ.get("LOCAL_STUDIO_OUTPUT_DIR", BASE_DIR / "outputs"))
UPLOAD_DIR = Path(os.environ.get("LOCAL_STUDIO_UPLOAD_DIR", BASE_DIR / "uploads"))
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

DEVICE = os.environ.get("LOCAL_STUDIO_DEVICE", "cuda")

# Image (text-to-image)
IMAGE_MODEL_ID = os.environ.get(
    "LOCAL_STUDIO_IMAGE_MODEL", "stabilityai/stable-diffusion-xl-base-1.0"
)

# Video: text-to-video (AnimateDiff needs a base SD1.5 checkpoint + motion adapter)
VIDEO_BASE_MODEL_ID = os.environ.get(
    "LOCAL_STUDIO_VIDEO_BASE_MODEL", "stable-diffusion-v1-5/stable-diffusion-v1-5"
)
VIDEO_MOTION_ADAPTER_ID = os.environ.get(
    "LOCAL_STUDIO_MOTION_ADAPTER", "guoyww/animatediff-motion-adapter-v1-5-2"
)

# Video: image-to-video
VIDEO_IMG2VID_MODEL_ID = os.environ.get(
    "LOCAL_STUDIO_IMG2VID_MODEL", "stabilityai/stable-video-diffusion-img2vid-xt"
)

HOST = os.environ.get("LOCAL_STUDIO_HOST", "127.0.0.1")
PORT = int(os.environ.get("LOCAL_STUDIO_PORT", "8000"))
