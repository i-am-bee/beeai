import { z } from "zod";

export const configSchema = z.object({ tools: z.array(z.string()).optional() });
export type Config = z.input<typeof configSchema>;

export const inputSchema = z.object({ config: configSchema.optional() });
export type Input = z.input<typeof configSchema>;

export const outputSchema = z.object({}).passthrough();
export type Output = z.input<typeof configSchema>;
