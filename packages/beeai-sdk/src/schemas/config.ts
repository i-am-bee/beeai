import { z } from "zod";

export const configSchema = z.record(z.string());
export type Config = z.input<typeof configSchema>;
