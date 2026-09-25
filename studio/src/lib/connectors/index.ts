import type { ImageGenerationConnector } from "./types";
import { FalImageEditConnector } from "./falImageEdit";
import { MockImageConnector } from "./mockConnector";

export type { GenerateImageInput, GenerateImageResult, ImageGenerationConnector } from "./types";

let cached: ImageGenerationConnector | null = null;

export function getImageConnector(): ImageGenerationConnector {
  if (cached) return cached;
  cached = process.env.FAL_KEY
    ? new FalImageEditConnector()
    : new MockImageConnector();
  return cached;
}
