import json
import os
import sys
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))


from dotenv import load_dotenv
from gigachat.access_token import get_access_token  


# Загрузка переменных из .env файла
load_dotenv()

# Временное хранилище для данных (заменим на базу данных позже)
DATA_FILE = "data.json"

def get_data():
    """
    Возвращает список всех данных.

    Возвращает:
        list: Список данных.
    """
    if not os.path.exists(DATA_FILE):
        return []

    with open(DATA_FILE, "r", encoding="utf-8") as f:
        return json.load(f)

def save_data(data):
    """
    Сохраняет список данных в файл.

    Аргументы:
        data (list): Список данных.
    """
    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=4)

def get_next_id():
    """
    Возвращает следующий ID для новых данных.

    Возвращает:
        int: Следующий ID.
    """
    data = get_data()
    if not data:
        return 1
    return max(item["id"] for item in data) + 1

def add_data(new_data, access_token=None):
    """
    Добавляет новые данные с автоматическим назначением ID.

    Аргументы:
        new_data (dict): Новые данные.
        access_token (str, optional): Access Token для авторизации.

    Возвращает:
        dict: Добавленные данные с ID.
    """
    # Проверка Access Token (если требуется)
    if access_token is not None and not access_token:
        raise ValueError("Access Token не предоставлен.")

    # Генерация нового ID
    new_data["id"] = get_next_id()

    # Добавление данных
    data = get_data()
    data.append(new_data)
    save_data(data)

    return new_data

def get_data_by_id(data_id):
    """
    Возвращает данные по их ID.

    Аргументы:
        data_id (int): ID данных.

    Возвращает:
        dict: Данные.
    """
    data = get_data()
    for item in data:
        if item["id"] == data_id:
            return item
    raise ValueError(f"Данные с ID {data_id} не найдены.")

def update_data(data_id, new_data, access_token=None):
    """
    Обновляет существующие данные.

    Аргументы:
        data_id (int): ID данных.
        new_data (dict): Новые данные.
        access_token (str, optional): Access Token для авторизации.

    Возвращает:
        dict: Обновленные данные.
    """
    # Проверка Access Token (если требуется)
    if access_token is not None and not access_token:
        raise ValueError("Access Token не предоставлен.")

    data = get_data()
    for item in data:
        if item["id"] == data_id:
            item.update(new_data)
            save_data(data)
            return item
    raise ValueError(f"Данные с ID {data_id} не найдены.")

def delete_data(data_id, access_token=None):
    """
    Удаляет данные по их ID.

    Аргументы:
        data_id (int): ID данных.
        access_token (str, optional): Access Token для авторизации.

    Возвращает:
        bool: True, если данные успешно удалены.
    """
    # Проверка Access Token (если требуется)
    if access_token is not None and not access_token:
        raise ValueError("Access Token не предоставлен.")

    data = get_data()
    for i, item in enumerate(data):
        if item["id"] == data_id:
            del data[i]
            save_data(data)
            return True
    raise ValueError(f"Данные с ID {data_id} не найдены.")

# Пример использования
if __name__ == "__main__":
    try:
        # Получение Access Token (если требуется)
        access_token = get_access_token()

        # Пример добавления данных
        new_data = {
            "Период": "2023-Q3",
            "Объем продаж": 1300000,
            "Тренды": "Рост продаж в бытовой технике",
            "Рекомендации": "Увеличить запасы"
        }
        added_data = add_data(new_data, access_token)


        print("Добавленные данные:")
        print(json.dumps(added_data, ensure_ascii=False, indent=4))

        # Пример получения данных по ID
        data_id = added_data["id"]
        fetched_data = get_data_by_id(data_id)
        print(f"\nДанные с ID {data_id}:")
        print(json.dumps(fetched_data, ensure_ascii=False, indent=4))

        # Пример обновления данных
        updated_data = update_data(
            data_id,
            {"Объем продаж": 1350000, "Рекомендации": "Увеличить рекламу в соцсетях"},
            access_token
        )
        print("\nОбновленные данные:")
        print(json.dumps(updated_data, ensure_ascii=False, indent=4))

        # Пример удаления данных
        delete_data(data_id, access_token)
        print(f"\nДанные с ID {data_id} удалены.")
        print("Оставшиеся данные:")
        print(json.dumps(get_data(), ensure_ascii=False, indent=4))

    except Exception as e:
        print(e)