# Copyright 2025 IBM Corp.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

import logging
import pathlib
import re
import shutil
from collections import defaultdict
from enum import StrEnum
from os import PathLike
from backports.tarfile import ExtractError
from typing import Any

import anyio
import anyio.to_thread
import backports.tarfile as tarfile
import httpx
from anyio import Path
from pydantic import model_validator, AnyUrl, ModelWrapValidatorHandler, RootModel

logger = logging.getLogger(__name__)


class GithubVersionType(StrEnum):
    head = "head"
    tag = "tag"


class GithubUrl(RootModel):
    root: str

    _org: str
    _repo: str
    _version: str | None = None
    _version_type: GithubVersionType = GithubVersionType.head
    _path: str | None = None

    @property
    def org(self) -> str:
        return self._org

    @property
    def repo(self) -> str:
        return self._repo

    @property
    def version(self) -> str | None:
        return self._version

    @property
    def path(self) -> str | None:
        return self._path

    @path.setter
    def path(self, value: str):
        self._path = value
        self.root = str(self)

    @model_validator(mode="wrap")
    @classmethod
    def _parse(cls, data: Any, handler: ModelWrapValidatorHandler):
        url: GithubUrl = handler(data)

        pattern = r"""
            ^
            (?:git\+)?                            # Optional git+ prefix
            https?://github\.com/                 # GitHub URL prefix
            (?P<org>[^/]+)/                       # Organization
            (?P<repo>
                (?:                               # Non-capturing group for repo name
                    (?!\.git(?:$|[@#]))           # Negative lookahead for .git at end or followed by @#
                    [^/@#]                        # Any char except /@#
                )+                                # One or more of these chars
            )
            (?:\.git)?                            # Optional .git suffix
            (?:@(?P<version>[^#]+))?              # Optional version after @
            (?:\#path=(?P<path>.+))?     # Optional path after #path=
            $
        """
        match = re.match(pattern, url.root, re.VERBOSE)
        if not match:
            raise ValueError(f"Invalid GitHub URL: {data}")
        for name, value in match.groupdict().items():
            setattr(url, f"_{name}", value)
        url._path = url.path.strip("/") if url.path else None
        url.root = str(url)  # normalize url
        return url

    async def resolve_version(self):
        async with httpx.AsyncClient() as client:
            if not self.version:
                manifest_url = f"https://github.com/{self.org}/{self.repo}/blob/-/dummy"
                resp = await client.head(manifest_url)
                if not resp.headers.get("location", None):
                    raise ValueError(f"{self.path} not found in github repository.")
                self._version = re.search("/blob/([^/]*)", resp.headers["location"]).group(1)
                self.root = str(self)  # normalize url

            tag_url = f"https://github.com/{self.org}/{self.repo}/releases/tag/{self.version}"
            resp = await client.head(tag_url)
            self._version_type = GithubVersionType.head if resp.is_error else GithubVersionType.tag

    def get_tgz_link(self) -> AnyUrl:
        if not self.version:
            raise ValueError("Version must be resolved before rendering raw url. Call resolve_version() first.")
        version_type = "heads" if self._version_type == GithubVersionType.head else "tags"
        return AnyUrl.build(
            scheme="https",
            host="github.com",
            path=f"{self.org}/{self.repo}/archive/refs/{version_type}/{self.version}.tar.gz",
        )

    def get_raw_url(self, path: str | None = None) -> AnyUrl:
        if not self.version:
            raise ValueError("Version must be resolved before rendering raw url. Call resolve_version() first.")
        if not path and "." not in (self.path or ""):
            raise ValueError("Path is not specified or it is not a file")
        path = path or self.path
        version_type = "heads" if self._version_type == GithubVersionType.head else "tags"
        return AnyUrl.build(
            scheme="https",
            host="raw.githubusercontent.com",
            path=f"{self.org}/{self.repo}/refs/{version_type}/{self.version}/{path.strip('/')}",
        )

    def __str__(self):
        version = f"@{self.version}" if self.version else ""
        path = f"#path={self.path}" if self.path else ""
        return f"git+https://github.com/{self.org}/{self.repo}{version}{path}"


def _is_unsafe_file(member: tarfile.TarInfo) -> bool:
    filename = member.name
    if (
        filename.startswith("/")
        or ".." in filename
        or not pathlib.Path(filename).absolute().is_relative_to(pathlib.Path(".").resolve())
    ):
        return True
    return False


def extract_targz_safe(tar_path: PathLike | Path, extract_path: PathLike | Path):
    with tarfile.open(tar_path, "r:gz") as tar:
        members = []
        for member in tar.getmembers():
            if member.linkpath or member.linkname:
                logger.warning(f"Cannot extract member: {member.name}, symlinks are forbidden")
                continue
            if _is_unsafe_file(member):
                raise ExtractError(f"Unsafe file: {member.name} (unix file links are forbidden)")
            members.append(member)
        tar.extractall(path=extract_path, members=members, filter="data")


_repo_download_locks: dict[str, anyio.Lock] = defaultdict(anyio.Lock)


async def download_repo(directory: Path | pathlib.Path, github_url: GithubUrl) -> Path:
    repo_id = f"{github_url.org}_{github_url.repo}_{github_url.version}"
    repo_path = Path(directory) / repo_id

    async with _repo_download_locks[repo_id]:
        if await repo_path.is_dir():
            return repo_path

        try:
            tmp_path = repo_path.parent / f"{repo_path.name}_tmp"
            if await tmp_path.is_dir():
                await anyio.to_thread.run_sync(shutil.rmtree, str(tmp_path))
            await tmp_path.mkdir(parents=True)
            download_link = str(github_url.get_tgz_link())
            tar_path = tmp_path / "repo.tar.gz"
            await github_url.resolve_version()
            async with httpx.AsyncClient(follow_redirects=True) as client:
                async with client.stream("GET", download_link) as response:
                    response.raise_for_status()
                    async with await anyio.open_file(tar_path, "wb") as f:
                        async for chunk in response.aiter_bytes():
                            await f.write(chunk)

            await anyio.to_thread.run_sync(extract_targz_safe, tar_path, tmp_path)
            await tar_path.unlink()
            [extracted_dir] = [d async for d in tmp_path.iterdir()]
            await anyio.to_thread.run_sync(shutil.move, str(extracted_dir), repo_path)
            await tmp_path.rmdir()
            return repo_path
        except Exception as exc:
            logger.error(f"Failed to download repo: {github_url}: {exc!r}")
            raise
