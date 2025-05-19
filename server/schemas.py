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


class ChatMessageCreate(BaseModel):
    content: str
    role: str = "user"


class ChatMessageResponse(BaseModel):
    id: int
    content: str
    role: str
    created_at: datetime

    class Config:
        from_attributes = True


class ChatCreate(BaseModel):
    title: Optional[str] = "Новый чат"


class ChatUpdate(BaseModel):
    title: str


class ChatResponse(BaseModel):
    id: int
    title: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ChatDetailResponse(ChatResponse):
    messages: List[ChatMessageResponse] = []

    class Config:
        from_attributes = True