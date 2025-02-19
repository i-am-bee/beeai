import yaml
from pydantic import BaseModel


def format_model(value: BaseModel | list[BaseModel]) -> str:
    if isinstance(value, BaseException):
        return str(value)
    if isinstance(value, list):
        return yaml.dump([item.model_dump(mode="json") for item in value])
    return yaml.dump(value.model_dump(mode="json"))


def extract_messages(exc):
    if isinstance(exc, BaseExceptionGroup):
        return [(exc_type, msg) for e in exc.exceptions for exc_type, msg in extract_messages(e)]
    else:
        return [(type(exc).__name__, str(exc))]


def parse_env_var(env_var: str) -> tuple[str, str]:
    """Parse environment variable string in format NAME=VALUE."""
    if "=" not in env_var:
        raise ValueError(f"Environment variable {env_var} is invalid, use format --env NAME=VALUE")
    key, value = env_var.split("=", 1)
    return key.strip(), value.strip()
