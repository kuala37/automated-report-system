import os
import sys
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

import pandas as pd
from dotenv import load_dotenv
from gigachat.access_token import get_access_token  


# Загрузка переменных из .env файла
load_dotenv()

def load_data(file_path, access_token=None):
    """
    Загружает данные из файла (CSV или Excel).

    Аргументы:
        file_path (str): Путь к файлу с данными.
        access_token (str, optional): Access Token для авторизации.

    Возвращает:
        list: Данные в виде списка словарей.
    """
    # Проверка Access Token (если требуется)
    if access_token is not None and not access_token:
        raise ValueError("Access Token не предоставлен.")

    # Проверка существования файла
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"Файл {file_path} не найден.")

    # Определение формата файла
    file_extension = os.path.splitext(file_path)[1].lower()

    # Загрузка данных
    try:
        if file_extension == ".csv":
            data = pd.read_csv(file_path)
        elif file_extension in [".xlsx", ".xls"]:
            data = pd.read_excel(file_path)
        else:
            raise ValueError(f"Неподдерживаемый формат файла: {file_extension}")

        # Преобразование данных в список словарей
        return data.to_dict(orient="records")
    except Exception as e:
        raise Exception(f"Ошибка при загрузке данных: {e}")

# Пример использования
if __name__ == "__main__":
    try:
        # Получение Access Token (если требуется)
        access_token = get_access_token()

        csv_file = "data.csv"  # Замени на реальный путь к файлу
        csv_data = load_data(csv_file, access_token)
        print("Данные из CSV:")
        print(csv_data)

        excel_file = "data.xlsx"  # Замени на реальный путь к файлу
        excel_data = load_data(excel_file, access_token)
        print("\nДанные из Excel:")
        print(excel_data)

    except Exception as e:
        print(e)