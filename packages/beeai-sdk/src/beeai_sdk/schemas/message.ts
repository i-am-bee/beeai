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

import {z} from "zod";
import {textInputSchema, textOutputSchema} from "./base.js";

export const messageSchema = z.union([
  z.object({role: z.literal("user"), content: z.string()}),
  z.object({role: z.literal("assistant"), content: z.string()}),
]);

export type Message = z.input<typeof messageSchema>

export const messageInputSchema = textInputSchema.extend({
  messages: z.array(messageSchema).default([])
})
  .refine(data => {
    const hasMessages = data.messages.length > 0;
    const hasText = !!data.text;
    return (hasMessages && !hasText) || (!hasMessages && hasText);
  }, {
    message: "Must specify exactly one of messages and text"
  })
  .transform(data => {
    if (data.messages.length === 0) {
      return {
        ...data,
        messages: [messageSchema.parse({content: data.text, role: "user"})]
      };
    }
    return data;
  });

export type MessageInput = z.input<typeof messageInputSchema>;

export const messageOutputSchema = textOutputSchema.merge(z.object({
  messages: z.array(messageSchema),
  text: z.string().transform(() => "")
})).transform(data => {
  return {
    ...data,
    text: JSON.stringify(data.messages.map(m => ({role: m.role, content: m.content})))
  };
});
export type MessageOutput = z.input<typeof messageOutputSchema>;
