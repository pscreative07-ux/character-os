"""Local video generation via diffusers. Two modes, both fully on-device:

- text2vid: AnimateDiff (SD1.5 base + motion adapter)
- img2vid: Stable Video Diffusion, animates a still image
"""

import threading

import torch
from diffusers import AnimateDiffPipeline, DDIMScheduler, MotionAdapter, StableVideoDiffusionPipeline
from diffusers.utils import export_to_video
from PIL import Image

from .. import config

_text2vid_pipe = None
_img2vid_pipe = None
_lock = threading.Lock()


def get_text2vid_pipeline():
    global _text2vid_pipe
    if _text2vid_pipe is None:
        with _lock:
            if _text2vid_pipe is None:
                adapter = MotionAdapter.from_pretrained(
                    config.VIDEO_MOTION_ADAPTER_ID, torch_dtype=torch.float16
                )
                pipe = AnimateDiffPipeline.from_pretrained(
                    config.VIDEO_BASE_MODEL_ID,
                    motion_adapter=adapter,
                    torch_dtype=torch.float16,
                )
                pipe.scheduler = DDIMScheduler.from_pretrained(
                    config.VIDEO_BASE_MODEL_ID,
                    subfolder="scheduler",
                    clip_sample=False,
                    timestep_spacing="linspace",
                    beta_schedule="linear",
                )
                if hasattr(pipe, "safety_checker"):
                    pipe.safety_checker = None
                pipe.enable_vae_slicing()
                pipe.enable_model_cpu_offload()
                _text2vid_pipe = pipe
    return _text2vid_pipe


def get_img2vid_pipeline():
    global _img2vid_pipe
    if _img2vid_pipe is None:
        with _lock:
            if _img2vid_pipe is None:
                pipe = StableVideoDiffusionPipeline.from_pretrained(
                    config.VIDEO_IMG2VID_MODEL_ID,
                    torch_dtype=torch.float16,
                    variant="fp16",
                )
                pipe.enable_model_cpu_offload()
                _img2vid_pipe = pipe
    return _img2vid_pipe


def generate_text2vid(
    prompt: str,
    output_path: str,
    negative_prompt: str = "",
    steps: int = 25,
    guidance_scale: float = 7.5,
    num_frames: int = 16,
    fps: int = 8,
    seed: int | None = None,
):
    pipe = get_text2vid_pipeline()
    generator = None
    if seed is not None:
        generator = torch.Generator(device="cpu").manual_seed(seed)

    result = pipe(
        prompt=prompt,
        negative_prompt=negative_prompt or None,
        num_inference_steps=steps,
        guidance_scale=guidance_scale,
        num_frames=num_frames,
        generator=generator,
    )
    export_to_video(result.frames[0], output_path, fps=fps)
    return output_path


def generate_img2vid(
    image: Image.Image,
    output_path: str,
    num_frames: int = 25,
    fps: int = 7,
    motion_bucket_id: int = 127,
    noise_aug_strength: float = 0.02,
    seed: int | None = None,
):
    pipe = get_img2vid_pipeline()
    image = image.convert("RGB").resize((1024, 576))
    generator = None
    if seed is not None:
        generator = torch.Generator(device="cpu").manual_seed(seed)

    frames = pipe(
        image,
        num_frames=num_frames,
        motion_bucket_id=motion_bucket_id,
        noise_aug_strength=noise_aug_strength,
        generator=generator,
    ).frames[0]
    export_to_video(frames, output_path, fps=fps)
    return output_path
