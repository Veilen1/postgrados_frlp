from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field, SecretStr, field_validator

Role = Literal["ASPIRANTE", "ALUMNO", "DOCENTE", "ADMIN_POSGRADO", "SUPERADMIN"]


def _validate_bcrypt_password(password: SecretStr) -> SecretStr:
    if len(password.get_secret_value().encode("utf-8")) > 72:
        raise ValueError("La contraseña no puede superar los 72 bytes")
    return password


class RegisterAspirantRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    email: EmailStr = Field(max_length=255)
    password: SecretStr = Field(min_length=12, max_length=72)
    nombre: str = Field(min_length=1, max_length=100)
    apellido: str = Field(min_length=1, max_length=100)

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: EmailStr) -> str:
        return str(value).lower()

    @field_validator("password")
    @classmethod
    def validate_password_bytes(cls, value: SecretStr) -> SecretStr:
        return _validate_bcrypt_password(value)


class LoginRequest(BaseModel):
    email: EmailStr = Field(max_length=255)
    password: SecretStr = Field(min_length=1, max_length=72)

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: EmailStr) -> str:
        return str(value).lower()

    @field_validator("password")
    @classmethod
    def validate_password_bytes(cls, value: SecretStr) -> SecretStr:
        return _validate_bcrypt_password(value)


class RefreshRequest(BaseModel):
    refresh_token: SecretStr = Field(min_length=1, max_length=128)


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    email: EmailStr
    nombre: str
    apellido: str
    rol: Role


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: Literal["bearer"] = "bearer"
    expires_in: int
    user: UserResponse
