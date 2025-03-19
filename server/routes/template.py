from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from database import SessionLocal
from pydantic import BaseModel
from typing import Optional, List
from services.template_service import (
    create_template,
    get_templates,
    get_template_by_id,
    update_template,
    delete_template
)

router = APIRouter(prefix="/templates", tags=["templates"])

class TemplateCreate(BaseModel):
    name: str
    content: str

class TemplateUpdate(BaseModel):
    name: Optional[str] = None
    content: Optional[str] = None

class TemplateResponse(BaseModel):
    id: int
    name: str
    content: str

    class Config:
        from_attributes = True  

async def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        await db.close()

@router.post("/create_template", response_model=TemplateResponse)
async def create_template_endpoint(template: TemplateCreate, db: AsyncSession = Depends(get_db)):
    """
    Создает новый шаблон.
    """
    try:
        new_template = await create_template(db, template.name, template.content)
        return TemplateResponse.model_validate(new_template)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ошибка при создании шаблона: {str(e)}"
        )

@router.get("/", response_model=List[TemplateResponse])
async def get_templates_endpoint(db: AsyncSession = Depends(get_db)):
    """
    Возвращает список всех шаблонов.
    """
    templates = await get_templates(db)
    return [TemplateResponse.model_validate(template) for template in templates]

@router.get("/{template_id}", response_model=TemplateResponse)
async def get_template_endpoint(template_id: int, db: AsyncSession = Depends(get_db)):
    """
    Возвращает шаблон по его ID.
    """
    template = await get_template_by_id(db, template_id)
    return TemplateResponse.model_validate(template)

@router.put("/{template_id}", response_model=TemplateResponse)
async def update_template_endpoint(template_id: int, template: TemplateUpdate, db: AsyncSession = Depends(get_db)):
    """
    Обновляет существующий шаблон.
    """
    updated_template = await update_template(db, template_id, template.name, template.content)
    return TemplateResponse.model_validate(updated_template)

@router.delete("/{template_id}")
async def delete_template_endpoint(template_id: int, db: AsyncSession = Depends(get_db)):
    """
    Удаляет шаблон по его ID.
    """
    return await delete_template(db, template_id)