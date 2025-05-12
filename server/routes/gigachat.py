from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from typing import Optional
from generation.generate_text_langchain import (
    generate_text,
    generate_text_with_params,
    generate_long_text,
)

router = APIRouter(prefix="/gigachat", tags=["gigachat"])

# Модели Pydantic для запросов
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

@router.post("/generate-text")
async def generate_text_endpoint(request: GenerateTextRequest):
    """
    Генерирует текст по промпту с использованием GigaChat API через LangChain.
    """
    try:
        generated_text = generate_text(request.prompt)
        return {"generated_text": generated_text}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ошибка при генерации текста: {str(e)}"
        )

@router.post("/generate-text-with-params")
async def generate_text_with_params_endpoint(request: GenerateTextWithParamsRequest):
    """
    Генерирует текст по промпту с настраиваемыми параметрами через LangChain.
    """
    try:
        generated_text = generate_text_with_params(
            request.prompt,
            temperature=request.temperature,
            max_tokens=request.max_tokens,
            top_p=request.top_p,
            n=request.n,
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
    Генерирует длинный текст, разбивая промпт на части через LangChain.
    """
    try:
        generated_text = generate_long_text(
            request.prompt,
            chunk_size=request.chunk_size,
        )
        return {"generated_text": generated_text}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ошибка при генерации текста: {str(e)}"
        )