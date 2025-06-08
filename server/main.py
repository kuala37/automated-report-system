from sqlalchemy.sql import text
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import init_db, SessionLocal
from models.models import User
from routes.report import router as router_report
from routes.user import router as user_router
from routes.gigachat import router as gigachat_router  
from routes.template import router as template_router  
from routes.document import router as document_router
#from routes.file import router as file_router
from routes.formatting import router as formatting_router  
from routes.chat import router as chat_router  
from routes.document_analysis import router as document_analysis_router 
from routes.report_editor import router as report_editor_router


#import data.load_data


async def lifespan(app: FastAPI):
    await init_db()

    async with SessionLocal() as session:
        query = text("SELECT 1 FROM users WHERE username = :username")
        user_exists = await session.execute(query, {"username": "testuser"})

        if not user_exists.scalar():  # Проверяем, есть ли пользователь
            user = User(username="testuser", email="test@example.com", password="hashedpassword")
            session.add(user)
            await session.commit()

    yield
app = FastAPI(lifespan=lifespan)
#app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000"
    ],
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=True,
    expose_headers=["*"],
)


app.include_router(user_router, prefix="/api", tags=["users"])
app.include_router(router_report, prefix="/api", tags=["reports"])
app.include_router(gigachat_router, prefix="/api", tags=["gigachat"])
app.include_router(template_router, prefix="/api", tags=["templates"])  
app.include_router(document_router, prefix="/api", tags=["documents"])  
#app.include_router(file_router, prefix="/api", tags=["files"])  
app.include_router(formatting_router, prefix="/api", tags=["formatting"])
app.include_router(chat_router, prefix="/api", tags=["chats"]) 
app.include_router(document_analysis_router, prefix="/api", tags=["document-analysis"])  
app.include_router(report_editor_router, prefix="/api", tags=["report-editor"])  

@app.get("/")
async def root():
    return {"message": "Hello, world8000"}
