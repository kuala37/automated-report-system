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
    title = Column(String, index=True)
    template_id = Column(Integer, ForeignKey("templates.id"))
    format = Column(String) 
    file_path = Column(String)
    status = Column(String, default="pending")
    created_at = Column(DateTime, default=datetime.utcnow)
    sections = Column(JSON, nullable=False)  
    formatting_preset_id = Column(Integer, ForeignKey("formatting_presets.id"), nullable=True)

    user = relationship("User", back_populates="reports")
    template = relationship("Template", back_populates="reports")
    formatting_preset = relationship("FormattingPreset")


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