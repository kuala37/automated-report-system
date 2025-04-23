from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, validator
from typing import List, Optional, Dict, Literal
from document_generation.document_service import DocumentService

router = APIRouter(prefix="/documents", tags=["documents"])
document_service = DocumentService()

class Section(BaseModel):
    title: str
    prompt: str
    heading_level: int = 1
    generation_params: Optional[Dict] = None

class GenerateDocumentRequest(BaseModel):
    title: str
    sections: List[Section]
    filename: Optional[str] = None
    gost_type: Optional[Literal["7.32", "8.5"]] = None

    @validator('gost_type')
    def validate_gost_type(cls, v):
        if v and v not in ["7.32", "8.5"]:
            raise ValueError('gost_type must be either "7.32" or "8.5"')
        return v

@router.post("/generate")
async def generate_document(request: GenerateDocumentRequest):
    """Generate a Word document with AI-generated content following GOST standards if specified"""
    try:
        output_path = document_service.generate_report(
            request.title,
            [section.dict() for section in request.sections],
            request.filename,
            request.gost_type
        )
        return {
            "status": "success", 
            "file_path": output_path,
            "format": f"GOST {request.gost_type}" if request.gost_type else "Standard"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/list")
async def list_documents():
    """Get list of generated documents"""
    try:
        documents = document_service.get_report_list()
        return {"documents": documents}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))