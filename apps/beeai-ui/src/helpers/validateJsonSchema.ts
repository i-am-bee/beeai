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

import { ExtendedJSONSchema } from 'json-schema-to-ts';

export type JSONSchema = Exclude<ExtendedJSONSchema, boolean>;

/**
 * Naive implementation of validating one json schema against another
 */
export function validateJsonSchema(schema: JSONSchema, targetSchema: JSONSchema): boolean {
  if (!schema.required || !targetSchema.required || !targetSchema.properties || !schema.properties) {
    return false;
  }

  const missingRequired = targetSchema.required.some((key: string) => !schema.required?.includes(key));
  if (missingRequired) return false;

  targetSchema.required?.forEach((key) => {
    const targetValue = targetSchema.properties?.[key];
    const value = schema.properties?.[key];

    if (!value || !targetValue || typeof targetValue === 'boolean' || typeof value === 'boolean') {
      return false;
    }

    if (targetValue.type === 'object') {
      if (!validateJsonSchema(targetValue, schema)) {
        return false;
      }
    } else {
      if (value.type !== targetValue.type) {
        return false;
      }
    }
  });

  return true;
}
