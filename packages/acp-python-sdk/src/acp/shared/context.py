from dataclasses import dataclass
from typing import Generic, TypeVar

from acp.shared.session import BaseSession
from acp.types import RequestId, RequestParams

SessionT = TypeVar("SessionT", bound=BaseSession)


@dataclass
class RequestContext(Generic[SessionT]):
    request_id: RequestId
    meta: RequestParams.Meta | None
    session: SessionT
