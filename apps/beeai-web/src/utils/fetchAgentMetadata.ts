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

import type { Metadata } from '@i-am-bee/beeai-sdk/schemas/metadata';

import { DOCKER_MANIFEST_LABEL_NAME, SupportedDockerRegistries } from '@/constants';

import { decodeBase64Yaml } from './decodeBase64Yaml';
import { ensureResponse } from './ensureResponse';
import { parseDockerImageId } from './parseDockerImageId';

type TokenJson = { token: string };
type ManifestJson = { config: { digest: string } };
type ManifestListJson = { manifests: { digest: string }[] };
type ConfigJson = { config: { Labels: { [key: string]: string } } };

export async function fetchAgentMetadata({ dockerImageId }: { dockerImageId: string }): Promise<Metadata> {
  const { registry, repository, tag } = parseDockerImageId(dockerImageId);

  assertSupportedRegistry(registry);

  const headers = await fetchAuthHeaders({ registry, repository });
  const {
    config: { digest },
  } = await fetchManifest({ registry, repository, tag, headers });
  const {
    config: { Labels },
  } = await fetchConfig({ registry, repository, digest, headers });
  const label = ensureLabel(Labels);

  return decodeBase64Yaml<Metadata>(label);
}

const ACCEPT_HEADERS = [
  'application/vnd.oci.image.index.v1+json',
  'application/vnd.oci.image.manifest.v1+json',
  'application/vnd.docker.distribution.manifest.list.v2+json',
  'application/vnd.docker.distribution.manifest.v2+json',
];

function assertSupportedRegistry(registry: string) {
  if (!SupportedDockerRegistries.includes(registry)) {
    throw new Error(`Docker registry "${registry}" is not supported.`);
  }
}

function isManifestList(manifest: ManifestJson | ManifestListJson): manifest is ManifestListJson {
  return 'manifests' in manifest;
}

async function fetchAuthHeaders({
  registry,
  repository,
}: {
  registry: string;
  repository: string;
}): Promise<HeadersInit> {
  const url = `https://${registry}/token?service=ghcr.io&scope=repository:${repository}:pull`;
  const response = await fetch(url);
  const { token } = await ensureResponse<TokenJson>({
    response,
    errorContext: 'ghcr.io authentication token',
  });
  const headers = {
    Accept: ACCEPT_HEADERS.join(','),
    Authorization: `Bearer ${token}`,
  };

  return headers;
}

async function fetchManifest({
  registry,
  repository,
  tag,
  headers,
}: {
  registry: string;
  repository: string;
  tag: string;
  headers: HeadersInit;
}): Promise<ManifestJson> {
  const url = `https://${registry}/v2/${repository}/manifests`;
  const response = await fetch(`${url}/${tag}`, { headers });
  let manifest = await ensureResponse<ManifestJson | ManifestListJson>({
    response,
    errorContext: 'manifest',
  });

  if (isManifestList(manifest)) {
    const firstManifest = manifest.manifests.at(0);

    if (!firstManifest) {
      throw new Error('No manifests found in manifest list.');
    }

    manifest = await fetchManifest({ registry, repository, tag: firstManifest.digest, headers });
  }

  return manifest;
}

async function fetchConfig({
  registry,
  repository,
  digest,
  headers,
}: {
  registry: string;
  repository: string;
  digest: string;
  headers: HeadersInit;
}): Promise<ConfigJson> {
  const url = `https://${registry}/v2/${repository}/blobs`;
  const response = await fetch(`${url}/${digest}`, { headers });
  const config = await ensureResponse<ConfigJson>({
    response,
    errorContext: 'config',
  });

  return config;
}

function ensureLabel(Labels: ConfigJson['config']['Labels']) {
  const label = Labels?.[DOCKER_MANIFEST_LABEL_NAME];

  if (!label) {
    throw new Error(`The required label for the Docker image is missing: "${DOCKER_MANIFEST_LABEL_NAME}"`);
  }

  return label;
}
