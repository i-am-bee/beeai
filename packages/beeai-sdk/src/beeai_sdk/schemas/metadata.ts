import { z } from "zod";

export const metadataSchema = z
  .object({ tags: z.array(z.string()) })
  .partial()
  .passthrough();
export type Metadata = z.infer<typeof metadataSchema>;
