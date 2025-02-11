import re
from typing import Any

import httpx
from pydantic import model_validator, AnyUrl, ModelWrapValidatorHandler, RootModel


class GithubUrl(RootModel):
    root: str

    _org: str
    _repo: str
    _version: str | None = None
    _path: str | None = None

    @property
    def org(self) -> str:
        return self._org

    @property
    def repo(self) -> str:
        return self._repo

    @property
    def version(self) -> str:
        return self._version

    @property
    def path(self) -> str:
        return self._path

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
        if not self.version:
            manifest_url = f"https://github.com/{self.org}/{self.repo}/blob/-/dummy"
            async with httpx.AsyncClient() as client:
                resp = await client.head(manifest_url)
                if not resp.headers.get("location", None):
                    raise ValueError(f"{self.path} not found in github repository.")
                self._version = re.search("/blob/([^/]*)", resp.headers["location"]).group(1)
                self.root = str(self)  # normalize url

    def get_raw_url(self, path: str) -> AnyUrl:
        if not self.version:
            raise ValueError("Version must be resolved before rendering raw url. Call resolve_version() first.")
        return AnyUrl.build(
            scheme="https",
            host="raw.githubusercontent.com",
            path=f"{self.org}/{self.repo}/refs/heads/{self.version}/{path.strip('/')}",
        )

    def __str__(self):
        version = f"@{self.version}" if self.version else ""
        path = f"#path={self.path}" if self.path else ""
        return f"git+https://github.com/{self.org}/{self.repo}{version}{path}"
