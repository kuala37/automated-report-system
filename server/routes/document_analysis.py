from datetime import datetime
from fastapi import APIRouter, HTTPException, Depends, UploadFile, Form, File, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from database import get_db
from models.models import User, Document, ChatDocument, Chat
from routes.user import get_current_user
from pydantic import BaseModel
from services.document_analysis_service import DocumentAnalysisService

router = APIRouter(prefix="/document-analysis", tags=["document-analysis"])
document_service = DocumentAnalysisService()

class DocumentResponse(BaseModel):
    id: int
    original_filename: str
    file_type: str
    created_at: datetime
    
    class Config:
        from_attributes = True

class DocumentAnalysisRequest(BaseModel):
    document_id: int
    question: str

class DocumentAnalysisResponse(BaseModel):
    answer: str

@router.post("/upload", response_model=DocumentResponse)
async def upload_document(
    file: UploadFile = File(...),
    chat_id: Optional[int] = Form(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Загружает документ для анализа"""
    try:
        # Читаем содержимое файла
        file_content = await file.read()
        
        # Сохраняем файл
        document = await document_service.save_uploaded_file(
            file_content=file_content,
            filename=file.filename,
            user_id=current_user.id,
            db=db
        )
        
        # Если указан chat_id, связываем документ с чатом
        if chat_id:
            chat_document = ChatDocument(chat_id=chat_id, document_id=document.id)
            db.add(chat_document)
            await db.commit()
        
        return document
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка при загрузке документа: {str(e)}")

@router.post("/analyze", response_model=DocumentAnalysisResponse)
async def analyze_document(
    request: DocumentAnalysisRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Анализирует документ и отвечает на вопрос"""
    try:
        # Проверяем доступ к документу
        from sqlalchemy import select
        query = select(Document).where(
            Document.id == request.document_id,
            Document.user_id == current_user.id
        )
        result = await db.execute(query)
        document = result.scalar_one_or_none()
        
        if not document:
            raise HTTPException(status_code=404, detail="Документ не найден или нет доступа")
        
        # Анализируем документ
        answer = await document_service.analyze_document(
            document_id=request.document_id,
            question=request.question,
            db=db
        )
        
        return {"answer": answer}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка при анализе документа: {str(e)}")

@router.get("/documents", response_model=List[DocumentResponse])
async def get_user_documents(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Получает список документов пользователя"""
    from sqlalchemy import select
    query = select(Document).where(Document.user_id == current_user.id).order_by(Document.created_at.desc())
    result = await db.execute(query)
    documents = result.scalars().all()
    
    return documents

@router.get("/documents/chat/{chat_id}", response_model=List[DocumentResponse])
async def get_chat_documents(
    chat_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Получает список документов, связанных с конкретным чатом"""
    # Проверяем доступ к чату
    chat_query = select(Chat).where(Chat.id == chat_id, Chat.user_id == current_user.id)
    chat_result = await db.execute(chat_query)
    chat = chat_result.scalar_one_or_none()
    
    if not chat:
        raise HTTPException(status_code=404, detail="Чат не найден или нет доступа")
    
    # Получаем документы чата
    from sqlalchemy import join
    query = select(Document).select_from(
        join(Document, ChatDocument, Document.id == ChatDocument.document_id)
    ).where(ChatDocument.chat_id == chat_id)
    
    result = await db.execute(query)
    documents = result.scalars().all()
    
    return documents

@router.post("/summarize/{document_id}", response_model=dict)
async def summarize_document(
    document_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Создает краткое резюме документа"""
    # Проверяем доступ к документу
    query = select(Document).where(
        Document.id == document_id,
        Document.user_id == current_user.id
    )
    result = await db.execute(query)
    document = result.scalar_one_or_none()
    
    if not document:
        raise HTTPException(status_code=404, detail="Документ не найден или нет доступа")
    
    # Создаем резюме
    try:
        summary = await document_service.summarize_document(document_id, db)
        return {"summary": summary}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка при создании резюме: {str(e)}")