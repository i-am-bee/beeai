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
import { parse } from 'yaml';

import { DOCKER_MANIFEST_LABEL_NAME, DOCKER_REGISTRY } from '@/constants';

type TokenJson = { token: string };
type ManifestJson = { config: { digest: string } };
type ManifestListJson = { manifests: { digest: string }[] };
type ConfigJson = { config: { Labels: { [key: string]: string } } };

export async function fetchAgentMetadata({ repository, tag }: { repository: string; tag: string }): Promise<Metadata> {
  const token = await fetchAuthToken({ repository });

  const headers = {
    Accept: ACCEPT_HEADERS.join(','),
    Authorization: `Bearer ${token}`,
  };

  const manifest = await fetchManifest({ repository, tag, headers });
  const config = await fetchConfig({ repository, digest: manifest.config.digest, headers });

  const label = config.config.Labels?.[DOCKER_MANIFEST_LABEL_NAME];

  if (!label) {
    throw new Error(`The required label for the Docker image is missing: "${DOCKER_MANIFEST_LABEL_NAME}"`);
  }

  return decodeBase64Yaml<Metadata>(label);
}

const ACCEPT_HEADERS = [
  'application/vnd.oci.image.index.v1+json',
  'application/vnd.oci.image.manifest.v1+json',
  'application/vnd.docker.distribution.manifest.list.v2+json',
  'application/vnd.docker.distribution.manifest.v2+json',
];

async function ensureResponse<T>({ response, errorContext }: { response: Response; errorContext: string }) {
  if (!response.ok) {
    throw new Error(`Failed to fetch ${errorContext}: ${response.status}, ${await response.text()}`);
  }

  return response.json() as T;
}

function isManifestList(manifest: ManifestJson | ManifestListJson): manifest is ManifestListJson {
  return 'manifests' in manifest;
}

async function fetchAuthToken({ repository }: { repository: string }): Promise<string> {
  const url = `${DOCKER_REGISTRY}/token?service=ghcr.io&scope=repository:${repository}:pull`;
  const response = await fetch(url);
  const { token } = await ensureResponse<TokenJson>({
    response,
    errorContext: 'ghcr.io authentication token',
  });

  return token;
}

async function fetchManifest({
  repository,
  tag,
  headers,
}: {
  repository: string;
  tag: string;
  headers: HeadersInit;
}): Promise<ManifestJson> {
  const url = `${DOCKER_REGISTRY}/v2/${repository}/manifests`;
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

    manifest = await fetchManifest({ repository, tag: firstManifest.digest, headers });
  }

  return manifest;
}

async function fetchConfig({
  repository,
  digest,
  headers,
}: {
  repository: string;
  digest: string;
  headers: HeadersInit;
}): Promise<ConfigJson> {
  const url = `${DOCKER_REGISTRY}/v2/${repository}/blobs`;
  const response = await fetch(`${url}/${digest}`, { headers });
  const config = await ensureResponse<ConfigJson>({
    response,
    errorContext: 'config',
  });

  return config;
}

function decodeBase64Yaml<T>(base64: string): T {
  return parse(Buffer.from(base64, 'base64').toString('utf-8')) as T;
}
