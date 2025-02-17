from typing import TypeVar, Iterable


T = TypeVar("T")
V = TypeVar("V")
DictType = TypeVar("DictType", bound=dict)


def filter_dict(map: dict[str, T | V], value_to_exclude: V = None) -> dict[str, V]:
    """Remove entries with unwanted values (None by default) from dictionary."""
    return {filter: value for filter, value in map.items() if value is not value_to_exclude}


def pick(dict: DictType, keys: Iterable[str]) -> DictType:
    return {key: value for key, value in dict.items() if key in keys}


def omit(dict: DictType, keys: Iterable[str]) -> DictType:
    return {key: value for key, value in dict.items() if key not in keys}


def extract_messages(exc):
    if isinstance(exc, BaseExceptionGroup):
        return [(exc_type, msg) for e in exc.exceptions for exc_type, msg in extract_messages(e)]
    else:
        return [(type(exc).__name__, str(exc))]
