from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from database import get_db
from models.models import User
from routes.user import get_current_user
from services.chat_service import ChatService
from pydantic import BaseModel
from schemas import (
    ChatCreate, 
    ChatUpdate, 
    ChatResponse, 
    ChatDetailResponse,
    ChatMessageCreate,
    ChatMessageResponse
)
from services.document_analysis_service import DocumentAnalysisService

class DocumentAnalysisRequest(BaseModel):
    document_id: int
    question: str

router = APIRouter(prefix="/chats", tags=["chats"])
chat_service = ChatService()


@router.post("/", response_model=ChatResponse)
async def create_chat(
    chat_data: ChatCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Создает новый чат"""
    return await chat_service.create_chat(db, current_user.id, chat_data.title)

@router.post("/new-with-message", response_model=dict)
async def create_chat_with_message(
    message: ChatMessageCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Создает новый чат с начальным сообщением"""
    chat, messages = await chat_service.create_chat_with_first_message(
        db, current_user.id, message.content
    )
    
    return {
        "chat_id": chat.id,
        "messages": messages
    }

@router.get("/", response_model=List[ChatResponse])
async def get_user_chats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Получает все чаты пользователя"""
    return await chat_service.get_user_chats(db, current_user.id)


@router.get("/{chat_id}", response_model=ChatDetailResponse)
async def get_chat(
    chat_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Получает детали чата включая сообщения"""
    chat = await chat_service.get_chat(db, chat_id, current_user.id)
    if not chat:
        raise HTTPException(status_code=404, detail="Чат не найден")
    return chat


@router.post("/{chat_id}/messages", response_model=List[ChatMessageResponse])
async def add_message(
    chat_id: int,
    message: ChatMessageCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Добавляет новое сообщение и генерирует ответ ИИ"""
    # Проверяем существование чата
    chat = await chat_service.get_chat(db, chat_id, current_user.id)
    if not chat:
        raise HTTPException(status_code=404, detail="Чат не найден")
    
    # Проверяем, является ли это первым сообщением в чате
    is_first_message = len(chat.messages) == 0
    
    # Добавляем сообщение пользователя
    user_message = await chat_service.add_message(db, chat_id, message.content, "user")
    
    # ВАЖНО: Передаем последнее сообщение напрямую, а не ищем его в базе данных
    ai_message = await chat_service.generate_ai_response(db, chat_id, current_user.id, message.content)
    
    # Если это первое сообщение, обновляем заголовок чата
    if is_first_message and message.content:
        # Создаем короткий заголовок из первого сообщения
        title = message.content[:30] + ("..." if len(message.content) > 30 else "")
        await chat_service.update_chat_title(db, chat_id, current_user.id, title)
    
    return [user_message, ai_message]


@router.post("/{chat_id}/reset", response_model=ChatMessageResponse)
async def reset_chat_context(
    chat_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Сбрасывает контекст чата для улучшения качества ответов"""
    # Проверяем существование чата
    chat = await chat_service.get_chat(db, chat_id, current_user.id)
    if not chat:
        raise HTTPException(status_code=404, detail="Чат не найден")
    
    # Добавляем системное сообщение о сбросе контекста
    system_message = await chat_service.add_message(
        db, chat_id, 
        "Контекст чата был сброшен системой для улучшения качества ответов.", 
        role="system"
    )
    
    # Добавляем сообщение от ассистента
    ai_message = await chat_service.add_message(
        db, chat_id,
        "Я готов продолжить общение с вами. В чем я могу помочь?",
        role="assistant"
    )
    
    return ai_message

@router.put("/{chat_id}", response_model=ChatResponse)
async def update_chat(
    chat_id: int,
    chat_data: ChatUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Обновляет заголовок чата"""
    chat = await chat_service.update_chat_title(db, chat_id, current_user.id, chat_data.title)
    if not chat:
        raise HTTPException(status_code=404, detail="Чат не найден")
    return chat


@router.delete("/{chat_id}")
async def delete_chat(
    chat_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Удаляет чат"""
    result = await chat_service.delete_chat(db, chat_id, current_user.id)
    if not result:
        raise HTTPException(status_code=404, detail="Чат не найден")
    return {"status": "success", "message": "Чат удален"}


@router.post("/{chat_id}/analyze-document", response_model=ChatMessageResponse)
async def analyze_document_in_chat(
    chat_id: int,
    request: DocumentAnalysisRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Анализирует документ в контексте чата"""
    # Проверяем существование чата
    chat = await chat_service.get_chat(db, chat_id, current_user.id)
    if not chat:
        raise HTTPException(status_code=404, detail="Чат не найден")
    
    # Добавляем сообщение пользователя
    user_message = await chat_service.add_message(
        db, 
        chat_id, 
        f"[Анализ документа #{request.document_id}] {request.question}", 
        "user"
    )
    
    # Генерируем ответ на основе анализа документа
    ai_message = await chat_service.generate_document_analysis_response(
        db, chat_id, current_user.id, request.document_id, request.question
    )
    
    return ai_message

# Добавьте маршрут для получения списка документов в чате
@router.get("/{chat_id}/documents", response_model=List)
async def get_chat_documents(
    chat_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Получает список документов, прикрепленных к чату"""
    documents = await chat_service.list_documents_for_chat(db, chat_id, current_user.id)
    return documents