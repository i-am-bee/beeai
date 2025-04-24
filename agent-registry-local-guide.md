# Using a Local Agent Registry in BeeAI

This guide outlines how to configure BeeAI to use a local agent registry file instead of the default GitHub-hosted registry.

## Background

By default, BeeAI uses a GitHub-hosted agent registry YAML file, which is periodically synchronized with the server. Sometimes for development or testing purposes, it's necessary to use a local registry file to ensure specific agent versions are used.

## Problem

When changing the `agent-registry.yaml` file locally, the changes might not be reflected in the running system because:

1. The server periodically synchronizes with the remote GitHub repository
2. Unmanaged providers might register with different versions
3. Docker image caches might retain old versions

## Local Registry Solution

### Step 1: Modify the Configuration

Edit `apps/beeai-server/src/beeai_server/configuration.py` to point to your local file:

```python
class AgentRegistryConfiguration(BaseModel):
    location: GithubUrl = GithubUrl(root="file:///path/to/your/agent-registry.yaml")
    preinstall: bool = True
```

### Step 2: Extend GithubUrl to Support File URLs

Modify `apps/beeai-server/src/beeai_server/utils/github.py` to handle file:// URLs:

```python
class GithubUrl(RootModel):
    root: str

    _org: str = ""
    _repo: str = ""
    _version: str | None = None
    _path: str | None = None
    _is_file: bool = False
    _file_path: str | None = None
    _resolved: bool = False
    _commit_hash: str = "local"

    # ... existing properties ...

    @model_validator(mode="wrap")
    @classmethod
    def _parse(cls, data: Any, handler: ModelWrapValidatorHandler):
        url: GithubUrl = handler(data)
        
        # Handle file:// URLs specially
        if str(url.root).startswith("file:///"):
            url._is_file = True
            url._file_path = str(url.root).replace("file://", "")
            return url

        # ... original GitHub URL parsing logic ...

    async def resolve_version(self) -> ResolvedGithubUrl:
        # If it's a file:// URL, we can create a local ResolvedGithubUrl without HTTP requests
        if self._is_file:
            self._resolved = True
            return ResolvedGithubUrl(
                org="local",
                repo="file",
                version="local",
                commit_hash="local",
                path=self._file_path,
                version_type=GithubVersionType.head
            )

        # ... original GitHub resolve logic ...

    def __str__(self):
        if self._is_file:
            return f"file://{self._file_path}"
        # ... original string representation ...
```

### Step 3: Update ResolvedGithubUrl to Handle Local Files

Add file handling to `ResolvedGithubUrl` class in the same file:

```python
class ResolvedGithubUrl(BaseModel):
    # ... existing properties ...

    def get_tgz_link(self) -> AnyUrl:
        # For local files, return a file URL
        if self.org == "local" and self.repo == "file":
            raise ValueError("Cannot get tgz link for local files")
            
        # ... original implementation ...

    def get_raw_url(self, path: str | None = None) -> AnyUrl:
        # For local files, return a file URL
        if self.org == "local" and self.repo == "file":
            file_path = path or self.path
            if not file_path:
                raise ValueError("Path is not specified for local file")
            return AnyUrl.build(
                scheme="file",
                path=file_path,
            )
        
        # ... original implementation ...

    def __str__(self):
        # For local files, return the file path
        if self.org == "local" and self.repo == "file":
            return f"file://{self.path}"
            
        # ... original implementation ...
```

### Step 4: Update Registry Provider Sync Logic

Modify `apps/beeai-server/src/beeai_server/crons/sync_registry_providers.py`:

```python
@periodic(period=timedelta(minutes=10))
@inject
async def check_official_registry(configuration: Configuration, provider_service: ProviderService):
    registry = await configuration.agent_registry.location.resolve_version()
    managed_providers = {provider.id for provider in await provider_service.list_providers() if provider.registry}
    errors = []
    desired_providers = set()

    # Handle local file path registry
    if registry.org == "local" and registry.repo == "file":
        try:
            # Read the local YAML file directly
            with open(registry.path, 'r') as f:
                registry_content = yaml.safe_load(f)
                resp = registry_content["providers"]
        except Exception as e:
            errors.append(ValueError(f"Error reading local registry file: {e}"))
            if errors:
                raise ExceptionGroup("Exceptions occurred when reloading providers", errors)
            return
    else:
        # Original HTTP request logic for GitHub URLs
        async with httpx.AsyncClient(...) as client:
            # ... original implementation ...
    
    # ... rest of the implementation ...
```

### Step 5: Docker Image Management

To ensure Docker uses the correct image versions:

1. Clean Docker cache:
   ```
   docker rmi ghcr.io/i-am-bee/beeai-platform/official/sequential-workflow:agents-v0.0.74
   ```

2. Remove provider cache:
   ```
   rm ~/.beeai/providers.yaml
   ```

3. Restart your server for changes to take effect

## Usage

1. Edit your local `agent-registry.yaml` file with the desired versions
2. Restart the BeeAI server
3. The server will now use the local file instead of the GitHub registry

## Troubleshooting

If you still encounter version issues:

1. Check for unmanaged providers registering themselves
2. Verify image tags with `docker images`
3. Ensure the registry path is accessible to the server
4. Set `PRODUCTION_MODE=True` environment variable to prevent agent auto-registration 
