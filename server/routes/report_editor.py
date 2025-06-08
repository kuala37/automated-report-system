from fastapi import APIRouter, HTTPException, Depends, Body, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Dict, Any, List, Optional
from models.models import User, Report
from routes.user import get_current_user
from database import get_db
from services.report_chat_service import ReportChatService
from pydantic import BaseModel
from datetime import datetime
import json
import os

router = APIRouter(prefix="/report-editor", tags=["report-editor"])
report_chat_service = ReportChatService()

class EditCommand(BaseModel):
    command: str
    # различные поля в зависимости от типа команды
    oldText: str = None
    newText: str = None
    paragraphId: int = None
    style: str = None
    textRange: Dict[str, int] = None

class SuggestionRequest(BaseModel):
    selectedText: str
    chatId: int

class CreateVersionRequest(BaseModel):
    description: str = ""

@router.post("/reports/{report_id}/generate-with-chat")
async def generate_report_with_chat(
    report_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Создает чат для существующего отчета"""
    # Проверяем доступ к отчету
    report = await db.get(Report, report_id)
    if not report or report.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Отчет не найден")
    
    # Если чат уже существует, возвращаем его
    if report.chat_id:
        return {"report_id": report_id, "chat_id": report.chat_id}
    
    # Создаем чат для отчета
    result = await report_chat_service.link_existing_report_to_chat(db, report_id, current_user.id)
    if not result:
        raise HTTPException(status_code=500, detail="Не удалось создать чат для отчета")
    
    return result

@router.post("/reports/{report_id}/edit")
async def edit_report(
    report_id: int,
    edit_command: EditCommand = Body(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Применяет команду редактирования к отчету"""
    # Проверяем доступ к отчету
    report = await db.get(Report, report_id)
    if not report or report.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Отчет не найден")
    
    if not report.chat_id:
        raise HTTPException(status_code=400, detail="У отчета нет связанного чата для редактирования")
    
    # Преобразуем Pydantic-модель в словарь
    command_dict = edit_command.dict(exclude_none=True)
    command_dict["user_id"] = current_user.id
    
    # Выполняем команду
    result = await report_chat_service.editor_service.update_document_with_edit(db, report_id, command_dict)
    
    # Отправляем сообщение в чат
    if result["success"]:
        await report_chat_service.chat_service.add_message(
            db, 
            report.chat_id,
            f"✅ {result['message']}", 
            role="system"
        )
    else:
        await report_chat_service.chat_service.add_message(
            db, 
            report.chat_id,
            f"❌ {result['message']}", 
            role="system"
        )
    
    return result

@router.post("/reports/{report_id}/chat/{chat_id}/process-command")
async def process_chat_edit_command(
    report_id: int,
    chat_id: int,
    command: Dict[str, Any] = Body(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Обрабатывает команду редактирования через чат"""
    # Проверка доступа
    report = await db.get(Report, report_id)
    if not report or report.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Отчет не найден")
    
    if report.chat_id != chat_id:
        raise HTTPException(status_code=400, detail="Чат не связан с этим отчетом")
    
    # Обрабатываем команду
    result = await report_chat_service.process_edit_command(
        db, report_id, chat_id, current_user.id, command["text"]
    )
    
    if not result:
        raise HTTPException(status_code=400, detail="Не удалось распознать команду редактирования")
    
    return result

@router.get("/reports/{report_id}/html")
async def get_report_html(
    report_id: int,
    version: Optional[int] = Query(None, description="Версия документа для загрузки"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Возвращает HTML-представление отчета для отображения в браузере"""
    # Проверяем доступ к отчету
    report = await db.get(Report, report_id)
    if not report or report.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Отчет не найден")
    
    # Если запрашивается конкретная версия
    if version is not None:
        if version < 1 or version > report.document_version:
            raise HTTPException(status_code=400, detail="Неверный номер версии")
        
        # Если запрашивается текущая версия
        if version == report.document_version:
            if report.html_content:
                return {"html": report.html_content, "version": version}
        else:
            # Ищем в истории версий
            version_history = report.version_history or []
            for version_data in version_history:
                if version_data.get("version") == version:
                    if version_data.get("html_content"):
                        return {"html": version_data["html_content"], "version": version}
                    elif version_data.get("file_path") and os.path.exists(version_data["file_path"]):
                        # Если HTML нет, но есть файл - конвертируем
                        html_content = await report_chat_service.editor_service.docx_to_html(version_data["file_path"])
                        return {"html": html_content, "version": version}
            
            raise HTTPException(status_code=404, detail=f"Версия {version} не найдена")
    
    # Если HTML-контент уже есть для текущей версии, возвращаем его
    if report.html_content:
        return {"html": report.html_content, "version": report.document_version}
    
    # Иначе - конвертируем документ
    try:
        html_content = await report_chat_service.editor_service.docx_to_html(report.file_path)
        
        # Сохраняем HTML в БД для будущего использования
        report.html_content = html_content
        await db.commit()
        
        return {"html": html_content, "version": report.document_version}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка конвертации документа: {str(e)}")

@router.post("/reports/{report_id}/versions")
async def create_new_version(
    report_id: int,
    request: CreateVersionRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Создает новую версию документа вручную"""
    # Проверяем доступ к отчету
    report = await db.get(Report, report_id)
    if not report or report.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Отчет не найден")
    
    try:
        # Инициализируем version_history, если его нет
        if report.version_history is None:
            initial_version = {
                "version": report.document_version,
                "timestamp": datetime.utcnow().isoformat(),
                "description": f"Начальная версия {report.document_version}",
                "file_path": report.file_path,
                "html_content": report.html_content,
                "edit_description": "Изначальная версия документа"
            }
            report.version_history = [initial_version]
        
        # Сохраняем текущую версию в истории (если еще не сохранена)
        version_history = list(report.version_history)
        current_version_exists = any(v.get("version") == report.document_version for v in version_history)
        
        if not current_version_exists:
            current_version_data = {
                "version": report.document_version,
                "timestamp": datetime.utcnow().isoformat(),
                "description": f"Версия {report.document_version}",
                "file_path": report.file_path,
                "html_content": report.html_content,
                "edit_description": "Сохранение текущего состояния"
            }
            version_history.append(current_version_data)
        
        # Увеличиваем номер версии
        new_version = report.document_version + 1
        
        # Создаем копию файла для новой версии
        base_path, ext = os.path.splitext(report.file_path)
        if base_path.endswith(f"_v{report.document_version}"):
            base_path = base_path[:-len(f"_v{report.document_version}")]
        new_file_path = f"{base_path}_v{new_version}{ext}"
        
        # Копируем файл
        import shutil
        shutil.copy2(report.file_path, new_file_path)
        
        # Создаем запись для новой версии
        new_version_data = {
            "version": new_version,
            "timestamp": datetime.utcnow().isoformat(),
            "description": request.description or f"Версия {new_version}",
            "file_path": new_file_path,
            "html_content": report.html_content,  # Копируем текущий HTML
            "edit_description": "Ручное создание версии"
        }
        
        version_history.append(new_version_data)
        
        # Обновляем отчет
        report.document_version = new_version
        report.file_path = new_file_path
        report.version_history = version_history
        
        await db.commit()
        
        return {
            "success": True,
            "message": f"Создана новая версия {new_version}",
            "version": new_version,
            "total_versions": len(version_history)
        }
        
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Ошибка создания версии: {str(e)}")

@router.get("/reports/{report_id}/versions")
async def get_version_history(
    report_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Возвращает историю версий документа"""
    # Проверяем доступ к отчету
    report = await db.get(Report, report_id)
    if not report or report.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Отчет не найден")
    
    # Инициализируем version_history, если его нет
    if report.version_history is None:
        initial_version = {
            "version": report.document_version,
            "timestamp": datetime.utcnow().isoformat(),
            "description": f"Начальная версия {report.document_version}",
            "file_path": report.file_path,
            "html_content": report.html_content,
            "edit_description": "Изначальная версия документа"
        }
        report.version_history = [initial_version]
        await db.commit()
    
    version_history = report.version_history or []
    
    # Убираем HTML контент из ответа для экономии трафика
    clean_history = []
    for version in version_history:
        clean_version = {
            "version": version.get("version"),
            "timestamp": version.get("timestamp"),
            "description": version.get("description"),
            "edit_description": version.get("edit_description", ""),
            "has_html": bool(version.get("html_content")),
            "has_file": bool(version.get("file_path") and os.path.exists(version.get("file_path", "")))
        }
        clean_history.append(clean_version)
    
    # Сортируем по версии
    clean_history.sort(key=lambda x: x["version"])
    
    return {
        "current_version": report.document_version,
        "total_versions": len(clean_history),
        "history": clean_history
    }

@router.post("/reports/{report_id}/versions/{version}/restore")
async def restore_version(
    report_id: int,
    version: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Восстанавливает указанную версию как текущую (создает новую версию на основе старой)"""
    # Проверяем доступ к отчету
    report = await db.get(Report, report_id)
    if not report or report.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Отчет не найден")
    
    if version < 1 or version > report.document_version:
        raise HTTPException(status_code=400, detail="Неверный номер версии")
    
    if version == report.document_version:
        return {"success": True, "message": "Это уже текущая версия"}
    
    try:
        # Ищем версию в истории
        version_history = report.version_history or []
        target_version_data = None
        
        for version_data in version_history:
            if version_data.get("version") == version:
                target_version_data = version_data
                break
        
        if not target_version_data:
            raise HTTPException(status_code=404, detail="Версия не найдена в истории")
        
        # Сохраняем текущую версию в истории перед восстановлением
        current_version_exists = any(v.get("version") == report.document_version for v in version_history)
        if not current_version_exists:
            current_version_data = {
                "version": report.document_version,
                "timestamp": datetime.utcnow().isoformat(),
                "description": f"Резервная копия версии {report.document_version}",
                "file_path": report.file_path,
                "html_content": report.html_content,
                "edit_description": "Автосохранение перед восстановлением"
            }
            version_history.append(current_version_data)
        
        # Создаем новую версию на основе восстановленной
        new_version = report.document_version + 1
        
        # Создаем путь для новой версии
        base_path, ext = os.path.splitext(report.file_path)
        if base_path.endswith(f"_v{report.document_version}"):
            base_path = base_path[:-len(f"_v{report.document_version}")]
        new_file_path = f"{base_path}_v{new_version}{ext}"
        
        # Копируем файл из старой версии
        old_file_path = target_version_data.get("file_path")
        if old_file_path and os.path.exists(old_file_path):
            import shutil
            shutil.copy2(old_file_path, new_file_path)
        else:
            raise HTTPException(status_code=404, detail="Файл старой версии не найден")
        
        # Создаем новую версию в истории
        restored_version_data = {
            "version": new_version,
            "timestamp": datetime.utcnow().isoformat(),
            "description": f"Восстановлена версия {version}",
            "file_path": new_file_path,
            "html_content": target_version_data.get("html_content"),
            "edit_description": f"Восстановление версии {version}"
        }
        
        version_history.append(restored_version_data)
        
        # Обновляем отчет
        report.document_version = new_version
        report.file_path = new_file_path
        report.html_content = target_version_data.get("html_content")
        report.version_history = version_history
        
        await db.commit()
        
        return {
            "success": True,
            "message": f"Версия {version} восстановлена как версия {new_version}",
            "new_version": new_version
        }
        
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Ошибка восстановления версии: {str(e)}")

@router.post("/reports/{report_id}/suggestions")
async def get_edit_suggestions(
    report_id: int,
    request: SuggestionRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Генерирует предложения по редактированию выделенного текста"""
    # Проверяем доступ к отчету
    report = await db.get(Report, report_id)
    if not report or report.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Отчет не найден")
    
    if report.chat_id != request.chatId:
        raise HTTPException(status_code=400, detail="Чат не связан с этим отчетом")
    
    # Генерируем предложения
    suggestions = await report_chat_service.generate_edit_suggestions(
        db, report_id, request.chatId, current_user.id, request.selectedText
    )
    
    return {"suggestions": suggestions}

@router.post("/reports/{report_id}/save")
async def save_document(
    report_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Сохраняет текущее состояние документа и возвращает ссылку на скачивание"""
    # Проверяем доступ к отчету
    report = await db.get(Report, report_id)
    if not report or report.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Отчет не найден")
    
    # Здесь можно добавить логику для фиксации текущей версии документа
    # Например, создать копию финальной версии в отдельной директории
    
    # Для простоты просто возвращаем путь к файлу
    return {
        "success": True,
        "message": "Документ успешно сохранен",
        "file_path": report.file_path
    }