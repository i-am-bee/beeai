import { z } from "zod";

export const messageSchema = z.union([
  z.object({ role: z.literal("user"), content: z.string() }),
  z.object({ role: z.literal("assistant"), content: z.string() }),
]);

export const messageInputSchema = z.object({
  messages: z.array(messageSchema),
});
export type MessageInput = z.input<typeof messageInputSchema>;

export const messageOutputSchema = z.object({
  messages: z.array(messageSchema),
});
export type MessageOutput = z.output<typeof messageOutputSchema>;
