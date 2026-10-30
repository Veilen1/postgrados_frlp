from fastapi import APIRouter

from src.auth.api import router as auth_router
from src.cohortes.api import router as cohortes_router
from src.shared.api.health import router as health_router

api_router = APIRouter()
api_router.include_router(auth_router)
api_router.include_router(cohortes_router)
api_router.include_router(health_router)
