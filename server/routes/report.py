
from typing import List, Optional

from sqlalchemy import select
from database import SessionLocal, get_db
from fastapi import APIRouter, BackgroundTasks, Depends,HTTPException, status, UploadFile, File, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from sqlalchemy.ext.asyncio import AsyncSession
from models.models import FormattingPreset, Template, Report, User
from document_generation.document_service import DocumentService
from pathlib import Path
from pydantic import BaseModel
import json

from routes.user import get_current_user

class SectionSchema(BaseModel):
    title: str
    prompt: str
    heading_level: int = 1

class ReportCreate(BaseModel):
    title: str
    template_id: Optional[int]
    format: str
    sections: List[SectionSchema]
    formatting_preset_id: Optional[int] = None

router = APIRouter()
document_service = DocumentService()

# Загрузка данных
@router.post("/upload-data/")
async def upload_data(file: UploadFile = File(...)):
    content = await file.read()
    try:
        data = json.loads(content)  
        return {"message": "Данные успешно загружены", "data": data}
    except Exception as e:
        raise HTTPException(status_code=400, detail="Ошибка при обработке файла")

# Функция для фоновой генерации отчета
async def generate_report_background(report_id: int, report_data: ReportCreate, db: AsyncSession):
    try:
        # Получаем пресет форматирования, если он указан
        formatting_preset = None
        if report_data.formatting_preset_id:
            formatting_preset = await db.get(FormattingPreset, report_data.formatting_preset_id)
        
        # Генерируем документ вне транзакции
        document_service = DocumentService()
        file_path = document_service.generate_report(
            title=report_data.title,
            sections=report_data.dict()["sections"],
            format=report_data.format,
            formatting_styles=formatting_preset.styles if formatting_preset else None
        )

        # Обновляем статус в БД
        report = await db.get(Report, report_id)
        if report:
            report.status = "completed"
            report.file_path = file_path
            await db.commit()

    except Exception as e:
        report = await db.get(Report, report_id)
        if report:
            report.status = "error"
            await db.commit()
        print(f"Error generating report: {str(e)}")  
        raise e
# Генерация отчета
@router.post("/generate-report/")
async def generate_report(
    report_data: ReportCreate,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        async with db.begin():
            report = Report(
                user_id=current_user.id,
                title=report_data.title,
                template_id=report_data.template_id,
                format=report_data.format,
                file_path="",  
                status="pending",
                formatting_preset_id=report_data.formatting_preset_id,
                sections=[section.dict() for section in report_data.sections]
            )
            db.add(report)
            await db.flush()  
            report_id = report.id
            await db.commit()

        async_session = SessionLocal()
        
        background_tasks.add_task(
            generate_report_background,
            report_id,
            report_data,
            async_session
        )

        return {
            "id": report_id,
            "status": "pending",
            "message": "Report generation started"
        }

    except Exception as e:
        print(f"Error in generate_report: {str(e)}")  
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/reports/{report_id}")
async def get_report(
    report_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    report = await db.get(Report, report_id)
    if not report or report.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Report not found")
    
    return {
        "id": report.id,
        "title": report.title,
        "template_id": report.template_id,
        "format": report.format,
        "status": report.status,
        "file_path": report.file_path if report.status == "completed" else None,
        "created_at": report.created_at,
        "sections": report.sections
    }

@router.get("/reports/")
async def get_reports(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    stmt = select(Report).where(Report.user_id == current_user.id)
    result = await db.execute(stmt)
    reports = result.scalars().all()
    
    return [
        {
            "id": r.id,
            "title": r.title,
            "template_id": r.template_id,
            "format": r.format,
            "status": r.status,
            "file_path": r.file_path if r.status == "completed" else None,
            "created_at": r.created_at.isoformat(),
        } 
        for r in reports
    ]

@router.get("/reports/download/{filename}")
async def download_report(
    filename: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Проверяем права на скачивание
    stmt = select(Report).where(
        Report.file_path.endswith(filename),
        Report.user_id == current_user.id
    )
    result = await db.execute(stmt)
    report = result.scalar_one_or_none()
    
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    
    file_path = Path(report.file_path)
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    
    return FileResponse(
        file_path,
        filename=filename,
        media_type="application/octet-stream"
    )


@router.delete("/reports/{report_id}")
async def delete_report(
    report_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Удаление отчета"""
    try:
        # Получаем отчет
        stmt = select(Report).where(
            Report.id == report_id,
            Report.user_id == current_user.id
        )
        result = await db.execute(stmt)
        report = result.scalar_one_or_none()

        if not report:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Отчет не найден"
            )

        # Удаляем физический файл если он существует
        if report.file_path:
            file_path = Path(report.file_path)
            if file_path.exists():
                file_path.unlink()

        # Удаляем запись из БД
        await db.delete(report)
        await db.commit()

        return None

    except Exception as e:
        print(f"Error deleting report: {str(e)}")  # Добавляем логирование
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )