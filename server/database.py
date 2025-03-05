from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from models.models_test import Base

# localhost URL
#DATABASE_URL = "postgresql+asyncpg://user:password@localhost:5432/report_system"
#DATABASE_URL = "postgresql+asyncpg://admin:admin@localhost/report_system"

# Docker URL
DATABASE_URL="postgresql+asyncpg://admin:admin@automated-report-system-db-1:5432/report_system" # docker 


engine = create_async_engine(DATABASE_URL, echo=True)
SessionLocal = sessionmaker(
    bind=engine, class_=AsyncSession, expire_on_commit=False
)

async def init_db():
    async with engine.begin() as conn:
        # Создаем таблицы
        await conn.run_sync(Base.metadata.create_all)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()