from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from database import SessionLocal
from models.models_test import User
from pydantic import BaseModel
from typing import Optional
from gigachat.access_token import get_access_token
from gigachat.generate_text import generate_text, generate_text_with_params, generate_long_text

router = APIRouter(prefix="/gigachat", tags=["gigachat"])

# Модели Pydantic для запросов и ответов
class GenerateTextRequest(BaseModel):
    prompt: str

class GenerateTextWithParamsRequest(BaseModel):
    prompt: str
    temperature: Optional[float] = 0.7
    max_tokens: Optional[int] = 500
    top_p: Optional[float] = 0.9
    n: Optional[int] = 1

class GenerateLongTextRequest(BaseModel):
    prompt: str
    temperature: Optional[float] = 0.7
    max_tokens: Optional[int] = 500
    top_p: Optional[float] = 0.9
    n: Optional[int] = 1
    chunk_size: Optional[int] = 1000

# Зависимость для получения сессии базы данных
async def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        await db.close()

@router.post("/generate-text")
async def generate_text_endpoint(request: GenerateTextRequest):
    """
    Генерирует текст по промпту с использованием GigaChat API.
    """
    try:
        access_token = get_access_token()
        generated_text = generate_text(request.prompt, access_token)
        return {"generated_text": generated_text}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ошибка при генерации текста: {str(e)}"
        )

@router.post("/generate-text-with-params")
async def generate_text_with_params_endpoint(request: GenerateTextWithParamsRequest):
    """
    Генерирует текст по промпту с настраиваемыми параметрами.
    """
    try:
        access_token = get_access_token()
        generated_text = generate_text_with_params(
            request.prompt,
            access_token,
            temperature=request.temperature,
            max_tokens=request.max_tokens,
            top_p=request.top_p,
            n=request.n
        )
        return {"generated_text": generated_text}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ошибка при генерации текста: {str(e)}"
        )

@router.post("/generate-long-text")
async def generate_long_text_endpoint(request: GenerateLongTextRequest):
    """
    Генерирует длинный текст, разбивая промпт на части.
    """
    try:
        access_token = get_access_token()
        generated_text = generate_long_text(
            request.prompt,
            access_token,
            temperature=request.temperature,
            max_tokens=request.max_tokens,
            top_p=request.top_p,
            n=request.n,
            chunk_size=request.chunk_size
        )
        return {"generated_text": generated_text}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ошибка при генерации текста: {str(e)}"
        )