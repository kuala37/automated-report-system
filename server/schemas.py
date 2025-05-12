from pydantic import BaseModel
from typing import Dict, Any, Optional, List
from datetime import datetime

class ItemBase(BaseModel):
    name: str
    description: str | None = None

class ItemCreate(ItemBase):
    pass

class ItemResponse(ItemBase):
    id: int

    class Config:
        orm_mode = True
        
# Formatting schemas
class FormattingPresetBase(BaseModel):
    name: str
    description: Optional[str] = None
    styles: Dict[str, Any]
    is_default: bool = False

class FormattingPresetCreate(FormattingPresetBase):
    pass

class FormattingPresetUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    styles: Optional[Dict[str, Any]] = None
    is_default: Optional[bool] = None

class FormattingPresetResponse(FormattingPresetBase):
    id: int
    user_id: Optional[int] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        orm_mode = True
