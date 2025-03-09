import requests
import uuid
import json
import os
import base64
from dotenv import load_dotenv


load_dotenv()

def get_access_token():

    AUTHORIZATION_KEY = os.getenv("GIGACHAT_API_KEY")

    if not AUTHORIZATION_KEY:
        raise ValueError("API-ключ не найден. Убедись, что переменная окружения GIGACHAT_API_KEY установлена.")

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
        return access_token

    else:
        print(f"Ошибка при получении токена: {oauth_response.status_code}")
        print(oauth_response.text)





if __name__ == "__main__":
    try:
        token = get_access_token()
        print("Access Token получен:", token)

    except Exception as e:
        print(e)