import { z } from "zod";

export const metadataSchema = z
  .object({
    title: z.string(),
    fullDescription: z.string(),
    framework: z.string(),
    licence: z.string(),
    avgRunTimeSeconds: z.number(),
    avgRunTokens: z.number(),
    tags: z.array(z.string()),
    ui: z.string(),
  })
  .partial()
  .passthrough();
export type Metadata = z.infer<typeof metadataSchema>;
