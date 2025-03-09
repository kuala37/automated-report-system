import json
import os
from dotenv import load_dotenv
from access_token import get_access_token  

# Загрузка переменных из .env файла
load_dotenv()

# Временное хранилище для шаблонов (заменим на базу данных позже)
TEMPLATES_FILE = "templates.json"

def get_templates():
    """
    Возвращает список всех шаблонов.

    Возвращает:
        list: Список шаблонов.
    """
    if not os.path.exists(TEMPLATES_FILE):
        return []

    with open(TEMPLATES_FILE, "r", encoding="utf-8") as f:
        return json.load(f)

def save_templates(templates):
    """
    Сохраняет список шаблонов в файл.

    Аргументы:
        templates (list): Список шаблонов.
    """
    with open(TEMPLATES_FILE, "w", encoding="utf-8") as f:
        json.dump(templates, f, ensure_ascii=False, indent=4)

def create_template(name, description, content, access_token):
    """
    Создает новый шаблон и сохраняет его.

    Аргументы:
        name (str): Название шаблона.
        description (str): Описание шаблона.
        content (str): Содержание шаблона (текст с переменными).
        access_token (str): Access Token для авторизации.

    Возвращает:
        dict: Созданный шаблон.
    """
    # Проверка Access Token (в реальном проекте это будет часть авторизации)
    if not access_token:
        raise ValueError("Access Token не предоставлен.")

    # Создание шаблона
    template = {
        "id": len(get_templates()) + 1,  # Временный ID (заменим на UUID позже)
        "name": name,
        "description": description,
        "content": content
    }

    try:
        templates = get_templates()
        templates.append(template)
        save_templates(templates)
        return template
    except Exception as e:
        raise Exception(f"Ошибка при создании шаблона: {e}")

def get_template_by_id(template_id):
    """
    Возвращает шаблон по его ID.

    Аргументы:
        template_id (int): ID шаблона.

    Возвращает:
        dict: Шаблон.
    """
    templates = get_templates()
    for template in templates:
        if template["id"] == template_id:
            return template
    raise ValueError(f"Шаблон с ID {template_id} не найден.")

def update_template(template_id, name=None, description=None, content=None, access_token=None):
    """
    Обновляет существующий шаблон.

    Аргументы:
        template_id (int): ID шаблона.
        name (str, optional): Новое название шаблона.
        description (str, optional): Новое описание шаблона.
        content (str, optional): Новое содержание шаблона.
        access_token (str): Access Token для авторизации.

    Возвращает:
        dict: Обновленный шаблон.
    """
    if not access_token:
        raise ValueError("Access Token не предоставлен.")

    templates = get_templates()
    for template in templates:
        if template["id"] == template_id:
            if name:
                template["name"] = name
            if description:
                template["description"] = description
            if content:
                template["content"] = content
            save_templates(templates)
            return template
    raise ValueError(f"Шаблон с ID {template_id} не найден.")

def delete_template(template_id, access_token):
    """
    Удаляет шаблон по его ID.

    Аргументы:
        template_id (int): ID шаблона.
        access_token (str): Access Token для авторизации.

    Возвращает:
        bool: True, если шаблон успешно удален.
    """
    if not access_token:
        raise ValueError("Access Token не предоставлен.")

    templates = get_templates()
    for i, template in enumerate(templates):
        if template["id"] == template_id:
            del templates[i]
            save_templates(templates)
            return True
    raise ValueError(f"Шаблон с ID {template_id} не найден.")

if __name__ == "__main__":
    try:
        access_token = get_access_token()

        # Пример создания шаблона
        name = "Отчет о продажах"
        description = "Шаблон для генерации отчета о продажах за квартал."
        content = (
            "Отчет о продажах за период: {период}.\n"
            "Общий объем продаж: {объем}.\n"
            "Основные тренды: {тренды}.\n"
            "Рекомендации: {рекомендации}."
        )
        template = create_template(name, description, content, access_token)
        template = create_template(name, description, content, access_token)


        print("Созданный шаблон:")
        print(json.dumps(template, ensure_ascii=False, indent=4))

        # Пример получения списка шаблонов
        templates = get_templates()
        print("\nСписок шаблонов:")
        print(json.dumps(templates, ensure_ascii=False, indent=4))

        # Пример получения шаблона по ID
        template_id = template["id"]
        fetched_template = get_template_by_id(template_id)
        print(f"\nШаблон с ID {template_id}:")
        print(json.dumps(fetched_template, ensure_ascii=False, indent=4))

        # Пример обновления шаблона
        updated_template = update_template(
            template_id,
            name="Обновленный отчет о продажах",
            description="Обновленный шаблон для отчета о продажах.",
            access_token=access_token
        )
        print("\nОбновленный шаблон:")
        print(json.dumps(updated_template, ensure_ascii=False, indent=4))

        # Пример удаления шаблона
        delete_template(template_id, access_token)
        print(f"\nШаблон с ID {template_id} удален.")
        print("Оставшиеся шаблоны:")
        print(json.dumps(get_templates(), ensure_ascii=False, indent=4))

    except Exception as e:
        print(e)