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

export const metadataSchema = z
  .object({
    fullDescription: z.string(),
    framework: z.string(),
    license: z.string(),
    languages: z.array(z.string()),
    githubUrl: z.string(),
    examples: z
      .object({
        cli: z
          .array(
            z
              .object({
                command: z.string(),
                name: z.string().optional(),
                description: z.string().optional(),
                output: z.string().optional(),
                processingSteps: z.array(z.string()).optional(),
              })
              .passthrough(),
          )
          .optional(),
      })
      .passthrough(),
    avgRunTimeSeconds: z.number(),
    avgRunTokens: z.number(),
    tags: z.array(z.string()),
    ui: z
      .object({
        type: z.enum(["chat", "hands-off", "custom"]),
        userGreeting: z.string().optional(),
      })
      .passthrough(),
    provider: z.string(),
  })
  .partial()
  .passthrough();
export type Metadata = z.infer<typeof metadataSchema>;
