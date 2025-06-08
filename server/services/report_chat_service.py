from typing import Tuple, Dict, Any, Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from models.models import Report, Chat, ChatMessage, User
#from services.document_agent_service import DocumentAgentService
from Agent.SmartDocumentAgent import SmartDocumentAgent
from services.chat_service import ChatService
from document_generation.document_service import DocumentService
from services.document_editor_service import DocumentEditorService
from generation.generate_text_langchain import generate_text_with_params

class ReportChatService:
    """Сервис для интеграции отчетов и чатов"""
    
    def __init__(self):
        self.chat_service = ChatService()
        self.document_service = DocumentService()
        self.editor_service = DocumentEditorService()
        # Заменяем DocumentAIService на DocumentAgentService
        #self.document_agent_service = DocumentAgentService()
        self.smart_agent = SmartDocumentAgent()

    async def create_report_with_chat(
        self, db: AsyncSession, user_id: int, report_data: Dict[str, Any]
    ) -> Tuple[Report, Chat]:
        """Создает отчет и связанный с ним чат"""
        # Шаг 1: Создаем чат
        chat = await self.chat_service.create_chat(
            db, user_id, f"Чат отчета: {report_data['title']}"
        )
        
        # Шаг 2: Генерируем отчет
        file_path = await self.document_service.generate_report_async(
            report_data['title'],
            report_data['sections'],
            report_data.get('format', 'docx'),
            report_data.get('formatting_styles')
        )
        
        # Шаг 3: Конвертируем документ в HTML для отображения
        html_content = await self.editor_service.docx_to_html(file_path)
        
        # Шаг 4: Создаем запись отчета в БД, связывая с чатом
        report = Report(
            user_id=user_id,
            title=report_data['title'],
            template_id=report_data.get('template_id'),
            format=report_data.get('format', 'docx'),
            file_path=file_path,
            chat_id=chat.id,
            html_content=html_content,
            status="completed",
            sections=report_data['sections'],
            document_version=1,
            formatting_preset_id=report_data.get('formatting_preset_id')
        )
        db.add(report)
        await db.commit()
        await db.refresh(report)
        
        # Шаг 5: Отправляем приветственное сообщение в чат
        await self.chat_service.add_message(
            db, 
            chat.id, 
            f"Отчет «{report_data['title']}» создан! Я могу помочь вам с редактированием. Вы можете выделить текст в документе и попросить меня внести изменения.", 
            role="assistant"
        )
        
        return report, chat
    
    async def process_edit_command(
            self, db: AsyncSession, report_id: int, chat_id: int, user_id: int, command_text: str
        ) -> Optional[Dict[str, Any]]:
            """Обрабатывает команду редактирования, отправленную через чат"""
            try:
                # Проверяем доступ к отчету
                report = await db.get(Report, report_id)
                if not report or report.user_id != user_id:
                    return {"success": False, "message": "Отчет не найден или нет доступа"}
                    
                if report.chat_id != chat_id:
                    return {"success": False, "message": "Чат не связан с этим отчетом"}
                
                # Добавляем сообщение пользователя в чат
                user_msg = await self.chat_service.add_message(db, chat_id, command_text, role="user")
                
                # Используем умный агент для обработки команды
                result = await self.smart_agent.process_command(
                    db, report_id, user_id, command_text
                )
                
                # Отправляем сообщение в чат о результате
                if result["success"]:
                    await self.chat_service.add_message(
                        db,
                        chat_id,
                        f"✅ {result['message']}",
                        role="assistant"
                    )
                else:
                    await self.chat_service.add_message(
                        db,
                        chat_id,
                        f"❌ {result['message']}",
                        role="assistant"
                    )
                
                return result
                
            except Exception as e:
                print(f"Unexpected error in process_edit_command: {str(e)}")
                try:
                    await self.chat_service.add_message(
                        db,
                        chat_id,
                        f"Произошла ошибка при обработке команды: {str(e)}",
                        role="assistant"
                    )
                except:
                    pass
                
                return {"success": False, "message": f"Внутренняя ошибка сервера: {str(e)}"}

    async def generate_edit_suggestions(
        self, db: AsyncSession, report_id: int, chat_id: int, user_id: int, selected_text: str
    ) -> List[str]:
        """Генерирует предложения по редактированию выделенного текста"""
        # Проверяем доступ к отчету
        report = await db.get(Report, report_id)
        if not report or report.user_id != user_id:
            return []
            
        if report.chat_id != chat_id:
            return []
        
        # Добавляем сообщение пользователя в чат
        user_msg = await self.chat_service.add_message(
            db,
            chat_id,
            f"Предложите варианты улучшения текста: \"{selected_text}\"",
            role="user"
        )
        
        # Генерируем предложения
        suggestions = await self.ai_service.generate_document_edit_suggestion(selected_text)
        
        # Отправляем сообщение с предложениями
        suggestions_text = "Вот несколько вариантов улучшения текста:\n\n"
        for i, suggestion in enumerate(suggestions, 1):
            suggestions_text += f"{i}. {suggestion}\n"
        
        await self.chat_service.add_message(
            db,
            chat_id,
            suggestions_text,
            role="assistant"
        )
        
        return suggestions
    
    async def link_existing_report_to_chat(self, db: AsyncSession, report_id: int, user_id: int) -> Optional[Dict[str, Any]]:
        """Связывает существующий отчет с новым чатом для редактирования"""
        # Получаем отчет
        report = await db.get(Report, report_id)
        if not report or report.user_id != user_id:
            return None
        
        # Если у отчета уже есть чат, возвращаем его ID
        if report.chat_id:
            chat = await db.get(Chat, report.chat_id)
            if chat:
                return {"report_id": report_id, "chat_id": chat.id}
        
        # Создаем новый чат
        chat = await self.chat_service.create_chat(
            db, user_id, f"Чат отчета: {report.title}"
        )
        
        # Конвертируем документ в HTML, если это еще не сделано
        if not report.html_content:
            html_content = await self.editor_service.docx_to_html(report.file_path)
            report.html_content = html_content
        
        # Если поле document_version не существует, инициализируем его
        if not hasattr(report, 'document_version') or report.document_version is None:
            report.document_version = 1
            
        # Связываем отчет с чатом
        report.chat_id = chat.id
        await db.commit()
        
        # Отправляем приветственное сообщение
        await self.chat_service.add_message(
            db, 
            chat.id, 
            f"Отчет «{report.title}» открыт для редактирования! Вы можете выделить текст и сказать, что с ним сделать, а я помогу с редактированием.", 
            role="assistant"
        )
        
        return {"report_id": report_id, "chat_id": chat.id}