from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from models.models_test import Template
from fastapi import HTTPException, status

async def create_template(db: AsyncSession, name: str, content: str):
    """
    Создает новый шаблон.
    """
    template = Template(name=name, content=content)
    db.add(template)
    await db.commit()
    await db.refresh(template)
    return template

async def get_templates(db: AsyncSession):
    """
    Возвращает список всех шаблонов.
    """
    result = await db.execute(select(Template))
    templates = result.scalars().all()
    return templates

async def get_template_by_id(db: AsyncSession, template_id: int):
    """
    Возвращает шаблон по его ID.
    """
    result = await db.execute(select(Template).where(Template.id == template_id))
    template = result.scalar()
    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Шаблон не найден."
        )
    return template

async def update_template(db: AsyncSession, template_id: int, name: str, content: str):
    """
    Обновляет существующий шаблон.
    """
    result = await db.execute(select(Template).where(Template.id == template_id))
    template = result.scalar()
    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Шаблон не найден."
        )

    template.name = name
    template.content = content
    await db.commit()
    await db.refresh(template)
    return template

async def delete_template(db: AsyncSession, template_id: int):
    """
    Удаляет шаблон по его ID.
    """
    result = await db.execute(select(Template).where(Template.id == template_id))
    template = result.scalar()
    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Шаблон не найден."
        )

    await db.delete(template)
    await db.commit()
    return {"message": "Шаблон успешно удален."}