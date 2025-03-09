import requests
import uuid
import json
import os
from dotenv import load_dotenv

import sys
import os

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))


load_dotenv()

# Получение API-ключа
AUTHORIZATION_KEY = os.getenv("GIGACHAT_API_KEY")

# URL для получения токена
OAUTH_URL = "https://ngw.devices.sberbank.ru:9443/api/v2/oauth"

# Уникальный идентификатор запроса (RqUID)
RqUID = str(uuid.uuid4())

# Заголовки запроса для получения токена
oauth_headers = {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Accept': 'application/json',
    'RqUID': RqUID,
    'Authorization': f'Basic {AUTHORIZATION_KEY}'
}

# Данные для запроса токена
oauth_payload = {
    'scope': 'GIGACHAT_API_PERS'
}

# Получение Access Token
oauth_response = requests.post(OAUTH_URL, headers=oauth_headers, data=oauth_payload, verify=False)

if oauth_response.status_code == 200:
    access_token = oauth_response.json().get("access_token")
    print("Access Token получен:", access_token)

    # URL для генерации текста
    GENERATE_URL = "https://gigachat.devices.sberbank.ru/api/v1/chat/completions"

    # Заголовки запроса для генерации текста
    generate_headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': f'Bearer {access_token}'
    }

    # Данные для запроса
    generate_data = {
        "model": "GigaChat",
        "messages": [
            {
                "role": "user",
                "content": "Напиши подробный отчет о продажах за последний квартал."
            }
        ],
        "stream": False,
        "repetition_penalty": 1
    }

    # Отправка POST-запроса для генерации текста
    generate_response = requests.post(
        GENERATE_URL,
        headers=generate_headers,
        data=json.dumps(generate_data),
        verify=False
    )

    # Проверка ответа
    if generate_response.status_code == 200:
        generated_text = generate_response.json().get("choices")[0].get("message").get("content")
        print("Сгенерированный текст:")
        print(generated_text)
    else:
        print(f"Ошибка при генерации текста: {generate_response.status_code}")
        print(generate_response.text)
else:
    print(f"Ошибка при получении токена: {oauth_response.status_code}")
    print(oauth_response.text)