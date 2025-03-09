
from database import get_db
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.ext.asyncio import AsyncSession
from database import get_db
from models.models_test import Template, Report
#from services.report_service import generate_report_content
import json

router = APIRouter()

# Загрузка данных
@router.post("/upload-data/")
async def upload_data(file: UploadFile = File(...)):
    content = await file.read()
    try:
        data = json.loads(content)  # Предполагаем, что данные в JSON
        return {"message": "Данные успешно загружены", "data": data}
    except Exception as e:
        raise HTTPException(status_code=400, detail="Ошибка при обработке файла")

# Создание шаблона
@router.post("/templates/")
async def create_template(name: str, content: str, db: AsyncSession = Depends(get_db)):
    template = Template(name=name, content=content)
    db.add(template)
    try:
        await db.commit()  # Асинхронный коммит
        await db.refresh(template)  # Асинхронное обновление объекта
    except Exception as e:
        await db.rollback()  # Асинхронный откат при ошибке
        raise HTTPException(status_code=500, detail=f"Ошибка при сохранении: {str(e)}")
    return {"id": template.id, "name": template.name, "content": template.content}

# Генерация отчета
@router.post("/generate-report/")
async def generate_report(template_id: int, data: dict, db: AsyncSession = Depends(get_db)):
    template = await db.get(Template, template_id)  # Асинхронный запрос
    # if not template:
    #     raise HTTPException(status_code=404, detail="Шаблон не найден")
    
    # generated_content = generate_report_content(template.content, data)
    # report = Report(template_id=template_id, data=json.dumps(data), generated_content=generated_content)
    # db.add(report)
    # await db.commit()
    # await db.refresh(report)
    # return {"id": report.id, "generated_content": report.generated_content}

# Получение списка отчетов
@router.get("/reports/")
async def get_reports(db: AsyncSession = Depends(get_db)):
    result = await db.execute(db.query(Report))  # Асинхронный запрос
    reports = result.scalars().all()
    return [{"id": r.id, "template_id": r.template_id, "created_at": r.created_at} for r in reports]