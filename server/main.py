from fastapi import FastAPI
from .routers import items
from .database import engine, Base

# Создание таблиц
Base.metadata.create_all(bind=engine)

app = FastAPI()

# Роуты
app.include_router(items.router, prefix="/items", tags=["items"])

@app.get("/")
def read_root():
    return {"message": "Welcome to the API"}
