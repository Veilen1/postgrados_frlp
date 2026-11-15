from fastapi import HTTPException, status


class AuthenticationError(HTTPException):
    def __init__(
        self,
        message: str = "Credenciales de autenticación no válidas",
        *,
        status_code: int = status.HTTP_401_UNAUTHORIZED,
    ) -> None:
        super().__init__(
            status_code=status_code,
            detail=message,
            headers={"WWW-Authenticate": "Bearer"} if status_code == 401 else None,
        )
