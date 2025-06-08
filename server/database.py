from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from models.models import Base

# Docker URL
DATABASE_URL="postgresql+asyncpg://admin:admin@automated-report-system-db-1:5432/report_system" # docker 

# Local URL
# DATABASE_URL="postgresql+asyncpg://admin:admin@localhost:5432/report_system"

engine = create_async_engine(DATABASE_URL, echo=True)
SessionLocal = sessionmaker(
    bind=engine, class_=AsyncSession, expire_on_commit=False
)

async def recreate_tables():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)  
        await conn.run_sync(Base.metadata.create_all)  

async def init_db():
    async with engine.begin() as conn:
        # Создаем таблицы
        await conn.run_sync(Base.metadata.create_all)

async def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        await db.close()  # Закрываем сессию с await