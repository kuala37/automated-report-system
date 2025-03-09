import requests
import json
from dotenv import load_dotenv
from access_token import get_access_token  


# Загрузка переменных из .env файла
load_dotenv()

def generate_text(prompt, access_token):
    """
    Генерирует текст по промпту с использованием GigaChat API.

    Аргументы:
        prompt (str): Текстовый запрос (промпт).
        access_token (str): Access Token для авторизации.

    Возвращает:
        str: Сгенерированный текст.
    """
    generate_url = "https://gigachat.devices.sberbank.ru/api/v1/chat/completions"

    # Заголовки запроса
    headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': f'Bearer {access_token}'
    }

    # Данные для запроса
    payload = {
        "model": "GigaChat",
        "messages": [
            {
                "role": "user",
                "content": prompt
            }
        ],
        "temperature": 0.7,  # Параметр "творчества"
        "max_tokens": 500,    # Максимальное количество токенов в ответе
        "top_p": 0.9,         # Параметр разнообразия
        "n": 1                # Количество вариантов ответа
    }

    try:
        response = requests.post(generate_url, headers=headers, data=json.dumps(payload), verify=False)

        if response.status_code == 200:
            generated_text = response.json().get("choices")[0].get("message").get("content")
            return generated_text
        else:
            raise Exception(f"Ошибка при генерации текста: {response.status_code}, {response.text}")
    except Exception as e:
        raise Exception(f"Ошибка при выполнении запроса: {e}")


def generate_text_with_params(prompt, access_token, temperature=0.7, max_tokens=500, top_p=0.9, n=1):
    """
    Генерирует текст по промпту с использованием GigaChat API с настраиваемыми параметрами.

    Аргументы:
        prompt (str): Текстовый запрос (промпт).
        access_token (str): Access Token для авторизации.
        temperature (float): Параметр "творчества" (по умолчанию 0.7).
        max_tokens (int): Максимальное количество токенов в ответе (по умолчанию 500).
        top_p (float): Параметр разнообразия (по умолчанию 0.9).
        n (int): Количество вариантов ответа (по умолчанию 1).

    Возвращает:
        str: Сгенерированный текст.
    """
    generate_url = "https://gigachat.devices.sberbank.ru/api/v1/chat/completions"

    # Заголовки запроса
    headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': f'Bearer {access_token}'
    }

    # Данные для запроса
    payload = {
        "model": "GigaChat",
        "messages": [
            {
                "role": "user",
                "content": prompt
            }
        ],
        "temperature": temperature,  # Параметр "творчества"
        "max_tokens": max_tokens,    # Максимальное количество токенов в ответе
        "top_p": top_p,              # Параметр разнообразия
        "n": n                       # Количество вариантов ответа
    }

    try:
        response = requests.post(generate_url, headers=headers, data=json.dumps(payload), verify=False)

        if response.status_code == 200:
            generated_text = response.json().get("choices")[0].get("message").get("content")
            return generated_text
        else:
            raise Exception(f"Ошибка при генерации текста: {response.status_code}, {response.text}")
    except Exception as e:
        raise Exception(f"Ошибка при выполнении запроса: {e}")


def generate_long_text(prompt, access_token, temperature=0.7, max_tokens=500, top_p=0.9, n=1, chunk_size=1000):
    """
    Генерирует длинный текст, разбивая промпт на части.

    Аргументы:
        prompt (str): Текстовый запрос (промпт).
        access_token (str): Access Token для авторизации.
        temperature (float): Параметр "творчества" (по умолчанию 0.7).
        max_tokens (int): Максимальное количество токенов в ответе (по умолчанию 500).
        top_p (float): Параметр разнообразия (по умолчанию 0.9).
        n (int): Количество вариантов ответа (по умолчанию 1).
        chunk_size (int): Максимальная длина части промпта (по умолчанию 1000 символов).

    Возвращает:
        str: Сгенерированный текст.
    """
    # Разделение промпта на части
    chunks = [prompt[i:i + chunk_size] for i in range(0, len(prompt), chunk_size)]

    generated_text = ""

    for chunk in chunks:
        try:
            chunk_text = generate_text_with_params(chunk, access_token, temperature, max_tokens, top_p, n)
            generated_text += chunk_text + "\n\n"
        except Exception as e:
            print(f"Ошибка при генерации части текста: {e}")
            continue

    return generated_text

# Пример использования
if __name__ == "__main__":
    try:
        # Получение Access Token
        access_token = get_access_token()
        prompt = "Напиши подробный отчет о продажах за последний квартал."


        #generated_text = generate_text(prompt, access_token)
        #print("Сгенерированный текст:")
        #print(generated_text)


        # generated_text = generate_text_with_params(
        #     prompt,
        #     access_token,
        #     temperature=0.4,  # Более "творческий" ответ
        #     max_tokens=500,   # Ограничение длины ответа
        #     top_p=0.95,       # Больше разнообразия
        #     n=2               # Один вариант ответа
        # )
        #print("Сгенерированный текст:")
        #print(generated_text)


        long_prompt = (
        "Напиши подробный отчет о продажах за последний квартал. "
        "Включи информацию о продажах в категориях электроники, бытовой техники и одежды. "
        "Укажи основные тренды, такие как рост или снижение продаж, и причины этих изменений. "
        "Также добавь рекомендации по улучшению продаж в следующем квартале."
        )

        # Генерация длинного текста
        generated_text = generate_long_text(
            long_prompt,
            access_token,
            temperature=0.7,  # Параметр "творчества"
            max_tokens=1500,    # Максимальное количество токенов в ответе
            top_p=0.9,         # Параметр разнообразия
            n=1,               # Один вариант ответа
            chunk_size=1000    # Размер части промпта
        )
        print("Сгенерированный текст:")
        print(generated_text)

    except Exception as e:
        print(e)