from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from datetime import UTC, datetime

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from src.shared.api.router import api_router
from src.shared.auth.errors import AuthenticationError
from src.shared.config import get_settings
from src.shared.database import engine

settings = get_settings()


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncIterator[None]:
    yield
    await engine.dispose()


app = FastAPI(
    title="Sistema de Posgrado UTN FRLP — API Core",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=list(
        dict.fromkeys([settings.cors_origin, "http://localhost:3000", "http://localhost:5173"])
    ),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api/v1")


@app.exception_handler(AuthenticationError)
async def authentication_error_handler(
    _: Request,
    exception: AuthenticationError,
) -> JSONResponse:
    error = (
        "UNAUTHORIZED"
        if exception.status_code == 401
        else "FORBIDDEN"
        if exception.status_code == 403
        else "VALIDATION_ERROR"
    )
    return JSONResponse(
        status_code=exception.status_code,
        headers=exception.headers,
        content={
            "statusCode": exception.status_code,
            "error": error,
            "message": exception.detail,
            "timestamp": datetime.now(UTC).isoformat(),
        },
    )
