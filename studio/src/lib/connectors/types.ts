// Pluggable identity-preserving image generation connector.
// Any backend (fal.ai, Replicate, a direct provider API, ...) implements this
// same contract, so swapping the generative backend never touches the rest
// of the app — mirrors Character OS's "adapter behind a neutral interface"
// pattern for generation-connectors.
export interface GenerateImageInput {
  /** Base64 data URI of the character's reference image. */
  referenceImageDataUri: string;
  /** Fully composed edit prompt (base identity + selected modifiers). */
  prompt: string;
}

export interface GenerateImageResult {
  /** URL (remote or data URI) of the generated image. */
  imageUrl: string;
  /** Identifier of the model/provider actually used, for display + auditing. */
  model: string;
  /** Estimated cost in USD for this single generation. */
  costUsd: number;
}

export interface ImageGenerationConnector {
  generate(input: GenerateImageInput): Promise<GenerateImageResult>;
}
