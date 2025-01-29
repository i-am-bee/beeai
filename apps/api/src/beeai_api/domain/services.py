import aiohttp
from anyio import Path as AsyncPath

from beeai_api.domain.model import (
    Registry,
    ProviderConnection,
    StdioCommand,
    LocalRegistry,
    GithubRegistry,
)


async def get_local_connection(registry: LocalRegistry) -> ProviderConnection:
    path = AsyncPath(registry.path)
    path = await path.resolve()
    if not path.exists():
        raise ValueError(f"Registry {registry.model_dump()} does not exist")

    if await (path / "pyproject.toml").is_file():
        return StdioCommand(command=["uvx", "--from", str(path), "main"])

    if await (path / "package.json").is_file():
        return StdioCommand(command=["npx", str(path)])
    raise ValueError("Not a compatible provider")


async def get_github_connection(registry: GithubRegistry) -> ProviderConnection:
    url = registry.github
    async with aiohttp.ClientSession() as session:
        await session.get(f"{url}/pyproject.toml")
        ...  # todo
    raise ValueError("Not a compatible provider")


async def get_provider_connection(registry: Registry) -> ProviderConnection:
    if isinstance(registry, LocalRegistry):
        return await get_local_connection(registry)
    elif isinstance(registry, GithubRegistry):
        return await get_github_connection(registry)
    raise NotImplementedError
