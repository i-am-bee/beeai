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

const pattern = new RegExp(
  [
    // Registry (optional) - ends with slash and contains at least one dot
    '((?<registry>[^/]+\\.[^/]+)/)?',

    // Repository (required) - final component before any tag
    '(?<repository>[^:]+)',

    // Tag (optional) - everything after the colon
    '(?::(?<tag>[^:]+))?',
  ].join(''),
);

type ParsedDockerImageId = {
  registry: string;
  repository: string;
  tag: string;
};

export function parseDockerImageId(dockerImageId: string): ParsedDockerImageId {
  const match = pattern.exec(dockerImageId);

  if (!match?.groups) {
    throw new Error(`Invalid Docker image: ${dockerImageId}`);
  }

  const { registry = 'ghcr.io', repository, tag = 'latest' } = match.groups;

  return {
    registry,
    repository,
    tag,
  };
}
