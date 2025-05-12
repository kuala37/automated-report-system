from fastapi import APIRouter, Depends, HTTPException, Body
from typing import List, Optional
from sqlalchemy import select, update, and_, or_
from sqlalchemy.ext.asyncio import AsyncSession
from database import get_db
from models.models import FormattingPreset, User
from schemas import FormattingPresetCreate, FormattingPresetResponse, FormattingPresetUpdate
import json
from routes.user import get_current_user

router = APIRouter(prefix="/formatting", tags=["formatting"],)

@router.get("/presets", response_model=List[FormattingPresetResponse])
async def get_presets(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    Получить все пресеты форматирования, доступные пользователю
    """
    # Получить системные пресеты по умолчанию и пресеты пользователя
    stmt = select(FormattingPreset).where(
        or_(
            FormattingPreset.user_id == None,
            FormattingPreset.user_id == current_user.id
        )
    )
    result = await db.execute(stmt)
    presets = result.scalars().all()
    
    return presets

@router.get("/presets/defaults", response_model=List[FormattingPresetResponse])
async def get_default_presets(db: AsyncSession = Depends(get_db)):
    """
    Получить системные пресеты форматирования по умолчанию
    """
    stmt = select(FormattingPreset).where(FormattingPreset.user_id == None)
    result = await db.execute(stmt)
    presets = result.scalars().all()
    
    return presets

@router.get("/presets/{preset_id}", response_model=FormattingPresetResponse)
async def get_preset(preset_id: int, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    Получить конкретный пресет форматирования
    """
    stmt = select(FormattingPreset).where(FormattingPreset.id == preset_id)
    result = await db.execute(stmt)
    preset = result.scalar_one_or_none()
    
    if not preset:
        raise HTTPException(status_code=404, detail="Пресет не найден")
    
    # Проверить, может ли пользователь получить доступ к этому пресету (системный по умолчанию или собственный пресет пользователя)
    if preset.user_id and preset.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Нет прав для доступа к этому пресету")
    
    return preset

@router.post("/presets", response_model=FormattingPresetResponse)
async def create_preset(
    preset: FormattingPresetCreate, 
    db: AsyncSession = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    """
    Создать новый пресет форматирования
    """
    # Убедиться, что данные стилей правильно структурированы
    try:
        # Если стили переданы как строка, распарсить их
        if isinstance(preset.styles, str):
            styles_data = json.loads(preset.styles)
        else:
            styles_data = preset.styles
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Неверный формат стилей")
    
    # Создать новый пресет с идентификатором пользователя
    db_preset = FormattingPreset(
        name=preset.name,
        description=preset.description,
        styles=styles_data,
        is_default=preset.is_default,
        user_id=current_user.id
    )
    
    async with db.begin():
        if preset.is_default:
            stmt = select(FormattingPreset).where(
                FormattingPreset.user_id == current_user.id,
                FormattingPreset.is_default == True
            )
            result = await db.execute(stmt)
            existing_defaults = result.scalars().all()
            
            for default_preset in existing_defaults:
                default_preset.is_default = False
                db.add(default_preset)
        
        db.add(db_preset)
        await db.commit()
    
    stmt = select(FormattingPreset).where(FormattingPreset.id == db_preset.id)
    result = await db.execute(stmt)
    created_preset = result.scalar_one()
    
    return created_preset

@router.put("/presets/{preset_id}", response_model=FormattingPresetResponse)
async def update_preset(
    preset_id: int,
    preset_update: FormattingPresetUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Обновить пресет форматирования
    """
    stmt = select(FormattingPreset).where(FormattingPreset.id == preset_id)
    result = await db.execute(stmt)
    db_preset = result.scalar_one_or_none()
    
    if not db_preset:
        raise HTTPException(status_code=404, detail="Пресет не найден")
    
    # Разрешить пользователям изменять только свои пресеты
    if db_preset.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Нет прав для изменения этого пресета")
    
    # Обновить поля
    if preset_update.name is not None:
        db_preset.name = preset_update.name
    
    if preset_update.description is not None:
        db_preset.description = preset_update.description
    
    # Обновить стили, если они предоставлены
    if preset_update.styles is not None:
        try:
            # Если стили переданы как строка, распарсить их
            if isinstance(preset_update.styles, str):
                styles_data = json.loads(preset_update.styles)
            else:
                styles_data = preset_update.styles
            
            db_preset.styles = styles_data
        except json.JSONDecodeError:
            raise HTTPException(status_code=400, detail="Неверный формат стилей")
    
    # Обработать установку по умолчанию
    if preset_update.is_default:
        # Отменить установку по умолчанию для любых других пресетов этого пользователя
        stmt = select(FormattingPreset).where(
            FormattingPreset.user_id == current_user.id,
            FormattingPreset.is_default == True,
            FormattingPreset.id != preset_id
        )
        result = await db.execute(stmt)
        existing_defaults = result.scalars().all()
        
        for default_preset in existing_defaults:
            default_preset.is_default = False
            db.add(default_preset)
        
        db_preset.is_default = True
    elif preset_update.is_default is False:
        db_preset.is_default = False
    
    # Добавить обновленный пресет и зафиксировать изменения
    db.add(db_preset)
    await db.commit()
    
    # Получить обновленный пресет для возврата
    stmt = select(FormattingPreset).where(FormattingPreset.id == preset_id)
    result = await db.execute(stmt)
    updated_preset = result.scalar_one()
    
    return updated_preset

@router.delete("/presets/{preset_id}")
async def delete_preset(
    preset_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Удалить пресет форматирования
    """
    stmt = select(FormattingPreset).where(FormattingPreset.id == preset_id)
    result = await db.execute(stmt)
    db_preset = result.scalar_one_or_none()
    
    if not db_preset:
        raise HTTPException(status_code=404, detail="Пресет не найден")
    
    # Разрешить пользователям удалять только свои пресеты
    if db_preset.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Нет прав для удаления этого пресета")
    
    # Удалить без использования db.begin(), так как мы не выполняем несколько операций
    await db.delete(db_preset)
    await db.commit()
    
    return {"message": "Пресет успешно удален"}

@router.post("/presets/{preset_id}/default", response_model=FormattingPresetResponse)
async def set_default_preset(
    preset_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Установить пресет форматирования по умолчанию для пользователя
    """
    stmt = select(FormattingPreset).where(FormattingPreset.id == preset_id)
    result = await db.execute(stmt)
    db_preset = result.scalar_one_or_none()
    
    if not db_preset:
        raise HTTPException(status_code=404, detail="Пресет не найден")
    
    # Проверить, может ли пользователь получить доступ к этому пресету
    if db_preset.user_id and db_preset.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Нет прав для доступа к этому пресету")
    
    # Отменить установку по умолчанию для любых других пресетов этого пользователя
    stmt = select(FormattingPreset).where(
        FormattingPreset.user_id == current_user.id,
        FormattingPreset.is_default == True
    )
    result = await db.execute(stmt)
    existing_defaults = result.scalars().all()
    
    for default_preset in existing_defaults:
        default_preset.is_default = False
        db.add(default_preset)
    
    db_preset.is_default = True
    db.add(db_preset)
    
    await db.commit()
    
    stmt = select(FormattingPreset).where(FormattingPreset.id == preset_id)
    result = await db.execute(stmt)
    updated_preset = result.scalar_one()
    
    return updated_preset