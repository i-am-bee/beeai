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

export const logLevelSchema = z.enum([
  "error",
  "warning",
  "info",
  "cite",
  "success",
]);
export type LogLevel = z.input<typeof logLevelSchema>;

export const logSchema = z
  .object({ level: logLevelSchema.default("info"), message: z.string() })
  .passthrough()
  .nullable();
export type Log = z.input<typeof logSchema>;

export const configSchema = z.object({}).passthrough();
export type Config = z.input<typeof configSchema>;

export const inputSchema = z.object({ config: configSchema.optional() });
export type Input = z.input<typeof configSchema>;

export const outputSchema = z
  .object({ logs: z.array(logSchema).default([]) })
  .passthrough();
export type Output = z.input<typeof configSchema>;
