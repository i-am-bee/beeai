import { z } from "zod";

export const promptInputSchema = z.object({ prompt: z.string() });
export type PromptInput = z.input<typeof promptInputSchema>;

export const promptOutputSchema = z.object({ text: z.string() });
export type PromptOutput = z.output<typeof promptOutputSchema>;
