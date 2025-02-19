from starlette.status import HTTP_404_NOT_FOUND


class ManifestLoadError(Exception):
    location: str
    status_code: int

    def __init__(self, location: str, message: str | None = None, status_code: int = HTTP_404_NOT_FOUND):
        message = message or f"Manifest at location {location} not found."
        self.status_code = status_code
        super().__init__(message)


class LoadFeaturesError(Exception): ...


class UnsupportedProviderError(FileNotFoundError): ...
