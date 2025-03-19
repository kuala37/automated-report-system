import pytest
import httpx
import time
from fastapi import status

BASE_URL = "http://localhost:8000/api"

# Тест для создания шаблона
@pytest.mark.asyncio
async def test_create_template():
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{BASE_URL}/templates/create_template",
            json={"name": "Отчет о продажах", "content": "Шаблон для генерации отчета."},
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "id" in data
        assert data["name"] == "Отчет о продажах"
        assert data["content"] == "Шаблон для генерации отчета."

# Тест для создания шаблона с пустыми данными:
@pytest.mark.asyncio
async def test_create_template_empty_data():
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{BASE_URL}/templates/create_template",
                                                    # Пустой json
        )
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

# Тест для получения списка шаблонов
@pytest.mark.asyncio
async def test_get_templates():
    async with httpx.AsyncClient() as client:
        response = await client.get(f"{BASE_URL}/templates/")
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert isinstance(data, list)

# Тест для получения шаблона по ID
@pytest.mark.asyncio
async def test_get_template_by_id():
    async with httpx.AsyncClient() as client:
        create_response = await client.post(
            f"{BASE_URL}/templates/create_template",
            json={"name": "Отчет о продажах", "content": "Шаблон для генерации отчета."},
        )
        template_id = create_response.json()["id"]

        response = await client.get(f"{BASE_URL}/templates/{template_id}")  # Добавляем ID в URL
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["id"] == template_id
        assert data["name"] == "Отчет о продажах"
        assert data["content"] == "Шаблон для генерации отчета."

#Тест для получения несуществующего шаблона:
@pytest.mark.asyncio
async def test_get_nonexistent_template():
    async with httpx.AsyncClient() as client:
        response = await client.get(f"{BASE_URL}/templates/99999")
        assert response.status_code == status.HTTP_404_NOT_FOUND

# Тест для обновления шаблона
@pytest.mark.asyncio
async def test_update_template():
    async with httpx.AsyncClient() as client:
        create_response = await client.post(
            f"{BASE_URL}/templates/create_template",
            json={"name": "Отчет о продажах", "content": "Шаблон для генерации отчета."},
        )
        template_id = create_response.json()["id"]

        update_response = await client.put(
            f"{BASE_URL}/templates/{template_id}",
            json={"name": "Обновленный отчет", "content": "Обновленный шаблон."},
        )
        assert update_response.status_code == status.HTTP_200_OK
        data = update_response.json()
        assert data["id"] == template_id
        assert data["name"] == "Обновленный отчет"
        assert data["content"] == "Обновленный шаблон."

# Тест для удаления шаблона
@pytest.mark.asyncio
async def test_delete_template():
    async with httpx.AsyncClient() as client:
        create_response = await client.post(
            f"{BASE_URL}/templates/create_template",
            json={"name": "Отчет о продажах", "content": "Шаблон для генерации отчета."},
        )
        template_id = create_response.json()["id"]

        delete_response = await client.delete(f"{BASE_URL}/templates/{template_id}")
        assert delete_response.status_code == status.HTTP_200_OK

        get_response = await client.get(f"{BASE_URL}/templates/{template_id}")
        assert get_response.status_code == status.HTTP_404_NOT_FOUND


# Тест для регистрации пользователя
@pytest.mark.asyncio
async def test_register_user():
    async with httpx.AsyncClient() as client:
        unique_id = str(int(time.time()))
        username = f"testuser_{unique_id}"
        email = f"test_{unique_id}@example.com"

        response = await client.post(
            f"{BASE_URL}/users/register",
            json={"username": username, "email": email, "password": "password123"},
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "id" in data
        assert data["username"] == username
        assert data["email"] == email

# Тест для регистрации уже существующего пользователя
@pytest.mark.asyncio
async def test_already_registered_user():
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{BASE_URL}/users/register",
            json={"username": "string", "email": "string", "password": "string"},
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST


# Тест для авторизации пользователя
@pytest.mark.asyncio
async def test_login_user():
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{BASE_URL}/users/login?username=testuser1&password=testpassword"
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "message" in data
        assert data["message"] == "Авторизация успешна"


# Тест для авторизации с неверным паролем:
@pytest.mark.asyncio
async def test_login_user_invalid_password():
    async with httpx.AsyncClient() as client:
        # Регистрируем пользователя
        response = await client.post(
            f"{BASE_URL}/users/login?username=testuser1&password=testpasswordsss"
        )
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

# Тест для генерации текста
@pytest.mark.asyncio
async def test_generate_text():
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{BASE_URL}/gigachat/generate-text",
            json={"prompt": "Напиши просто цифру 1."},
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "generated_text" in data
        assert isinstance(data["generated_text"], str)

