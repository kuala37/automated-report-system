import asyncio
from fastapi import FastAPI
from database import init_db, SessionLocal
from models import User



app = FastAPI()

async def create_test_user():
    async with SessionLocal() as session:
        user = User(username="testuser", email="test@example.com", password="hashedpassword")
        session.add(user)
        await session.commit()

async def lifespan(app):
    await init_db()

@app.get("/")
def root():
    create_test_user()
    return "Hello, world"
