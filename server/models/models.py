from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Text, DateTime, JSON
from sqlalchemy.orm import relationship,declarative_base
from sqlalchemy.sql import func
from passlib.context import CryptContext
Base = declarative_base()

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class User(Base):
    __tablename__ = 'users'
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, nullable=False)
    email = Column(String, unique=True, nullable=False)
    password = Column(String, nullable=False)

    reports = relationship("Report", back_populates="user")
    files = relationship("File", back_populates="user")
    formatting_presets = relationship("FormattingPreset", back_populates="owner")
    chats = relationship("Chat", back_populates="user", cascade="all, delete-orphan")
    documents = relationship("Document", back_populates="user", cascade="all, delete-orphan")

    def set_password(self, password):
        """Хеширует пароль и сохраняет его."""
        self.password = pwd_context.hash(password)

    def verify_password(self, password):
        """Проверяет, совпадает ли пароль с хешем."""
        return pwd_context.verify(password, self.password)
    

class Template(Base):
    __tablename__ = 'templates'
    id = Column(Integer, primary_key=True, index=True,autoincrement=True)
    name = Column(String, nullable=False)
    content = Column(Text, nullable=False)

    reports = relationship("Report", back_populates="template")


class Report(Base):
    __tablename__ = 'reports'
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    template_id = Column(Integer, ForeignKey("templates.id"))
    chat_id = Column(Integer, ForeignKey("chats.id"), nullable=True)
    title = Column(String, index=True)
    format = Column(String) 
    file_path = Column(String)
    status = Column(String, default="pending")
    created_at = Column(DateTime, default=datetime.utcnow)
    sections = Column(JSON, nullable=False)  
    formatting_preset_id = Column(Integer, ForeignKey("formatting_presets.id"), nullable=True)
    html_content = Column(Text, nullable=True)  # Для хранения HTML-представления документа
    document_version = Column(Integer, default=1)  # Версионность документа
    version_history = Column(JSON, nullable=True, default=lambda: [])  # Массив версий

    user = relationship("User", back_populates="reports")
    template = relationship("Template", back_populates="reports")
    formatting_preset = relationship("FormattingPreset")
    chat = relationship("Chat", foreign_keys=[chat_id])
    edits = relationship("DocumentEdit", back_populates="report")


class FormattingPreset(Base):
    __tablename__ = "formatting_presets"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    description = Column(String, nullable=True)
    styles = Column(JSON, nullable=False)
    is_default = Column(Boolean, default=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # Null for system presets
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow)
    
    owner = relationship("User", back_populates="formatting_presets")


class File(Base):
    __tablename__ = 'files'
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    filename = Column(String, nullable=False)
    uploaded_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="files")

class Chat(Base):
    __tablename__ = "chats"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, default="Новый чат")
    user_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="chats")
    messages = relationship("ChatMessage", back_populates="chat", cascade="all, delete-orphan")
    documents = relationship("ChatDocument", back_populates="chat", cascade="all, delete-orphan")


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    chat_id = Column(Integer, ForeignKey("chats.id"))
    content = Column(Text)
    role = Column(String)  
    created_at = Column(DateTime, default=datetime.utcnow)

    chat = relationship("Chat", back_populates="messages")


class Document(Base):
    __tablename__ = "documents"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    original_filename = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    file_type = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="documents")
    chat_documents = relationship("ChatDocument", back_populates="document", cascade="all, delete-orphan")


class ChatDocument(Base):
    __tablename__ = "chat_documents"
    
    id = Column(Integer, primary_key=True, index=True)
    chat_id = Column(Integer, ForeignKey("chats.id"))
    document_id = Column(Integer, ForeignKey("documents.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    
    chat = relationship("Chat", back_populates="documents")
    document = relationship("Document", back_populates="chat_documents")


class DocumentEdit(Base):
    __tablename__ = 'document_edits'
    id = Column(Integer, primary_key=True, index=True)
    report_id = Column(Integer, ForeignKey("reports.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    chat_message_id = Column(Integer, ForeignKey("chat_messages.id"), nullable=True)
    edit_type = Column(String)  # replace, format, insert, delete
    content_before = Column(Text, nullable=True)
    content_after = Column(Text, nullable=True)
    position = Column(JSON, nullable=True)  # Информация о расположении изменения
    timestamp = Column(DateTime, default=datetime.utcnow)
    
    report = relationship("Report", back_populates="edits")
    chat_message = relationship("ChatMessage")
