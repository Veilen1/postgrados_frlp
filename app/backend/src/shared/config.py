from functools import lru_cache
from pathlib import Path

from pydantic import SecretStr, field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

_DEVELOPMENT_JWT_SECRET = "super_secret_jwt_key_for_dev_mode_utn_posgrado_2026_at_least_32_chars"


def _find_env_file() -> Path:
    for parent in Path(__file__).resolve().parents:
        candidate = parent / ".env"
        if candidate.is_file():
            return candidate
    return Path.cwd() / ".env"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=_find_env_file(),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    database_url: str = (
        "postgresql+asyncpg://postgrado_user:postgrado_dev_password@localhost:5432/postgrado_dev"
    )
    jwt_secret: SecretStr = SecretStr(_DEVELOPMENT_JWT_SECRET)
    jwt_expiration: int = 28800
    jwt_refresh_expiration: int = 604800
    jwt_issuer: str = "utn-frlp-posgrado-auth"
    cors_origin: str = "http://localhost:3000"
    environment: str = "development"

    @field_validator("jwt_secret")
    @classmethod
    def require_256_bit_jwt_secret(cls, value: SecretStr) -> SecretStr:
        if len(value.get_secret_value().encode("utf-8")) < 32:
            raise ValueError("JWT_SECRET debe tener al menos 32 bytes")
        return value

    @field_validator("jwt_expiration", "jwt_refresh_expiration")
    @classmethod
    def require_positive_expiration(cls, value: int) -> int:
        if value <= 0:
            raise ValueError("La duración de los tokens debe ser positiva")
        return value

    @model_validator(mode="after")
    def reject_development_secret_outside_development(self) -> "Settings":
        if (
            self.environment.lower() not in {"development", "dev", "test"}
            and self.jwt_secret.get_secret_value() == _DEVELOPMENT_JWT_SECRET
        ):
            raise ValueError("Configurá un JWT_SECRET propio fuera de desarrollo")
        return self

    @field_validator("database_url")
    @classmethod
    def use_async_postgresql_driver(cls, value: str) -> str:
        if value.startswith("postgresql://"):
            return value.replace("postgresql://", "postgresql+asyncpg://", 1)
        return value


@lru_cache
def get_settings() -> Settings:
    return Settings()
