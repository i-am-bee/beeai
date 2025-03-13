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

export function TracesTooltip() {
  return (
    <>
      <strong>Phoenix Server Unavailable 🚨</strong>
      <br />
      <br />
      It looks like the Phoenix server is not running or cannot be reached.
      <br />
      <br />
      To enable traceability and ensure everything works smoothly, please check your Phoenix setup by following the
      instructions in the official documentation:
      <br />
      🔗{' '}
      <a href="https://docs.beeai.dev/observability/agents-traceability" target={'_blank'}>
        Set up Phoenix Server
      </a>
    </>
  );
}
