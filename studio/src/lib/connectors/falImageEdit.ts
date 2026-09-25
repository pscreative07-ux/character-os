import { fal } from "@fal-ai/client";
import type {
  GenerateImageInput,
  GenerateImageResult,
  ImageGenerationConnector,
} from "./types";

// Default model verified against fal.ai's catalog at write time. Override via
// FAL_IMAGE_EDIT_MODEL if fal renames/replaces it or you prefer another
// identity-preserving image-edit model (e.g. a nano-banana or flux-kontext variant).
const DEFAULT_MODEL = "fal-ai/qwen-image-edit";
const DEFAULT_COST_USD = 0.06;

interface FalImageEditOutput {
  images?: Array<{ url: string }>;
}

export class FalImageEditConnector implements ImageGenerationConnector {
  private readonly model: string;
  private readonly costUsd: number;

  constructor() {
    const apiKey = process.env.FAL_KEY;
    if (!apiKey) {
      throw new Error("FAL_KEY is not set");
    }
    fal.config({ credentials: apiKey });
    this.model = process.env.FAL_IMAGE_EDIT_MODEL ?? DEFAULT_MODEL;
    this.costUsd = process.env.FAL_IMAGE_EDIT_COST_USD
      ? Number(process.env.FAL_IMAGE_EDIT_COST_USD)
      : DEFAULT_COST_USD;
  }

  async generate(input: GenerateImageInput): Promise<GenerateImageResult> {
    const result = await fal.subscribe(this.model, {
      input: {
        prompt: input.prompt,
        image_url: input.referenceImageDataUri,
      },
    });

    const output = result.data as FalImageEditOutput;
    const imageUrl = output.images?.[0]?.url;
    if (!imageUrl) {
      throw new Error(
        `fal.ai model "${this.model}" returned no image. Check FAL_IMAGE_EDIT_MODEL's input/output schema on fal.ai.`
      );
    }

    return {
      imageUrl,
      model: this.model,
      costUsd: this.costUsd,
    };
  }
}
