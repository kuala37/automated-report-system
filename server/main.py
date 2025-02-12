import asyncio
from sqlalchemy.sql import text
from fastapi import FastAPI
from database import init_db, SessionLocal
from models import User

async def lifespan(app: FastAPI):
    # Инициализация базы данных при старте приложения
    await init_db()

    # Создание тестового пользователя
    async with SessionLocal() as session:
        query = text("SELECT 1 FROM users WHERE username = :username")
        user_exists = await session.execute(query, {"username": "testuser"})

        if not user_exists.scalar():  # Проверяем, есть ли пользователь
            user = User(username="testuser", email="test@example.com", password="hashedpassword")
            session.add(user)
            await session.commit()

    # Возвращаем пустой объект Lifespan
    yield

app = FastAPI(lifespan=lifespan)

@app.get("/")
async def root():
    return {"message": "Hello, world"}
