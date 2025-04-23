from langchain_core.messages import HumanMessage, SystemMessage
from .langChainGiga import get_gigachat_client  


def generate_text(prompt):
    """
    Генерирует текст по промпту с использованием GigaChat API.

    Аргументы:
        prompt (str): Текстовый запрос (промпт).

    Возвращает:
        str: Сгенерированный текст.
    """
    # Получаем клиент GigaChat
    giga = get_gigachat_client()

    # Создаем сообщение
    messages = [SystemMessage(content=
            "Ты профессиональный аналитик, который составляет подробные отчеты о продажах. "
            "Отчет должен быть структурированным и содержать следующие разделы: "
            "1. Общий объем продаж. "
            "2. Основные тренды (рост или снижение продаж). "
            "3. Причины изменений. "
            "4. Рекомендации по улучшению продаж. "
            "Используй только факты и данные, избегай субъективных оценок."),
              HumanMessage(content=prompt)]


    # Генерируем текст
    response = giga.invoke(messages)
    return response.content

def generate_text_with_params(prompt, temperature=0.7, max_tokens=500, top_p=0.9, n=1):
    """
    Генерирует текст по промпту с настраиваемыми параметрами.

    Аргументы:
        prompt (str): Текстовый запрос (промпт).
        temperature (float): Параметр "творчества" (по умолчанию 0.7).
        max_tokens (int): Максимальное количество токенов в ответе (по умолчанию 500).
        top_p (float): Параметр разнообразия (по умолчанию 0.9).
        n (int): Количество вариантов ответа (по умолчанию 1).

    Возвращает:
        str: Сгенерированный текст.
    """
    # Получаем клиент GigaChat
    giga = get_gigachat_client()

    # Создаем сообщение
    messages = [HumanMessage(content=prompt)]

    # Генерируем текст с параметрами
    response = giga.invoke(
        messages,
        temperature=temperature,
        max_tokens=max_tokens,
        top_p=top_p,
        n=n,
    )
    return response.content

def generate_long_text(prompt, chunk_size=1000):
    """
    Генерирует длинный текст, разбивая промпт на части.

    Аргументы:
        prompt (str): Текстовый запрос (промпт).
        chunk_size (int): Максимальная длина части промпта (по умолчанию 1000 символов).

    Возвращает:
        str: Сгенерированный текст.
    """
    # Разделение промпта на части
    chunks = [prompt[i:i + chunk_size] for i in range(0, len(prompt), chunk_size)]

    generated_text = ""

    # Генерация текста для каждой части
    for chunk in chunks:
        try:
            chunk_text = generate_text(chunk)
            generated_text += chunk_text + "\n\n"
        except Exception as e:
            print(f"Ошибка при генерации части текста: {e}")
            continue

    return generated_text

# Пример использования
if __name__ == "__main__":
    try:
        # Получение Access Token
        giga = get_gigachat_client()

        # Пример генерации текста
        prompt = "Напиши подробный отчет о продажах за последний квартал."
        generated_text = generate_text(prompt)
        print("Сгенерированный текст:")
        print(generated_text)

        # Пример генерации текста с параметрами
        generated_text = generate_text_with_params(
            prompt,
            temperature=0.5,  # Более "творческий" ответ
            max_tokens=1000,  # Ограничение длины ответа
            top_p=0.95,       # Больше разнообразия
            n=2               # Два варианта ответа
        )
        print("Сгенерированный текст с параметрами:")
        print(generated_text)

        # Пример генерации длинного текста
        long_prompt = (
            "Напиши подробный отчет о продажах за последний квартал. "
            "Включи информацию о продажах в категориях электроники, бытовой техники и одежды. "
            "Укажи основные тренды, такие как рост или снижение продаж, и причины этих изменений. "
            "Также добавь рекомендации по улучшению продаж в следующем квартале."
        )
        generated_text = generate_long_text(long_prompt)
        print("Сгенерированный длинный текст:")
        print(generated_text)

    except Exception as e:
        print(e)