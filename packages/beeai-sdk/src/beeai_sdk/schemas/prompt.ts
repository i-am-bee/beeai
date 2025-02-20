/**
 * Copyright 2025 IBM Corp.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { z } from "zod";
import { inputSchema, outputSchema } from "./base.js";

export const promptInputSchema = inputSchema.extend({ prompt: z.string() });
export type PromptInput = z.input<typeof promptInputSchema>;

export const promptOutputSchema = outputSchema.extend({ text: z.string() });
export type PromptOutput = z.output<typeof promptOutputSchema>;
