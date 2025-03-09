# from transformers import pipeline

# # Инициализация модели нейросети (например, T5 или любая другая от Hugging Face)
# generator = pipeline("text2text-generation", model="t5-small")  # Замени на свою модель

# def generate_report_content(template: str, data: dict) -> str:
#     # Пример: заменяем плейсхолдеры в шаблоне данными
#     prompt = template.format(**data)
#     # Генерация текста с помощью нейросети
#     generated = generator(prompt, max_length=500, num_return_sequences=1)[0]["generated_text"]
#     return generated