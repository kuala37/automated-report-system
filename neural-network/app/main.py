from fastapi import FastAPI
from transformers import T5Tokenizer, T5ForConditionalGeneration
import os

app = FastAPI()

model_name = os.getenv("MODEL_NAME", "t5-small")
tokenizer = T5Tokenizer.from_pretrained(model_name)
tokenizer.pad_token = tokenizer.eos_token
model = T5ForConditionalGeneration.from_pretrained(model_name)

@app.post("/generate-report")
async def generate_report(data: dict):
    prompt = data.get("prompt")
    template = data.get("template")
    input_text = f"generate report: {prompt} {template}"
    inputs = tokenizer(input_text, return_tensors="pt", max_length=512, truncation=True)
    outputs = model.generate(**inputs, max_length=512)
    report = tokenizer.decode(outputs[0], skip_special_tokens=True)
    return {"report": report}

@app.get("/")
async def root():
    return {"message": "8001"}
