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

import { isStringTerminalParameterSafe } from './strings';

function convertInputToCliArgument(input: string) {
  try {
    const parsed = JSON.parse(input);
    return `'${JSON.stringify(parsed, null, 2)}'`;
  } catch {
    return `"${input}"`;
  }
}

export default {
  beeai: {
    run(name: string, input?: string) {
      return [
        'beeai run',
        isStringTerminalParameterSafe(name) ? name : `'${name}'`,
        input ? convertInputToCliArgument(input) : '',
      ]
        .filter(Boolean)
        .join(' ');
    },
  },
};
