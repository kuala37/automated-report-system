from langchain_core.messages import HumanMessage, SystemMessage
from langchain_gigachat.chat_models import GigaChat
import os
from dotenv import load_dotenv

load_dotenv()
AUTHORIZATION_KEY = os.getenv("GIGACHAT_API_KEY")

def get_gigachat_client():
    """
    Возвращает клиент GigaChat для работы с API.
    """
    # Укажите ваш ключ авторизации
    credentials = AUTHORIZATION_KEY

    giga = GigaChat(
        credentials=credentials,
        verify_ssl_certs=False,  
        scope="GIGACHAT_API_PERS",  
        model="GigaChat",  
    )

    return giga