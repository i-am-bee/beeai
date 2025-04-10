/**
 * Copyright 2025 © BeeAI a Series of LF Projects, LLC
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

import { TRACEABILITY_LINK } from '#utils/constants.ts';

export function TracesTooltip() {
  return (
    <>
      <strong>Traceability Not Configured</strong>
      <br />
      <br />
      The traceability service isn't currently set up or reachable. To enable it, please check your configuration or
      follow the steps in our{' '}
      <a href={TRACEABILITY_LINK} target="_blank" rel="noreferrer">
        setup guide
      </a>
      .
    </>
  );
}
