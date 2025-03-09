from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.sql import text
from sqlalchemy.future import select
from database import SessionLocal
from models.models_test import User
from pydantic import BaseModel
from typing import Optional



router = APIRouter(prefix="/users", tags=["users"])

# Модели Pydantic для запросов и ответов
class UserCreate(BaseModel):
    username: str
    email: str
    password: str

class UserUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[str] = None
    password: Optional[str] = None

class UserResponse(BaseModel):
    id: int
    username: str
    email: str

# Зависимость для получения сессии базы данных
async def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        await db.close()

@router.post("/register", response_model=UserResponse)
async def register_user(user: UserCreate, db: AsyncSession = Depends(get_db)):
    """
    Регистрирует нового пользователя.
    """
    # Проверяем, существует ли пользователь с таким именем или email
    existing_user = await db.execute(
        text("SELECT * FROM users WHERE username = :username OR email = :email"),
        {"username": user.username, "email": user.email}
    )
    if existing_user.scalar():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Пользователь с таким именем или email уже существует."
        )

    # Создаем нового пользователя
    new_user = User(username=user.username, email=user.email)
    new_user.set_password(user.password)  # Хешируем пароль

    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)

    return new_user


@router.post("/login")
async def login_user(username: str, password: str, db: AsyncSession = Depends(get_db)):
    """
    Авторизует пользователя.
    """
    # Ищем пользователя по имени
    result = await db.execute(select(User).where(User.username == username))
    user = result.scalar()

    if not user or not user.verify_password(password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Неверное имя пользователя или пароль."
        )

    # Возвращаем информацию о пользователе (в реальном проекте здесь будет JWT-токен)
    return {"message": "Авторизация успешна", "user_id": user.id}

@router.get("/{user_id}", response_model=UserResponse)
async def get_user(user_id: int, db: AsyncSession = Depends(get_db)):
    """
    Возвращает информацию о пользователе по его ID.
    """
    # Используем select для получения пользователя
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Пользователь не найден."
        )

    # Преобразуем объект User в словарь или используем Pydantic модель
    return UserResponse(id=user.id, username=user.username, email=user.email)

@router.put("/{user_id}", response_model=UserResponse)
async def update_user(user_id: int, user_data: UserUpdate, db: AsyncSession = Depends(get_db)):
    """
    Обновляет информацию о пользователе.
    """
    # Используем select для получения пользователя
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Пользователь не найден."
        )

    # Обновляем данные, если они предоставлены
    if user_data.username:
        user.username = user_data.username
    if user_data.email:
        user.email = user_data.email
    if user_data.password:
        user.set_password(user_data.password)

    await db.commit()
    await db.refresh(user)

    # Возвращаем обновленного пользователя в формате Pydantic модели
    return UserResponse(id=user.id, username=user.username, email=user.email)


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(user_id: int, db: AsyncSession = Depends(get_db)):
    """
    Удаляет пользователя по его ID.
    """
    # Используем select для получения пользователя
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Пользователь не найден."
        )

    # Удаляем пользователя
    await db.delete(user)
    await db.commit()

    # Возвращаем успешный ответ без содержимого (204 No Content)
    return None

