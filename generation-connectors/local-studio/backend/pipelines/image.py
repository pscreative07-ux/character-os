"""Local text-to-image generation via diffusers. Runs entirely on-device,
no network calls at inference time, no hosted content filter."""

import threading

import torch
from diffusers import AutoPipelineForText2Image

from .. import config

_pipe = None
_lock = threading.Lock()


def get_pipeline():
    global _pipe
    if _pipe is None:
        with _lock:
            if _pipe is None:
                pipe = AutoPipelineForText2Image.from_pretrained(
                    config.IMAGE_MODEL_ID,
                    torch_dtype=torch.float16,
                    use_safetensors=True,
                )
                # Open-weight local pipelines: no hosted moderation layer.
                # Disable the bundled NSFW checker if the pipeline has one
                # (SD1.x/2.x do; SDXL does not ship one at all).
                if hasattr(pipe, "safety_checker"):
                    pipe.safety_checker = None
                pipe.to(config.DEVICE)
                pipe.enable_attention_slicing()
                _pipe = pipe
    return _pipe


def generate_image(
    prompt: str,
    negative_prompt: str = "",
    steps: int = 30,
    guidance_scale: float = 7.0,
    width: int = 1024,
    height: int = 1024,
    seed: int | None = None,
):
    pipe = get_pipeline()
    generator = None
    if seed is not None:
        generator = torch.Generator(device=config.DEVICE).manual_seed(seed)

    result = pipe(
        prompt=prompt,
        negative_prompt=negative_prompt or None,
        num_inference_steps=steps,
        guidance_scale=guidance_scale,
        width=width,
        height=height,
        generator=generator,
    )
    return result.images[0]
