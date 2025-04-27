from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.sql import text
from sqlalchemy.future import select
from database import SessionLocal
from models.models_test import User
from pydantic import BaseModel
from typing import Optional
from jose import JWTError, jwt
import os
from dotenv import load_dotenv


load_dotenv()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="users/login")  
SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = "HS256"

router = APIRouter(prefix="/users", tags=["users"])

# Модели Pydantic для запросов и ответов
class UserCreate(BaseModel):
    username: str
    email: str
    password: str

class UserLogin(BaseModel):
    username: str
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

async def get_current_user(token: str = Depends(oauth2_scheme), db: AsyncSession = Depends(get_db)) -> User:
    """
    Проверяет токен и возвращает текущего пользователя.
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: Optional[int] = payload.get("sub")
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
        result = await db.execute(select(User).where(User.id == user_id))
        user = result.scalar()
        if user is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found",
                headers={"WWW-Authenticate": "Bearer"},
            )
        return user
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

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

    new_user = User(username=user.username, email=user.email)
    new_user.set_password(user.password)  # Хешируем пароль

    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)

    return UserResponse(
        id=new_user.id,
        username=new_user.username,
        email=new_user.email
    )

@router.post("/login")
async def login_user(user_data: UserLogin, db: AsyncSession = Depends(get_db)):
    """
    Авторизует пользователя.
    """
    try:
        result = await db.execute(select(User).where(User.username == user_data.username))
        user = result.scalar()

        if not user or not user.verify_password(user_data.password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Неверное имя пользователя или пароль."
            )

        token_data = {"sub": str(user.id)}  
        token = jwt.encode(token_data, SECRET_KEY, algorithm=ALGORITHM)

        return {
            "access_token": token,
            "token_type": "Bearer",
            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email
            }
        }
    except Exception as e:
        print(f"Login error: {str(e)}")  
        raise

@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    """
    Возвращает данные текущего пользователя.
    """
    return UserResponse(
        id=current_user.id,
        username=current_user.username,
        email=current_user.email
    )


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(user_id: int, db: AsyncSession = Depends(get_db)):
    """
    Возвращает информацию о пользователе по его ID.
    """
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Пользователь не найден."
        )

    return UserResponse(id=user.id, username=user.username, email=user.email)



@router.put("/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: int,
    user_data: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Обновляет информацию о пользователе.
    """
    if current_user.id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to update this user."
        )

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Пользователь не найден."
        )

    if user_data.username:
        user.username = user_data.username
    if user_data.email:
        user.email = user_data.email
    if user_data.password:
        user.set_password(user_data.password)

    await db.commit()
    await db.refresh(user)

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

    await db.delete(user)
    await db.commit()

    return None

