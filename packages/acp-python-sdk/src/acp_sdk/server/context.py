from acp_sdk.models import SessionId


class Context:
    def __init__(self, *, session_id: SessionId | None = None):
        self.session_id = session_id
