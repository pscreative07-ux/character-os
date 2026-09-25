import type {
  GenerateImageInput,
  GenerateImageResult,
  ImageGenerationConnector,
} from "./types";

// Used whenever FAL_KEY is not configured, so the whole app (character
// creation, modifier picking, gallery, cost tracking) is fully clickable and
// demoable before you wire up real credentials. Echoes the reference image
// back unchanged, at zero cost, clearly labelled as a mock result.
export class MockImageConnector implements ImageGenerationConnector {
  async generate(input: GenerateImageInput): Promise<GenerateImageResult> {
    return {
      imageUrl: input.referenceImageDataUri,
      model: "mock",
      costUsd: 0,
    };
  }
}
