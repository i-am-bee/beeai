import { z } from "zod";

export const configSchema = z
  .object({ tools: z.array(z.string()).optional() })
  .passthrough();
export type Config = z.input<typeof configSchema>;
