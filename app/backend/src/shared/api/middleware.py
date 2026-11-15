from datetime import UTC, datetime
from json import dumps

from starlette.types import ASGIApp, Message, Receive, Scope, Send

from src.legajos.document_storage import MAX_DOCUMENT_SIZE

MAX_DOCUMENT_REQUEST_SIZE = MAX_DOCUMENT_SIZE + 16 * 1024


class _UploadRequestTooLarge(Exception):
    pass


class DocumentUploadLimitMiddleware:
    def __init__(self, app: ASGIApp) -> None:
        self.app = app

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if (
            scope["type"] != "http"
            or scope["method"] != "POST"
            or not scope["path"].startswith("/api/v1/legajos/")
            or not scope["path"].endswith("/documentos")
        ):
            await self.app(scope, receive, send)
            return

        content_length = next(
            (value for name, value in scope["headers"] if name.lower() == b"content-length"),
            None,
        )
        if content_length is not None:
            try:
                declared_size = int(content_length)
            except ValueError:
                declared_size = 0
            if declared_size > MAX_DOCUMENT_REQUEST_SIZE:
                await self._send_too_large(scope, send)
                return

        received_size = 0
        response_started = False

        async def limited_receive() -> Message:
            nonlocal received_size
            message = await receive()
            if message["type"] == "http.request":
                received_size += len(message.get("body", b""))
                if received_size > MAX_DOCUMENT_REQUEST_SIZE:
                    raise _UploadRequestTooLarge
            return message

        async def tracked_send(message: Message) -> None:
            nonlocal response_started
            if message["type"] == "http.response.start":
                response_started = True
            await send(message)

        try:
            await self.app(scope, limited_receive, tracked_send)
        except _UploadRequestTooLarge:
            if not response_started:
                await self._send_too_large(scope, send)

    @staticmethod
    async def _send_too_large(scope: Scope, send: Send) -> None:
        timestamp = datetime.now(UTC).isoformat()
        response = {
            "statusCode": 413,
            "error": "PAYLOAD_TOO_LARGE",
            "message": "El archivo supera el tamaño máximo de 5 MB",
            "timestamp": timestamp,
        }
        body = dumps(response).encode("utf-8")
        await send(
            {
                "type": "http.response.start",
                "status": 413,
                "headers": [
                    (b"content-type", b"application/json"),
                    (b"content-length", str(len(body)).encode("ascii")),
                ],
            }
        )
        await send(
            {
                "type": "http.response.body",
                "body": body,
                "more_body": False,
            }
        )
