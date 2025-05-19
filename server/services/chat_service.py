from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from typing import List, Optional
from models.models import Chat, ChatMessage, User, Report
from generation.generate_text_langchain import generate_text_with_params


class ChatService:
    async def create_chat(self, db: AsyncSession, user_id: int, title: Optional[str] = None) -> Chat:
        """Создает новый чат для пользователя"""
        chat = Chat(user_id=user_id, title=title or "Новый чат")
        db.add(chat)
        await db.commit()
        await db.refresh(chat)
        return chat
    
    async def create_chat_with_first_message(
        self, db: AsyncSession, user_id: int, message_content: str
    ) -> tuple[Chat, List[ChatMessage]]:
        """Создает новый чат с начальным сообщением от пользователя и ответом от ИИ"""
        chat = await self.create_chat(db, user_id, title=message_content[:30] + "..." if len(message_content) > 30 else message_content)
        
        user_message = await self.add_message(db, chat.id, message_content, "user")
        
        ai_message = await self.generate_ai_response(db, chat.id, user_id)
        
        return chat, [user_message, ai_message]
    
    async def get_user_chats(self, db: AsyncSession, user_id: int) -> List[Chat]:
        """Возвращает все чаты пользователя"""
        query = select(Chat).where(Chat.user_id == user_id).order_by(Chat.updated_at.desc())
        result = await db.execute(query)
        return result.scalars().all()
    
    async def get_chat(self, db: AsyncSession, chat_id: int, user_id: int) -> Optional[Chat]:
        """Возвращает чат с сообщениями по ID"""
        query = select(Chat).where(
            Chat.id == chat_id, 
            Chat.user_id == user_id
        ).options(selectinload(Chat.messages))
        result = await db.execute(query)
        return result.scalars().first()
    
    async def add_message(self, db: AsyncSession, chat_id: int, content: str, role: str = "user") -> ChatMessage:
        """Добавляет новое сообщение в чат"""
        message = ChatMessage(chat_id=chat_id, content=content, role=role)
        db.add(message)
        
        # Обновляем время последнего взаимодействия с чатом
        chat = await db.get(Chat, chat_id)
        if chat:
            chat.updated_at = datetime.utcnow()
        
        await db.commit()
        await db.refresh(message)
        return message
    
    async def generate_ai_response(self, db: AsyncSession, chat_id: int, user_id: int, current_message: str = None) -> ChatMessage:
        """Генерирует ответ ИИ на основе истории чата"""
        # Получаем историю чата
        chat = await self.get_chat(db, chat_id, user_id)
        if not chat:
            return None
        
        if not chat.messages:
            # ВАЖНО: Если это первое сообщение, используем current_message если оно передано
            if current_message:
                # Для первого сообщения используем общие ответы или генерируем ответ
                last_message_lower = current_message.lower().strip()
                
                # Проверяем стандартные приветствия
                if last_message_lower == "привет" or last_message_lower == "здравствуйте":
                    return await self.add_message(
                        db, 
                        chat_id, 
                        "Привет! Я ассистент для системы отчетности. Чем могу помочь?", 
                        role="assistant"
                    )
                # Если это не приветствие, то продолжаем обработку как обычного сообщения
                last_user_message = current_message
            else:
                # Если нет сообщений и нет текущего сообщения, отправляем стандартное приветствие
                return await self.add_message(
                    db, 
                    chat_id, 
                    "Привет! Я ассистент для системы отчетности. Чем могу помочь?", 
                    role="assistant"
                )
        
        sorted_messages = sorted(chat.messages, key=lambda x: x.id)

        # Определяем последнее сообщение от пользователя - ВАЖНО: сразу берем последнее, а не ищем в истории
        # Поскольку сообщение пользователя уже добавлено в базу данных, оно должно быть последним сообщением user
        if current_message:
            last_user_message = current_message
        else:
            last_user_message = None
            for msg in reversed(sorted_messages):  # Идем от последнего к первому
                if msg.role == "user":
                    last_user_message = msg.content
                    break
        
        if not last_user_message:
            return await self.add_message(
                db, 
                chat_id,
                "Пожалуйста, задайте вопрос или опишите, с чем вам нужна помощь.", 
                role="assistant"
            ) 
        # Формируем контекст чата более структурировано
        formatted_messages = []
        for msg in sorted(chat.messages, key=lambda x: x.id)[-8:]:  # Сортируем по ID и берем последние 8
            role = "user" if msg.role == "user" else "assistant"
            formatted_messages.append({"role": role, "content": msg.content})
        
        # Создаем словарь с ответами на общие вопросы для большей надежности
        common_answers = {
            "привет": "Здравствуйте! Я ассистент для системы отчетности. Чем могу помочь?",
            "что это за сайт": "Это система автоматической отчетности, которая позволяет создавать, редактировать и анализировать отчеты. Здесь вы можете работать с документами, использовать ИИ для анализа данных и автоматизации отчетности.",
            "что умеешь": """Я могу помогать вам с различными задачами в системе отчетности:
    1. Отвечать на вопросы о работе системы
    2. Помогать в создании и редактировании отчетов
    3. Предоставлять аналитические данные
    4. Объяснять функционал различных компонентов
    5. Предлагать оптимальные решения для ваших отчетов
    6. Помогать с форматированием документов
    7. Анализировать загруженные данные
    8. Создавать шаблоны отчетов

    Просто скажите, с чем конкретно вам нужна помощь."""
        }
        
        # Проверяем, соответствует ли сообщение пользователя одному из часто задаваемых вопросов
        last_message_lower = last_user_message.lower().strip()
        
        for key, answer in common_answers.items():
            if last_message_lower == key or (len(last_message_lower) < 20 and key in last_message_lower):
                return await self.add_message(db, chat_id, answer, role="assistant")
        
        # Если нет прямого соответствия, используем генерацию текста с четкими инструкциями
        system_prompt = """Ты - полезный ассистент для системы автоматической отчетности. 
    ВАЖНО: НЕ НАЧИНАЙ ОТВЕТ С ПРИВЕТСТВИЯ, если пользователь не поздоровался с тобой в последнем сообщении.
    ВАЖНО: Отвечай точно на последний вопрос/сообщение пользователя, ИГНОРИРУЙ предыдущие вопросы.
    Отвечай кратко, точно и по существу.
    Не используй шаблонные фразы и общие ответы - будь конкретным и полезным.
    Система отчетности позволяет создавать отчеты, анализировать документы, форматировать тексты, работать с шаблонами и использовать ИИ для автоматизации работы с документами."""
        
        # Формируем историю чата для контекста, но с акцентом на последнее сообщение
        chat_history = ""
        # Берем только предыдущие сообщения для контекста
        previous_msgs = formatted_messages[:-1] if len(formatted_messages) > 1 else []
        for msg in previous_msgs:
            role_name = "Пользователь" if msg["role"] == "user" else "Ассистент"
            chat_history += f"\n- {role_name}: {msg['content']}"
        
        # Создаем промпт с четкими инструкциями и выделением последнего сообщения
        prompt = f"""
    {system_prompt}

    История чата для справки:{chat_history}

    ВАЖНО - ПОСЛЕДНЕЕ СООБЩЕНИЕ ПОЛЬЗОВАТЕЛЯ, НА КОТОРОЕ НУЖНО ОТВЕТИТЬ СЕЙЧАС: "{last_user_message}"

    Дай четкий, конкретный и полезный ответ именно на это последнее сообщение пользователя без лишних приветствий.
    """
        
        # Генерируем ответ с низкой температурой для детерминированности
        ai_response = generate_text_with_params(
            prompt=prompt,
            temperature=0.7,  # Снижаем температуру еще больше для предсказуемости
            max_tokens=2000
        )
        
        # Удаляем лишние приветствия из начала ответа
        # greetings = ["привет!", "привет", "здравствуйте!", "здравствуйте", "добрый день!", "добрый день"]
        # response_lower = ai_response.lower().strip()
        
        # for greeting in greetings:
        #     if response_lower.startswith(greeting):
        #         ai_response = ai_response[len(greeting):].strip()
        #         # Если первая буква после приветствия строчная, делаем ее заглавной
        #         if ai_response and ai_response[0].islower():
        #             ai_response = ai_response[0].upper() + ai_response[1:]
        
        # Если ответ пустой после удаления приветствия, используем запасной ответ
        # if not ai_response.strip():
        #     ai_response = "Я могу помочь вам с созданием и анализом отчетов, работой с документами и другими задачами в системе отчетности. Уточните, пожалуйста, с чем именно вам помочь?"
        
        return await self.add_message(db, chat_id, ai_response, role="assistant")


    async def update_chat_title(self, db: AsyncSession, chat_id: int, user_id: int, title: str) -> Optional[Chat]:
        """Обновляет заголовок чата"""
        chat = await db.get(Chat, chat_id)
        if chat and chat.user_id == user_id:
            chat.title = title
            await db.commit()
            await db.refresh(chat)
            return chat
        return None
    
    async def delete_chat(self, db: AsyncSession, chat_id: int, user_id: int) -> bool:
        """Удаляет чат"""
        chat = await db.get(Chat, chat_id)
        if chat and chat.user_id == user_id:
            await db.delete(chat)
            await db.commit()
            return True
        return False