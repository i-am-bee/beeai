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

import json
from concurrent.futures import ThreadPoolExecutor
from copy import deepcopy
from typing import Any, TypeVar, Iterable

import typer
import yaml
from cachetools import cached
from jsf import JSF
from prompt_toolkit import PromptSession
from prompt_toolkit.auto_suggest import AutoSuggestFromHistory
from prompt_toolkit.completion import Completer
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


def check_json(value: Any) -> dict[str, Any]:
    try:
        return json.loads(value)
    except json.decoder.JSONDecodeError:
        raise typer.BadParameter(f"Invalid JSON '{value}'")


DictType = TypeVar("DictType", bound=dict)


def omit(dict: DictType, keys: Iterable[str]) -> DictType:
    return {key: value for key, value in dict.items() if key not in keys}


@cached(cache={}, key=json.dumps)
def generate_schema_example(json_schema: dict[str, Any]) -> dict[str, Any]:
    json_schema = deepcopy(json_schema)

    def _make_fakes_better(schema: dict[str, Any] | None):
        match schema["type"]:
            case "array":
                schema["maxItems"] = 3
                schema["minItems"] = 1
                schema["uniqueItems"] = True
                _make_fakes_better(schema["items"])
            case "object":
                for property in schema["properties"].values():
                    _make_fakes_better(property)

    _make_fakes_better(json_schema)
    return JSF(json_schema, allow_none_optionals=0).generate()


prompt_session = PromptSession()


def prompt_user(prompt: str | None = None, completer: Completer | None = None) -> str:
    # This is necessary because we are in a weird sync-under-async situation and the PromptSession
    # tries calling asyncio.run
    with ThreadPoolExecutor(max_workers=1) as executor:
        future = executor.submit(
            prompt_session.prompt,
            prompt or ">>> ",
            auto_suggest=AutoSuggestFromHistory(),
            completer=completer,
            complete_while_typing=True,
        )
        return future.result()
