import os
from typing import Optional, List, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.document_loaders import (
    PyPDFLoader, 
    Docx2txtLoader, 
    TextLoader,
    UnstructuredExcelLoader
)
from models.models import User, ChatMessage, Document
from generation.generate_text_langchain import generate_text_with_params

class DocumentAnalysisService:
    """Сервис для анализа документов и взаимодействия с ними через ИИ"""
    
    SUPPORTED_EXTENSIONS = {
        ".pdf": PyPDFLoader,
        ".docx": Docx2txtLoader,
        ".doc": Docx2txtLoader,
        ".txt": TextLoader,
        ".xlsx": UnstructuredExcelLoader,
        ".xls": UnstructuredExcelLoader,
    }
    
    def __init__(self):
        self.upload_dir = os.path.join("uploads", "documents")
        os.makedirs(self.upload_dir, exist_ok=True)
    
    async def save_uploaded_file(self, file_content: bytes, filename: str, user_id: int, db: AsyncSession) -> Document:
        """Сохраняет загруженный файл и создает запись в базе данных"""
        # Определяем расширение файла
        _, ext = os.path.splitext(filename)
        if ext.lower() not in self.SUPPORTED_EXTENSIONS:
            supported = ", ".join(self.SUPPORTED_EXTENSIONS.keys())
            raise ValueError(f"Неподдерживаемый формат файла. Поддерживаемые форматы: {supported}")
        
        # Создаем уникальное имя файла
        import uuid
        unique_filename = f"{uuid.uuid4()}{ext}"
        file_path = os.path.join(self.upload_dir, unique_filename)
        
        # Сохраняем файл
        with open(file_path, "wb") as f:
            f.write(file_content)
        
        # Создаем запись в БД
        document = Document(
            user_id=user_id,
            original_filename=filename,
            file_path=file_path,
            file_type=ext
        )
        db.add(document)
        await db.commit()
        await db.refresh(document)
        
        return document
    
    async def extract_text_from_document(self, document_id: int, db: AsyncSession) -> str:
        """Извлекает текст из документа"""
        # Получаем документ из БД
        query = select(Document).where(Document.id == document_id)
        result = await db.execute(query)
        document = result.scalar_one_or_none()
        
        if not document:
            raise ValueError(f"Документ с ID {document_id} не найден")
        
        # Определяем расширение и выбираем соответствующий загрузчик
        _, ext = os.path.splitext(document.file_path)
        loader_class = self.SUPPORTED_EXTENSIONS.get(ext.lower())
        
        if not loader_class:
            raise ValueError(f"Неподдерживаемый формат файла: {ext}")
        
        # Загружаем документ
        try:
            loader = loader_class(document.file_path)
            docs = loader.load()
            
            # Извлекаем текст
            text_content = ""
            for doc in docs:
                text_content += doc.page_content + "\n\n"
            
            return text_content
        except Exception as e:
            raise Exception(f"Ошибка при извлечении текста из документа: {str(e)}")
    
    async def analyze_document(self, document_id: int, question: str, db: AsyncSession) -> str:
        """Анализирует документ с помощью ИИ"""
        text_content = await self.extract_text_from_document(document_id, db)
        
        # Для длинных документов разбиваем текст на части и анализируем только релевантные
        if len(text_content) > 10000:
            text_splitter = RecursiveCharacterTextSplitter(
                chunk_size=4000,
                chunk_overlap=400
            )
            chunks = text_splitter.split_text(text_content)
            
            context = "\n\n".join(chunks[:3]) 
        else:
            context = text_content
        
        # Формируем промпт для анализа
        prompt = f"""
        Проанализируй следующий документ и ответь на вопрос пользователя.
        
        ДОКУМЕНТ:
        {context}
        
        ВОПРОС ПОЛЬЗОВАТЕЛЯ: {question}
        
        Дай детальный и точный ответ на основе содержания документа. Если в документе нет информации для ответа на вопрос, 
        честно скажи об этом. Не придумывай информацию, которой нет в документе.
        """
        
        # Генерируем ответ
        response = generate_text_with_params(
            prompt=prompt,
            temperature=0.3,  # Низкая температура для более точных ответов
            max_tokens=5000
        )
        
        return response
    
    
    async def summarize_document(self, document_id: int, db: AsyncSession) -> str:
        """Создает краткое резюме документа"""
        text_content = await self.extract_text_from_document(document_id, db)
        
        # Ограничиваем размер контекста для больших документов
        if len(text_content) > 20000:
            text_content = text_content[:20000] + "..."
        
        prompt = f"""
        Создай краткое резюме следующего документа. Выдели ключевые моменты, основные темы и важные детали.
        
        ДОКУМЕНТ:
        {text_content}
        
        Резюме должно быть информативным и структурированным. Укажи также общий тип документа 
        (например, научная статья, бизнес-отчет, техническая документация и т.д.).
        """
        
        # Генерируем резюме
        summary = generate_text_with_params(
            prompt=prompt,
            temperature=0.5,
            max_tokens=1500
        )
        
        return summary