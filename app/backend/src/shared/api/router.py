from fastapi import APIRouter

from src.auth.api import router as auth_router
from src.cohortes.api import router as cohortes_router
from src.legajos.api import router as legajos_router
from src.legajos.document_api import router as documents_router
from src.shared.api.health import router as health_router

api_router = APIRouter()
api_router.include_router(auth_router)
api_router.include_router(cohortes_router)
api_router.include_router(legajos_router)
api_router.include_router(documents_router)
api_router.include_router(health_router)
